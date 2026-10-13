package com.thebridge.sleep;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.common.DayWindow;
import com.thebridge.rewards.GemService;
import com.thebridge.sleep.SleepDtos.BedtimeRequest;
import com.thebridge.sleep.SleepDtos.Response;
import com.thebridge.sleep.SleepDtos.View;
import com.thebridge.sleep.SleepDtos.WakeRequest;
import com.thebridge.user.User;

@Service
public class SleepService {

	private final SleepLogRepository repository;
	private final GemService gemService;

	public SleepService(SleepLogRepository repository, GemService gemService) {
		this.repository = repository;
		this.gemService = gemService;
	}

	/**
	 * "Going to bed now" — the night belongs to the day you will wake up on.
	 */
	@Transactional
	public Response bedtime(User user, BedtimeRequest request) {
		DayWindow window = window(user);
		Instant bedTime = request != null && request.bedTime() != null ? request.bedTime() : Instant.now();
		// Bedtimes before noon belong to that same night (after-midnight); evening beds wake the next day.
		int hour = bedTime.atZone(window.zone()).getHour();
		LocalDate sleepDate = hour < 12 ? window.dayOf(bedTime) : window.dayOf(bedTime).plusDays(1);

		SleepLog log = repository.findByUserIdAndSleepDate(user.getId(), sleepDate).orElseGet(() -> {
			SleepLog created = new SleepLog();
			created.setUserId(user.getId());
			created.setSleepDate(sleepDate);
			return created;
		});
		log.setBedTime(bedTime);
		repository.save(log);

		Instant since = window.startOf(window.today());
		return new Response(View.from(log), gemService.rewards(user.getId(), since, 0));
	}

	/**
	 * "I'm awake" — completes last night's row (or creates a wake-only row if the
	 * bedtime was never recorded). First wake-up of the night earns +1 gem.
	 */
	@Transactional
	public Response wake(User user, WakeRequest request) {
		DayWindow window = window(user);
		Instant wakeTime = request != null && request.wakeTime() != null ? request.wakeTime() : Instant.now();
		LocalDate sleepDate = window.dayOf(wakeTime);

		SleepLog log = repository.findByUserIdAndSleepDate(user.getId(), sleepDate).orElseGet(() -> {
			SleepLog created = new SleepLog();
			created.setUserId(user.getId());
			created.setSleepDate(sleepDate);
			return created;
		});
		boolean firstWake = log.getWakeTime() == null;
		log.setWakeTime(wakeTime);
		if (request != null && request.quality() != null) {
			log.setQuality(request.quality());
		}
		repository.save(log);

		Instant since = window.startOf(window.today());
		int gems = firstWake
				? gemService.awardOnce(user.getId(), 1, "sleep_log", "sleep_log", log.getId(), since)
				: 0;
		return new Response(View.from(log), gemService.rewards(user.getId(), since, gems));
	}

	@Transactional(readOnly = true)
	public Optional<View> latest(User user) {
		return repository.findTopByUserIdOrderBySleepDateDesc(user.getId()).map(View::from);
	}

	private DayWindow window(User user) {
		return new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
	}
}
