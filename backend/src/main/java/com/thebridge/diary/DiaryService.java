package com.thebridge.diary;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.common.DayWindow;
import com.thebridge.diary.DiaryDtos.Response;
import com.thebridge.diary.DiaryDtos.UpsertRequest;
import com.thebridge.diary.DiaryDtos.View;
import com.thebridge.rewards.GemService;
import com.thebridge.user.User;

@Service
public class DiaryService {

	private final DiaryEntryRepository repository;
	private final GemService gemService;

	public DiaryService(DiaryEntryRepository repository, GemService gemService) {
		this.repository = repository;
		this.gemService = gemService;
	}

	@Transactional(readOnly = true)
	public Optional<View> today(User user) {
		DayWindow window = window(user);
		return repository.findByUserIdAndEntryDate(user.getId(), window.today()).map(View::from);
	}

	@Transactional
	public Response save(User user, UpsertRequest request) {
		DayWindow window = window(user);
		LocalDate today = window.today();
		Instant since = window.startOf(today);

		DiaryEntry entry = repository.findByUserIdAndEntryDate(user.getId(), today).orElse(null);
		boolean created = entry == null;
		if (created) {
			entry = new DiaryEntry();
			entry.setUserId(user.getId());
			entry.setEntryDate(today);
		}

		entry.setMood(request.mood());
		entry.setEnergy(request.energy());
		entry.setMorningIntent(trimToNull(request.morningIntent()));
		entry.setEveningReview(trimToNull(request.eveningReview()));
		entry.setBody(trimToNull(request.body()));
		entry.setTags(request.tags() == null ? new String[0] : request.tags().toArray(String[]::new));
		entry.setUpdatedAt(Instant.now());
		repository.save(entry);

		int gems = 0;
		if (created) {
			gems += gemService.awardOnce(user.getId(), 2, "diary_entry", "diary_entry", entry.getId(), since);
		}
		if (entry.getEveningReview() != null) {
			gems += gemService.awardOnce(user.getId(), 3, "evening_review", "evening_review", entry.getId(), since);
		}

		return new Response(View.from(entry), gemService.rewards(user.getId(), since, gems));
	}

	private DayWindow window(User user) {
		return new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
