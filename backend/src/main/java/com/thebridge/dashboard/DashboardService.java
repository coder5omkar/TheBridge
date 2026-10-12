package com.thebridge.dashboard;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.calm.ExerciseSessionRepository;
import com.thebridge.common.DayWindow;
import com.thebridge.dashboard.DashboardToday.CalmPoint;
import com.thebridge.dashboard.DashboardToday.CalmState;
import com.thebridge.dashboard.DashboardToday.Charts;
import com.thebridge.dashboard.DashboardToday.DiaryState;
import com.thebridge.dashboard.DashboardToday.Gems;
import com.thebridge.dashboard.DashboardToday.SleepPoint;
import com.thebridge.dashboard.DashboardToday.SleepState;
import com.thebridge.dashboard.DashboardToday.Streak;
import com.thebridge.dashboard.DashboardToday.Today;
import com.thebridge.dashboard.DashboardToday.UserSummary;
import com.thebridge.diary.DiaryEntry;
import com.thebridge.diary.DiaryEntryRepository;
import com.thebridge.rewards.GemLedgerRepository;
import com.thebridge.rewards.GemService;
import com.thebridge.sleep.SleepLog;
import com.thebridge.sleep.SleepLogRepository;
import com.thebridge.user.User;

@Service
public class DashboardService {

	private static final int CHART_DAYS = 14;

	private final GemService gemService;
	private final GemLedgerRepository gemLedgerRepository;
	private final DiaryEntryRepository diaryEntryRepository;
	private final ExerciseSessionRepository sessionRepository;
	private final SleepLogRepository sleepLogRepository;

	public DashboardService(GemService gemService, GemLedgerRepository gemLedgerRepository,
			DiaryEntryRepository diaryEntryRepository, ExerciseSessionRepository sessionRepository,
			SleepLogRepository sleepLogRepository) {
		this.gemService = gemService;
		this.gemLedgerRepository = gemLedgerRepository;
		this.diaryEntryRepository = diaryEntryRepository;
		this.sessionRepository = sessionRepository;
		this.sleepLogRepository = sleepLogRepository;
	}

	@Transactional(readOnly = true)
	public DashboardToday today(User user) {
		DayWindow window = new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
		LocalDate today = window.today();
		Instant since = window.startOf(today);
		LocalDate chartFrom = today.minusDays(CHART_DAYS - 1);

		long balance = gemService.balance(user.getId());
		long earnedToday = gemService.earnedSince(user.getId(), since);

		DiaryState diary = diaryState(user, today);
		Map<LocalDate, int[]> calmByDay = calmByDay(user, window, window.startOf(chartFrom));
		CalmState calm = calmState(calmByDay.getOrDefault(today, new int[2]));
		List<SleepLog> sleepLogs = sleepLogRepository
				.findByUserIdAndSleepDateBetweenOrderBySleepDateAsc(user.getId(), chartFrom, today);
		SleepState sleep = sleepState(sleepLogs, today);

		List<SleepPoint> sleepChart = sleepLogs.stream()
				.map(log -> new SleepPoint(log.getSleepDate(), minutes(log), log.getQuality()))
				.toList();
		List<CalmPoint> calmChart = new ArrayList<>();
		for (int i = 0; i < CHART_DAYS; i++) {
			LocalDate date = chartFrom.plusDays(i);
			int[] totals = calmByDay.getOrDefault(date, new int[2]);
			calmChart.add(new CalmPoint(date, totals[0], totals[1]));
		}

		return new DashboardToday(
				today,
				new UserSummary(user.getId(), user.getDisplayName()),
				new Gems(balance, earnedToday),
				computeStreak(user, window, today),
				new Today(diary, calm, sleep),
				new Charts(sleepChart, calmChart));
	}

	private DiaryState diaryState(User user, LocalDate today) {
		DiaryEntry entry = diaryEntryRepository.findByUserIdAndEntryDate(user.getId(), today).orElse(null);
		return entry == null ? new DiaryState(false, null) : new DiaryState(true, entry.getMood());
	}

	/** Completed-session minutes and counts grouped by the user's own days. */
	private Map<LocalDate, int[]> calmByDay(User user, DayWindow window, Instant since) {
		return sessionRepository
				.findByUserIdAndCompletedTrueAndStartedAtGreaterThanEqualOrderByStartedAtAsc(user.getId(), since)
				.stream()
				.collect(Collectors.toMap(
						session -> window.dayOf(session.getStartedAt()),
						session -> new int[] { session.getDurationSec() / 60, 1 },
						(a, b) -> new int[] { a[0] + b[0], a[1] + b[1] }));
	}

	private CalmState calmState(int[] totals) {
		return new CalmState(totals[1], totals[0]);
	}

	private SleepState sleepState(List<SleepLog> sleepLogs, LocalDate today) {
		return sleepLogs.stream()
				.filter(log -> log.getSleepDate().equals(today))
				.filter(log -> log.getWakeTime() != null)
				.findFirst()
				.map(log -> new SleepState(true, minutes(log)))
				.orElse(new SleepState(false, null));
	}

	private Integer minutes(SleepLog log) {
		if (log.getBedTime() == null || log.getWakeTime() == null) {
			return null;
		}
		return (int) Math.max(0, java.time.Duration.between(log.getBedTime(), log.getWakeTime()).toMinutes());
	}

	private Streak computeStreak(User user, DayWindow window, LocalDate today) {
		Set<LocalDate> practicedDays = new HashSet<>();
		for (Instant timestamp : gemLedgerRepository.positiveTimestamps(user.getId())) {
			practicedDays.add(window.dayOf(timestamp));
		}
		boolean practicedToday = practicedDays.contains(today);
		LocalDate cursor = practicedToday ? today
				: practicedDays.contains(today.minusDays(1)) ? today.minusDays(1) : null;
		int current = 0;
		while (cursor != null && practicedDays.contains(cursor)) {
			current++;
			cursor = cursor.minusDays(1);
		}
		return new Streak(current, practicedToday);
	}
}
