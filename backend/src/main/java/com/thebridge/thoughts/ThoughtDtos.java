package com.thebridge.thoughts;

import java.time.Instant;
import java.util.Set;

import com.thebridge.rewards.Rewards;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ThoughtDtos {

	private ThoughtDtos() {
	}

	public record View(Long id, String content, String kind, String status, String reframe,
			Instant createdAt, Instant releasedAt) {

		static View from(Thought thought) {
			return new View(thought.getId(), thought.getContent(), thought.getKind(), thought.getStatus(),
					thought.getReframe(), thought.getCreatedAt(), thought.getReleasedAt());
		}
	}

	public record CreateRequest(@NotBlank @Size(max = 2000) String content, String kind) {
	}

	public record UpdateRequest(@Size(max = 2000) String reframe, Boolean release) {
	}

	public record Response(View thought, Rewards rewards) {
	}

	static final Set<String> KINDS = Set.of("worry", "idea", "gratitude", "task");
}
