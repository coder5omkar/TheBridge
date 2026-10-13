package com.thebridge.days;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.calm.CalmService;
import com.thebridge.calm.ExerciseSession;
import com.thebridge.calm.ExerciseSessionRepository;
import com.thebridge.calm.CalmDtos.ExerciseView;
import com.thebridge.common.DayWindow;
import com.thebridge.days.DayDtos.DayRecord;
import com.thebridge.days.DayDtos.DaySummary;
import com.thebridge.days.DayDtos.SessionLine;
import com.thebridge.days.DayDtos.WeightLine;
import com.thebridge.diary.DiaryEntry;
import com.thebridge.diary.DiaryEntryRepository;
import com.thebridge.diary.DiaryDtos;
import com.thebridge.health.Meal;
import com.thebridge.health.MealRepository;
import com.thebridge.health.HealthDtos.MealView;
import com.thebridge.health.WeightEntry;
import com.thebridge.health.WeightEntryRepository;
import com.thebridge.rewards.GemLedger;
import com.thebridge.rewards.GemLedgerRepository;
import com.thebridge.sleep.SleepLog;
import com.thebridge.sleep.SleepLogRepository;
import com.thebridge.sleep.SleepDtos;
import com.thebridge.user.User;

@Service
public class DayService {

	private final DiaryEntryRepository diaryEntryRepository;
	private final SleepLogRepository sleepLogRepository;
	private final ExerciseSessionRepository sessionRepository;
	private final MealRepository mealRepository;
	private final WeightEntryRepository weightEntryRepository;
	private final GemLedgerRepository gemLedgerRepository;
	private final CalmService calmService;

	public DayService(DiaryEntryRepository diaryEntryRepository, SleepLogRepository sleepLogRepository,
			ExerciseSessionRepository sessionRepository, MealRepository mealRepository,
			WeightEntryRepository weightEntryRepository, GemLedgerRepository gemLedgerRepository,
			CalmService calmService) {
		this.diaryEntryRepository = diaryEntryRepository;
		this.sleepLogRepository = sleepLogRepository;
		this.sessionRepository = sessionRepository;
		this.mealRepository = mealRepository;
		this.weightEntryRepository = weightEntryRepository;
		this.gemLedgerRepository = gemLedgerRepository;
		this.calmService = calmService;
	}

	/** Everything that happened on one day, in the user's own day boundaries. */
	@Transactional(readOnly = true)
	public DayRecord day(User user, LocalDate date) {
		DayWindow window = window(user);
		Instant from = window.startOf(date);
		Instant to = window.startOf(date.plusDays(1));

		DiaryDtos.View entry = diaryEntryRepository.findByUserIdAndEntryDate(user.getId(), date)
				.map(item -> DiaryDtos.View.from(item, window))
				.orElse(null);

		SleepDtos.View sleep = sleepLogRepository.findByUserIdAndSleepDate(user.getId(), date)
				.map(SleepDtos.View::from)
				.orElse(null);

		Map<Long, String> exerciseNames = new HashMap<>();
		for (ExerciseView exercise : calmService.exercises()) {
			exerciseNames.put(exercise.id(), exercise.name());
		}
		List<SessionLine> sessions = sessionRepository
				.findByUserIdAndCompletedTrueAndStartedAtGreaterThanEqualOrderByStartedAtAsc(user.getId(), from)
				.stream()
				.filter(session -> window.dayOf(session.getStartedAt()).equals(date))
				.map(session -> new SessionLine(
						exerciseNames.getOrDefault(session.getExerciseId(), "Practice"),
						session.getKind(), session.getStartedAt(), session.getDurationSec() / 60))
				.toList();

		List<MealView> meals = mealRepository
				.findByUserIdAndEatenAtBetweenOrderByEatenAtDesc(user.getId(), from, to)
				.stream()
				.map(MealView::from)
				.toList();

		List<WeightLine> weights = weightEntryRepository
				.findByUserIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(user.getId(), from, to)
				.stream()
				.map(weight -> new WeightLine(weight.getMeasuredAt(), weight.getWeightKg().doubleValue()))
				.toList();

		long gems = gemLedgerRepository.sumDeltaByUserBetween(user.getId(), from, to);

		return new DayRecord(date, entry, sleep, sessions, meals, weights, gems);
	}

