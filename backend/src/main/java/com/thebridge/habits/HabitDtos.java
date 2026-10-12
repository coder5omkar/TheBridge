package com.thebridge.habits;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import com.thebridge.rewards.Rewards;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class HabitDtos {

	private HabitDtos() {
	}

	static final Set<String> PARTS = Set.of("morning", "afternoon", "evening", "anytime");

	public record CreateRequest(
			@NotBlank @Size(max = 100) String name,
			@Size(max = 8) String emoji,
			String part) {
	}

	/** One habit for today: done state, current streak, and the last 7 days (oldest → today). */
	public record View(Long id, String name, String emoji, String part, boolean done,
			int streak, List<Boolean> last7) {
	}

	public record Today(
			LocalDate date,
			List<View> habits,
			int doneCount,
			int totalCount,
			int weekDone,
			int weekTotal) {
	}

	public record Response(Today today, Rewards rewards) {
	}
}
