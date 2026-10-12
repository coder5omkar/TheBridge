package com.thebridge.habits;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.common.DayWindow;
import com.thebridge.habits.HabitDtos.CreateRequest;
import com.thebridge.habits.HabitDtos.Response;
import com.thebridge.habits.HabitDtos.Today;
import com.thebridge.habits.HabitDtos.View;
import com.thebridge.rewards.GemService;
import com.thebridge.user.User;

@Service
public class HabitService {

	private final HabitRepository habitRepository;
	private final HabitLogRepository habitLogRepository;
	private final GemService gemService;

	public HabitService(HabitRepository habitRepository, HabitLogRepository habitLogRepository,
			GemService gemService) {
		this.habitRepository = habitRepository;
		this.habitLogRepository = habitLogRepository;
		this.gemService = gemService;
	}

	@Transactional(readOnly = true)
	public Today today(User user) {
		return buildToday(user);
	}

	@Transactional
	public Response create(User user, CreateRequest request) {
		String part = request.part() == null ? "" : request.part().toLowerCase(Locale.ROOT);
		if (!HabitDtos.PARTS.contains(part)) {
			part = "anytime";
		}
		List<Habit> existing = habitRepository.findByUserIdAndActiveTrueOrderBySortOrderAscIdAsc(user.getId());

		Habit habit = new Habit();
		habit.setUserId(user.getId());
		habit.setName(request.name().trim());
		habit.setEmoji(request.emoji() == null || request.emoji().isBlank() ? "✅" : request.emoji().trim());
		habit.setPart(part);
		habit.setSortOrder(existing.size());
		habit.setActive(true);
		habitRepository.save(habit);

		return new Response(buildToday(user), rewards(user, 0));
	}

	/** Tap to check off, tap again to undo. +1 💎 once per habit per day. */
	@Transactional
	public Response toggle(User user, Long habitId) {
		habitRepository.findByIdAndUserIdAndActiveTrue(habitId, user.getId())
				.orElseThrow(() -> new IllegalArgumentException("Habit not found: " + habitId));

		DayWindow window = window(user);
		LocalDate today = window.today();

		int gems = 0;
		HabitLog existing = habitLogRepository.findByHabitIdAndLogDate(habitId, today).orElse(null);
		if (existing != null) {
			habitLogRepository.delete(existing);
		} else {
			HabitLog log = new HabitLog();
			log.setUserId(user.getId());
			log.setHabitId(habitId);
			log.setLogDate(today);
			habitLogRepository.save(log);
			// refId is stable per (habit, day), so unchecking and rechecking never double-earns.
			long refId = today.toEpochDay() * 1000 + habitId;
			gems = gemService.awardOnce(user.getId(), 1, "habit_done", "habit", refId, window.startOf(today));
		}

		return new Response(buildToday(user), rewards(user, gems));
	}

	@Transactional
	public void archive(User user, Long habitId) {
		Habit habit = habitRepository.findByIdAndUserIdAndActiveTrue(habitId, user.getId())
				.orElseThrow(() -> new IllegalArgumentException("Habit not found: " + habitId));
		habit.setActive(false);
		habitRepository.save(habit);
	}

	private Today buildToday(User user) {
		DayWindow window = window(user);
		LocalDate today = window.today();

		List<Habit> habits = habitRepository.findByUserIdAndActiveTrueOrderBySortOrderAscIdAsc(user.getId());
		List<HabitLog> logs = habitLogRepository.findByUserIdAndLogDateGreaterThanEqual(user.getId(),
				today.minusDays(365));

		Map<Long, Set<LocalDate>> byHabit = new HashMap<>();
		for (HabitLog log : logs) {
			byHabit.computeIfAbsent(log.getHabitId(), key -> new HashSet<>()).add(log.getLogDate());
		}

		List<View> views = new ArrayList<>();
		int doneCount = 0;
		for (Habit habit : habits) {
			Set<LocalDate> days = byHabit.getOrDefault(habit.getId(), Set.of());
			boolean done = days.contains(today);
			if (done) {
				doneCount++;
			}
			views.add(new View(habit.getId(), habit.getName(), habit.getEmoji(), habit.getPart(),
					done, streak(days, today), last7(days, today)));
		}

		LocalDate weekFrom = today.minusDays(6);
		int weekDone = (int) logs.stream().filter(log -> !log.getLogDate().isBefore(weekFrom)).count();

		return new Today(today, views, doneCount, habits.size(), weekDone, habits.size() * 7);
	}

	private int streak(Set<LocalDate> days, LocalDate today) {
		LocalDate cursor = days.contains(today) ? today
				: days.contains(today.minusDays(1)) ? today.minusDays(1) : null;
		int count = 0;
		while (cursor != null && days.contains(cursor)) {
			count++;
			cursor = cursor.minusDays(1);
		}
		return count;
	}

	private List<Boolean> last7(Set<LocalDate> days, LocalDate today) {
		List<Boolean> result = new ArrayList<>(7);
		for (int i = 6; i >= 0; i--) {
			result.add(days.contains(today.minusDays(i)));
		}
		return result;
	}

	private DayWindow window(User user) {
		return new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
	}

	private com.thebridge.rewards.Rewards rewards(User user, int gems) {
		DayWindow window = window(user);
		return gemService.rewards(user.getId(), window.startOf(window.today()), gems);
	}
}