	/** Rows for the Days list — from the user's onboarding day through today. */
	@Transactional(readOnly = true)
	public List<DaySummary> calendar(User user, int days) {
		int span = Math.min(Math.max(days, 1), 365);
		DayWindow window = window(user);
		LocalDate today = window.today();
		LocalDate from = today.minusDays(span - 1);
		LocalDate onboarded = user.getCreatedAt() == null
				? from
				: user.getCreatedAt().atZone(window.zone()).toLocalDate();
		if (onboarded.isAfter(from)) {
			from = onboarded;
		}
		Instant fromInstant = window.startOf(from);

		Map<LocalDate, DiaryEntry> entries = new HashMap<>();
		for (DiaryEntry entry : diaryEntryRepository
				.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(user.getId(), from, today)) {
			entries.put(entry.getEntryDate(), entry);
		}

		Map<LocalDate, SleepLog> sleepByDate = new HashMap<>();
		for (SleepLog log : sleepLogRepository
				.findByUserIdAndSleepDateBetweenOrderBySleepDateAsc(user.getId(), from, today)) {
			sleepByDate.put(log.getSleepDate(), log);
		}

		Map<LocalDate, int[]> calmByDay = new HashMap<>();
		for (ExerciseSession session : sessionRepository
				.findByUserIdAndCompletedTrueAndStartedAtGreaterThanEqualOrderByStartedAtAsc(user.getId(), fromInstant)) {
			calmByDay.merge(window.dayOf(session.getStartedAt()), new int[] { session.getDurationSec() / 60, 1 },
					(a, b) -> new int[] { a[0] + b[0], a[1] + b[1] });
		}

		Map<LocalDate, Integer> mealsByDay = new HashMap<>();
		for (Meal meal : mealRepository
				.findByUserIdAndEatenAtBetweenOrderByEatenAtDesc(user.getId(), fromInstant, window.startOf(today.plusDays(1)))) {
			mealsByDay.merge(window.dayOf(meal.getEatenAt()), 1, Integer::sum);
		}

		Map<LocalDate, Long> gemsByDay = new HashMap<>();
		for (GemLedger ledger : gemLedgerRepository
				.findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(user.getId(), fromInstant)) {
			gemsByDay.merge(window.dayOf(ledger.getCreatedAt()), (long) ledger.getDelta(), Long::sum);
		}

		List<DaySummary> result = new ArrayList<>();
		for (int i = 0; i < span; i++) {
			LocalDate date = from.plusDays(i);
			if (date.isAfter(today)) {
				break;
			}
			DiaryEntry entry = entries.get(date);
			SleepLog sleep = sleepByDate.get(date);
			int[] calm = calmByDay.getOrDefault(date, new int[2]);
			int mealCount = mealsByDay.getOrDefault(date, 0);
			long gems = gemsByDay.getOrDefault(date, 0L);

			boolean hasData = entry != null || sleep != null || calm[1] > 0 || mealCount > 0 || gems != 0;

			Integer sleepMinutes = null;
			if (sleep != null && sleep.getBedTime() != null && sleep.getWakeTime() != null) {
				sleepMinutes = (int) Math.max(0,
						java.time.Duration.between(sleep.getBedTime(), sleep.getWakeTime()).toMinutes());
			}

			result.add(new DaySummary(
					date,
					entry != null && entry.getSealedAt() != null,
					!window.editable(date),
					hasData,
					entry == null ? null : entry.getMood(),
					calm[0],
					sleepMinutes,
					mealCount,
					gems));
		}
		return result;
	}

	private DayWindow window(User user) {
		return new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
	}
}
