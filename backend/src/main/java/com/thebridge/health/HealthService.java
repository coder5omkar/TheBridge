package com.thebridge.health;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.IsoFields;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.thebridge.common.DayWindow;
import com.thebridge.health.HealthDtos.MealRequest;
import com.thebridge.health.HealthDtos.MealView;
import com.thebridge.health.HealthDtos.ProfileRequest;
import com.thebridge.health.HealthDtos.ProfileResponse;
import com.thebridge.health.HealthDtos.Summary;
import com.thebridge.health.HealthDtos.SummaryResponse;
import com.thebridge.health.HealthDtos.WeightPoint;
import com.thebridge.health.HealthDtos.WeightRequest;
import com.thebridge.rewards.GemService;
import com.thebridge.user.User;
import com.thebridge.user.UserRepository;

@Service
public class HealthService {

	private static final Set<String> MEAL_TYPES = Set.of("breakfast", "lunch", "dinner", "snack");
	private static final long MAX_PHOTO_BYTES = 5L * 1024 * 1024;
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final WeightEntryRepository weightRepository;
	private final MealRepository mealRepository;
	private final UserRepository userRepository;
	private final GemService gemService;
	private final MediaService mediaService;

	public HealthService(WeightEntryRepository weightRepository, MealRepository mealRepository,
			UserRepository userRepository, GemService gemService, MediaService mediaService) {
		this.weightRepository = weightRepository;
		this.mealRepository = mealRepository;
		this.userRepository = userRepository;
		this.gemService = gemService;
		this.mediaService = mediaService;
	}

	@Transactional(readOnly = true)
	public Summary summary(User user) {
		return buildSummary(user);
	}

	/** First weigh-in of each week earns +3 💎 — the rhythm matters more than the number. */
	@Transactional
	public SummaryResponse weighIn(User user, WeightRequest request) {
		ZoneId zone = ZoneId.of(user.getTimezone());
		Instant measuredAt = request.measuredAt() == null ? Instant.now() : request.measuredAt();

		WeightEntry entry = new WeightEntry();
		entry.setUserId(user.getId());
		entry.setMeasuredAt(measuredAt);
		entry.setWeightKg(BigDecimal.valueOf(request.weightKg()).setScale(2, RoundingMode.HALF_UP));
		entry.setNote(request.note() == null ? null : request.note().trim());
		weightRepository.save(entry);

		LocalDate localDate = measuredAt.atZone(zone).toLocalDate();
		long weekKey = localDate.get(IsoFields.WEEK_BASED_YEAR) * 100L
				+ localDate.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
		int gems = gemService.awardOnce(user.getId(), 3, "weigh_in", "weigh_in", weekKey, dayStart(user));

		return new SummaryResponse(buildSummary(user), gemService.rewards(user.getId(), dayStart(user), gems));
	}

	@Transactional
	public SummaryResponse addMeal(User user, MealRequest request) {
		String mealType = request.mealType() == null ? "" : request.mealType().toLowerCase(Locale.ROOT);
		if (!MEAL_TYPES.contains(mealType)) {
			throw new IllegalArgumentException("mealType must be one of " + MEAL_TYPES);
		}
		Meal meal = new Meal();
		meal.setUserId(user.getId());
		meal.setEatenAt(request.eatenAt() == null ? Instant.now() : request.eatenAt());
		meal.setMealType(mealType);
		meal.setDescription(request.description() == null ? null : request.description().trim());
		meal.setHomeCooked(Boolean.TRUE.equals(request.homeCooked()));
		mealRepository.save(meal);

		return new SummaryResponse(buildSummary(user), gemService.rewards(user.getId(), dayStart(user), 0));
	}

