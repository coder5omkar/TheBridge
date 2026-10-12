package com.thebridge.dashboard;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.thebridge.common.DayWindow;
import com.thebridge.dashboard.DashboardToday.Gems;
import com.thebridge.dashboard.DashboardToday.Streak;
import com.thebridge.dashboard.DashboardToday.UserSummary;
import com.thebridge.rewards.GemLedgerRepository;
import com.thebridge.user.User;

@Service
public class DashboardService {

	private final GemLedgerRepository gemLedgerRepository;

	public DashboardService(GemLedgerRepository gemLedgerRepository) {
		this.gemLedgerRepository = gemLedgerRepository;
	}

	public DashboardToday today(User user) {
		DayWindow window = new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
		LocalDate today = window.today();

		long balance = gemLedgerRepository.sumDeltaByUser(user.getId());
		long earnedToday = gemLedgerRepository.sumDeltaByUserSince(user.getId(), window.startOf(today));

		Set<LocalDate> practicedDays = new HashSet<>();
		for (var timestamp : gemLedgerRepository.positiveTimestamps(user.getId())) {
			practicedDays.add(window.dayOf(timestamp));
		}

		return new DashboardToday(
				today,
				new UserSummary(user.getId(), user.getDisplayName()),
				new Gems(balance, earnedToday),
				computeStreak(practicedDays, today));
	}

	/**
	 * Streak with grace: practicing yesterday keeps the streak alive even before
	 * today's first practice — missing a day only breaks it once it is truly missed.
	 */
	private Streak computeStreak(Set<LocalDate> practicedDays, LocalDate today) {
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
