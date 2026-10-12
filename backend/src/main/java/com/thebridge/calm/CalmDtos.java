package com.thebridge.calm;

import java.time.Instant;
import java.util.List;

import tools.jackson.databind.JsonNode;
import com.thebridge.rewards.Rewards;

import jakarta.validation.constraints.NotNull;

public final class CalmDtos {

	private CalmDtos() {
	}

	public record ExerciseView(Long id, String slug, String name, String type, JsonNode pattern,
			List<Integer> durationOptions, String description, boolean sos) {
	}

	public record SessionRequest(
			@NotNull Long exerciseId,
			String kind,
			Instant startedAt,
			Integer durationSec,
			Boolean completed) {
	}

	public record SessionView(Long id, Long exerciseId, String kind, Instant startedAt,
			int durationSec, boolean completed, int gemsAwarded) {

		static SessionView from(ExerciseSession session) {
			return new SessionView(session.getId(), session.getExerciseId(), session.getKind(),
					session.getStartedAt(), session.getDurationSec(), session.isCompleted(),
					session.getGemsAwarded());
		}
	}

	public record SessionResponse(SessionView session, Rewards rewards) {
	}
}
