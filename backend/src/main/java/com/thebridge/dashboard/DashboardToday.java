package com.thebridge.dashboard;

import java.time.LocalDate;
import java.util.List;

public record DashboardToday(
		LocalDate date,
		UserSummary user,
		Gems gems,
		Streak streak,
		Today today,
		Charts charts) {

	public record UserSummary(Long id, String displayName) {
	}

	public record Gems(long balance, long earnedToday) {
	}

	public record Streak(int current, boolean practicedToday) {
	}

	public record Today(DiaryState diary, CalmState calm, SleepState sleep) {
	}

	public record DiaryState(boolean done, Integer mood) {
	}

	public record CalmState(int sessions, int minutes) {
	}

	public record SleepState(boolean logged, Integer durationMinutes) {
	}

	public record Charts(List<SleepPoint> sleep, List<CalmPoint> calm) {
	}

	/** One night, labelled by the day it ended. Minutes are null when incomplete. */
	public record SleepPoint(LocalDate date, Integer minutes, Integer quality) {
	}

	public record CalmPoint(LocalDate date, int minutes, int sessions) {
	}
}
