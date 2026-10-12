package com.thebridge.dashboard;

import java.time.LocalDate;

public record DashboardToday(
		LocalDate date,
		UserSummary user,
		Gems gems,
		Streak streak) {

	public record UserSummary(Long id, String displayName) {
	}

	public record Gems(long balance, long earnedToday) {
	}

	public record Streak(int current, boolean practicedToday) {
	}
}
