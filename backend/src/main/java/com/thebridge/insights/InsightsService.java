package com.thebridge.insights;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.calm.ExerciseSession;
import com.thebridge.calm.ExerciseSessionRepository;
import com.thebridge.common.DayWindow;
import com.thebridge.diary.DiaryEntry;
import com.thebridge.diary.DiaryEntryRepository;
import com.thebridge.insights.InsightsDtos.Bullet;
import com.thebridge.insights.InsightsDtos.WeeklyInsights;
import com.thebridge.rewards.GemLedgerRepository;
import com.thebridge.sleep.SleepLog;
import com.thebridge.sleep.SleepLogRepository;
import com.thebridge.user.User;

/**
 * The "see the pattern" half of the loop: honest, templated observations.
 * Always hedged — patterns, not proof.
 */
@Service
public class InsightsService {

	private final GemLedgerRepository gemLedgerRepository;
	private final DiaryEntryRepository diaryEntryRepository;
	private final SleepLogRepository sleepLogRepository;
	private final ExerciseSessionRepository sessionRepository;

	public InsightsService(GemLedgerRepository gemLedgerRepository, DiaryEntryRepository diaryEntryRepository,
			SleepLogRepository sleepLogRepository, ExerciseSessionRepository sessionRepository) {
		this.gemLedgerRepository = gemLedgerRepository;
		this.diaryEntryRepository = diaryEntryRepository;
		this.sleepLogRepository = sleepLogRepository;
		this.sessionRepository = sessionRepository;
	}

	@Transactional(readOnly = true)
	public WeeklyInsights weekly(User user) {
		DayWindow window = new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
		LocalDate today = window.today();
		LocalDate from = today.minusDays(6);
		Instant fromInstant = window.startOf(from);
		Long userId = user.getId();

		// Gems
		int gems = (int) gemLedgerRepository.sumDeltaByUserSince(userId, fromInstant);

		// Sealed days
		List<DiaryEntry> entries = diaryEntryRepository
				.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(userId, from, today);
		int sealedDays = (int) entries.stream().filter(entry -> entry.getSealedAt() != null).count();

		// Sleep
		List<SleepLog> sleepLogs = sleepLogRepository
				.findByUserIdAndSleepDateBetweenOrderBySleepDateAsc(userId, from, today);
		List<Long> nightMinutes = sleepLogs.stream()
				.filter(log -> log.getBedTime() != null && log.getWakeTime() != null)
				.map(log -> Duration.between(log.getBedTime(), log.getWakeTime()).toMinutes())
				.filter(minutes -> minutes > 0)
				.toList();
		Integer sleepAvg = nightMinutes.size() >= 2
				? (int) Math.round(nightMinutes.stream().mapToLong(Long::longValue).average().orElse(0))
				: null;

		// Calm
		List<ExerciseSession> sessions = sessionRepository
				.findByUserIdAndCompletedTrueAndStartedAtGreaterThanEqualOrderByStartedAtAsc(userId, fromInstant);
		int calmMinutes = sessions.stream().mapToInt(session -> session.getDurationSec() / 60).sum();
		Set<LocalDate> calmDays = sessions.stream()
				.map(session -> window.dayOf(session.getStartedAt()))
				.collect(Collectors.toSet());

		// Mood
		List<Integer> moods = entries.stream().map(DiaryEntry::getMood).filter(Objects::nonNull).toList();
		Double moodAvg = moods.size() >= 2 ? round1(avg(moods)) : null;
		List<Integer> moodOnCalm = entries.stream()
				.filter(entry -> entry.getMood() != null && calmDays.contains(entry.getEntryDate()))
				.map(DiaryEntry::getMood)
				.toList();
		List<Integer> moodOffCalm = entries.stream()
				.filter(entry -> entry.getMood() != null && !calmDays.contains(entry.getEntryDate()))
				.map(DiaryEntry::getMood)
				.toList();
		boolean hasCalmComparison = moodOnCalm.size() >= 2 && moodOffCalm.size() >= 2;

		// Bullets — honest and guarded
		List<Bullet> bullets = new ArrayList<>();
		if (sealedDays > 0) {
			bullets.add(new Bullet("📔", String.format("You sealed %d of 7 days — %d kept, read-only.",
					sealedDays, sealedDays)));
		}
		if (sleepAvg != null) {
			bullets.add(new Bullet("😴", String.format("Slept %s on average across %d nights.",
					minutesLabel(sleepAvg), nightMinutes.size())));
		}
		if (calmMinutes > 0) {
			bullets.add(new Bullet("🧘", String.format("%d min of calm across %d sessions.",
					calmMinutes, sessions.size())));
		}
		if (hasCalmComparison) {
			double onCalm = avg(moodOnCalm);
			double offCalm = avg(moodOffCalm);
			String direction = onCalm > offCalm ? "higher" : onCalm < offCalm ? "lower" : "the same";
			bullets.add(new Bullet("🙂", String.format(
					"Mood was %s on calm days (%s/5 vs %s/5) — a pattern, not proof.",
					direction, fmt1(onCalm), fmt1(offCalm))));
		} else if (moodAvg != null) {
			bullets.add(new Bullet("🙂", String.format("Mood averaged %s/5 across %d check-ins.",
					fmt1(moodAvg), moods.size())));
		}
		bullets.add(new Bullet("💎", String.format("Earned %d gems this week.", gems)));
		if (bullets.size() < 3) {
			bullets.add(new Bullet("✨", "Keep checking in — patterns appear after a few more days."));
		}

		return new WeeklyInsights(
				from, today, gems,
				sleepAvg,
				sleepAvg != null ? nightMinutes.size() : null,
				calmMinutes, sessions.size(),
				moodAvg,
				sealedDays,
				bullets);
	}

	private double avg(List<Integer> values) {
		return values.stream().mapToInt(Integer::intValue).average().orElse(0);
	}

	private double round1(double value) {
		return Math.round(value * 10.0) / 10.0;
	}

	private String fmt1(double value) {
		if (value == Math.floor(value)) {
			return String.valueOf((long) value);
		}
		return String.format(Locale.ROOT, "%.1f", value);
	}

	private String minutesLabel(int minutes) {
		int hours = minutes / 60;
		int rest = minutes % 60;
		if (hours <= 0) {
			return rest + "m";
		}
		return rest > 0 ? hours + "h " + rest + "m" : hours + "h";
	}
}
