package com.thebridge.days;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.thebridge.diary.DiaryDtos;
import com.thebridge.health.HealthDtos;
import com.thebridge.sleep.SleepDtos;

public final class DayDtos {

	private DayDtos() {
	}

	/** One calm practice on that day. */
	public record SessionLine(String exerciseName, String kind, Instant startedAt, int minutes) {
	}

	public record WeightLine(Instant at, double kg) {
	}

	/** The full record of one day: everything you did, reconstructed. */
	public record DayRecord(
			LocalDate date,
			DiaryDtos.View entry,
			SleepDtos.View sleep,
			List<SessionLine> sessions,
			List<HealthDtos.MealView> meals,
			List<WeightLine> weights,
			long gemsEarned) {
	}

	/** One row of the Days list. */
	public record DaySummary(
			LocalDate date,
			boolean sealed,
			Integer mood,
			int calmMinutes,
			Integer sleepMinutes,
			int meals,
			long gems) {
	}
}
