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
			String morningIntent, String eveningReview, String body, List<String> tags, Instant updatedAt) {

		static View from(DiaryEntry entry) {
			return new View(entry.getId(), entry.getEntryDate(), entry.getMood(), entry.getEnergy(),
					entry.getMorningIntent(), entry.getEveningReview(), entry.getBody(),
					entry.getTags() == null ? List.of() : Arrays.asList(entry.getTags()), entry.getUpdatedAt());
		}
	}

	public record UpsertRequest(
			@Min(1) @Max(5) Integer mood,
			@Min(1) @Max(5) Integer energy,
			String morningIntent,
			String eveningReview,
			String body,
			List<String> tags) {
	}

	public record Response(View entry, Rewards rewards) {
	}
}
