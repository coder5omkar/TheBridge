package com.thebridge.sleep;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

import com.thebridge.rewards.Rewards;

public final class SleepDtos {

	private SleepDtos() {
	}

	public record BedtimeRequest(Instant bedTime) {
	}

	public record WakeRequest(Instant wakeTime, Integer quality) {
	}

	public record View(Long id, LocalDate sleepDate, Instant bedTime, Instant wakeTime,
			Integer durationMinutes, Integer quality, String delayNote) {

		static View from(SleepLog log) {
			return new View(log.getId(), log.getSleepDate(), log.getBedTime(), log.getWakeTime(),
					duration(log), log.getQuality(), log.getDelayNote());
		}

		private static Integer duration(SleepLog log) {
			if (log.getBedTime() == null || log.getWakeTime() == null) {
				return null;
			}
			long minutes = Duration.between(log.getBedTime(), log.getWakeTime()).toMinutes();
			return (int) Math.max(0, minutes);
		}
	}

	public record Response(View log, Rewards rewards) {
	}
}
