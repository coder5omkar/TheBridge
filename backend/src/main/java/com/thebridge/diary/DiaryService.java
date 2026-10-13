package com.thebridge.diary;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.common.DayFrozenException;
import com.thebridge.common.DaySealedException;
import com.thebridge.common.DayWindow;
import com.thebridge.diary.DiaryDtos.Response;
import com.thebridge.diary.DiaryDtos.UpsertRequest;
import com.thebridge.diary.DiaryDtos.View;
import com.thebridge.rewards.GemService;
import com.thebridge.user.User;

@Service
public class DiaryService {

	private final DiaryEntryRepository repository;
	private final GemService gemService;

	public DiaryService(DiaryEntryRepository repository, GemService gemService) {
		this.repository = repository;
		this.gemService = gemService;
	}

	@Transactional(readOnly = true)
	public Optional<View> entry(User user, LocalDate date) {
		DayWindow window = window(user);
		return repository.findByUserIdAndEntryDate(user.getId(), date).map(entry -> View.from(entry, window));
	}

	@Transactional(readOnly = true)
	public Optional<View> today(User user) {
		return entry(user, window(user).today());
	}

	@Transactional
	public Response saveToday(User user, UpsertRequest request) {
		return save(user, window(user).today(), request);
	}

	/**
	 * A day can be written until 12:00 PM the next day — then it is frozen for good.
	 */
	@Transactional
	public Response save(User user, LocalDate date, UpsertRequest request) {
		DayWindow window = window(user);
		if (date.isAfter(window.today())) {
			throw new IllegalArgumentException("You cannot write a future day.");
		}
		if (!window.editable(date)) {
			throw new DayFrozenException();
		}
		Instant since = window.startOf(date);

		DiaryEntry entry = repository.findByUserIdAndEntryDate(user.getId(), date).orElse(null);
		boolean created = entry == null;
		if (created) {
			entry = new DiaryEntry();
			entry.setUserId(user.getId());
			entry.setEntryDate(date);
		}

		entry.setMood(request.mood());
		entry.setEnergy(request.energy());
		entry.setMorningIntent(trimToNull(request.morningIntent()));
		entry.setEveningReview(trimToNull(request.eveningReview()));
		entry.setBody(trimToNull(request.body()));
		entry.setTags(request.tags() == null ? new String[0] : request.tags().toArray(String[]::new));
		entry.setWaterCups(request.waterCups());
		entry.setHighlights(trimToNull(request.highlights()));
		entry.setDrained(trimToNull(request.drained()));
		entry.setGratitude(trimToNull(request.gratitude()));
		entry.setMoved(request.moved());
		entry.setUpdatedAt(Instant.now());
		repository.save(entry);

		int gems = 0;
		if (created) {
			gems += gemService.awardOnce(user.getId(), 2, "diary_entry", "diary_entry", entry.getId(), since);
		}
		if (entry.getEveningReview() != null) {
			gems += gemService.awardOnce(user.getId(), 3, "evening_review", "evening_review", entry.getId(), since);
		}

		return new Response(View.from(entry, window), gemService.rewards(user.getId(), since, gems));
	}

	@Transactional
	public Response sealToday(User user) {
		return seal(user, window(user).today());
	}

	/**
	 * The nightly ritual: mark a day complete (+5 💎). Sealing does not lock the
	 * day — the freeze at noon the next day does.
	 */
	@Transactional
	public Response seal(User user, LocalDate date) {
		DayWindow window = window(user);
		if (date.isAfter(window.today())) {
			throw new IllegalArgumentException("You cannot seal a future day.");
		}
		if (!window.editable(date)) {
			throw new DayFrozenException();
		}
		Instant since = window.startOf(date);

		DiaryEntry entry = repository.findByUserIdAndEntryDate(user.getId(), date)
				.orElseThrow(() -> new IllegalArgumentException(
						"Nothing to seal yet — answer a few questions first."));
		if (entry.getSealedAt() != null) {
			throw new DaySealedException();
		}
		if (entry.getEveningReview() == null || entry.getEveningReview().isBlank()) {
			throw new IllegalArgumentException(
					"The evening review is the seal — write a line about the day first.");
		}

		entry.setSealedAt(Instant.now());
		entry.setUpdatedAt(Instant.now());
		repository.save(entry);

		int gems = gemService.awardOnce(user.getId(), 5, "day_sealed", "day_sealed", date.toEpochDay(), since);
		return new Response(View.from(entry, window), gemService.rewards(user.getId(), since, gems));
	}

	private DayWindow window(User user) {
		return new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
