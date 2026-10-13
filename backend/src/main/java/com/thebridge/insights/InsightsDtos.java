package com.thebridge.insights;

import java.time.LocalDate;
import java.util.List;

public final class InsightsDtos {

	private InsightsDtos() {
	}

	public record Bullet(String icon, String text) {
	}

	public record WeeklyInsights(
			LocalDate from,
			LocalDate to,
			int gemsEarnedWeek,
			Integer rhythmConsistency,
			Integer rhythmChecks,
			Integer rhythmPossible,
			Integer sleepAvgMinutes,
			Integer sleepNights,
			int calmMinutes,
			int calmSessions,
			Double moodAvg,
			String bestHabit,
			Integer bestHabitDays,
			String ignoredHabit,
			Integer ignoredHabitDays,
			List<Bullet> bullets) {
	}
}