	/**
	 * Attach a (client-compressed, KB-sized) photo to a meal. Stored on S3 when
	 * configured, on local disk otherwise. Each photo gets an unguessable token
	 * so it renders in plain img tags.
	 */
	@Transactional
	public SummaryResponse attachPhoto(User user, Long mealId, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("No image uploaded.");
		}
		if (file.getSize() > MAX_PHOTO_BYTES) {
			throw new IllegalArgumentException("Image too large — compress to under 5 MB.");
		}
		String contentType = file.getContentType();
		if (contentType == null || !contentType.startsWith("image/")) {
			throw new IllegalArgumentException("Only image files are allowed.");
		}
		Meal meal = mealRepository.findById(mealId)
				.filter(item -> item.getUserId().equals(user.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Meal not found: " + mealId));

		try {
			String key = mediaService.storeMealPhoto(user.getId(), meal.getId(), file.getBytes());
			meal.setPhotoKey(key);
			if (meal.getPhotoToken() == null) {
				meal.setPhotoToken(randomToken());
			}
			mealRepository.save(meal);
		} catch (IOException e) {
			throw new IllegalStateException("Could not read the uploaded image", e);
		}

		return new SummaryResponse(buildSummary(user), gemService.rewards(user.getId(), dayStart(user), 0));
	}

	/** Serves a photo by its unguessable token (local stream or presigned S3 redirect). */
	@Transactional(readOnly = true)
	public ResponseEntity<byte[]> photoByToken(String token) {
		if (token == null || token.isBlank()) {
			return ResponseEntity.notFound().build();
		}
		Meal meal = mealRepository.findByPhotoToken(token).orElse(null);
		if (meal == null || meal.getPhotoKey() == null) {
			return ResponseEntity.notFound().build();
		}
		if (mediaService.s3Enabled()) {
			return ResponseEntity.status(HttpStatus.FOUND)
					.location(URI.create(mediaService.presignedUrl(meal.getPhotoKey())))
					.build();
		}
		return mediaService.readLocal(meal.getUserId(), meal.getId())
				.map(bytes -> ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(bytes))
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@Transactional
	public ProfileResponse setHeight(User user, ProfileRequest request) {
		User managed = userRepository.findById(user.getId())
				.orElseThrow(() -> new IllegalArgumentException("User not found"));
		managed.setHeightCm(BigDecimal.valueOf(request.heightCm()).setScale(1, RoundingMode.HALF_UP));
		userRepository.save(managed);
		return new ProfileResponse(request.heightCm());
	}

	private String randomToken() {
		byte[] bytes = new byte[24];
		SECURE_RANDOM.nextBytes(bytes);
		return HexFormat.of().formatHex(bytes);
	}

	private Summary buildSummary(User user) {
		ZoneId zone = ZoneId.of(user.getTimezone());
		DayWindow window = new DayWindow(zone, user.getDayStartHour());
		LocalDate today = window.today();
		Instant now = Instant.now();

		List<WeightEntry> entries = weightRepository
				.findByUserIdAndMeasuredAtGreaterThanEqualOrderByMeasuredAtAsc(user.getId(), now.minusSeconds(90 * 86400L));
		List<WeightPoint> points = entries.stream()
				.map(entry -> new WeightPoint(entry.getMeasuredAt().atZone(zone).toLocalDate(),
						entry.getMeasuredAt(), entry.getWeightKg().doubleValue()))
				.toList();

		WeightEntry latest = entries.isEmpty() ? null : entries.get(entries.size() - 1);
		Double latestKg = latest == null ? null : latest.getWeightKg().doubleValue();
		Instant latestWeightAt = latest == null ? null : latest.getMeasuredAt();

		Double change7d = null;
		List<WeightEntry> lastWeek = entries.stream()
				.filter(entry -> entry.getMeasuredAt().isAfter(now.minusSeconds(7 * 86400L)))
				.toList();
		if (lastWeek.size() >= 2) {
			change7d = round1(lastWeek.get(lastWeek.size() - 1).getWeightKg()
					.subtract(lastWeek.get(0).getWeightKg()).doubleValue());
		}

		Double heightCm = user.getHeightCm() == null ? null : user.getHeightCm().doubleValue();
		Double bmi = null;
		if (heightCm != null && latestKg != null && heightCm > 0) {
			double meters = heightCm / 100.0;
			bmi = round1(latestKg / (meters * meters));
		}

		Instant dayStart = window.startOf(today);
		Instant dayEnd = window.startOf(today.plusDays(1));
		List<Meal> todayMeals = mealRepository
				.findByUserIdAndEatenAtBetweenOrderByEatenAtDesc(user.getId(), dayStart, dayEnd);

		List<Meal> weekMeals = mealRepository.findByUserIdAndEatenAtBetweenOrderByEatenAtDesc(
				user.getId(), window.startOf(today.minusDays(6)), dayEnd);
		long homeCooked = weekMeals.stream().filter(meal -> Boolean.TRUE.equals(meal.getHomeCooked())).count();
		Double homeRatio = weekMeals.isEmpty() ? null
				: round1(homeCooked * 100.0 / weekMeals.size());

		return new Summary(
				heightCm,
				latestKg,
				latestWeightAt,
				change7d,
				points,
				todayMeals.size(),
				todayMeals.stream().map(MealView::from).toList(),
				weekMeals.size(),
				homeRatio,
				bmi);
	}

	private Instant dayStart(User user) {
		DayWindow window = new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
		return window.startOf(window.today());
	}

	private double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}
}
