package com.thebridge.diary;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import com.thebridge.rewards.Rewards;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public final class DiaryDtos {

	private DiaryDtos() {
	}

	public record View(Long id, LocalDate date, Integer mood, Integer energy,
			String morningIntent, String eveningReview, String body, List<String> tags,
			Integer waterCups, String highlights, String drained, String gratitude, Boolean moved,
			Instant updatedAt) {

		static View from(DiaryEntry entry) {
			return new View(entry.getId(), entry.getEntryDate(), entry.getMood(), entry.getEnergy(),
					entry.getMorningIntent(), entry.getEveningReview(), entry.getBody(),
					entry.getTags() == null ? List.of() : Arrays.asList(entry.getTags()),
					entry.getWaterCups(), entry.getHighlights(), entry.getDrained(), entry.getGratitude(),
					entry.getMoved(), entry.getUpdatedAt());
		}
	}

	public record UpsertRequest(
			@Min(1) @Max(5) Integer mood,
			@Min(1) @Max(5) Integer energy,
			String morningIntent,
			String eveningReview,
			String body,
			List<String> tags,
			@Min(0) @Max(30) Integer waterCups,
			String highlights,
			String drained,
			String gratitude,
			Boolean moved) {
	}

	public record Response(View entry, Rewards rewards) {
	}
}
