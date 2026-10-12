package com.thebridge.calm;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.thebridge.calm.CalmDtos.ExerciseView;
import com.thebridge.calm.CalmDtos.SessionRequest;
import com.thebridge.calm.CalmDtos.SessionResponse;
import com.thebridge.calm.CalmDtos.SessionView;
import com.thebridge.common.DayWindow;
import com.thebridge.rewards.GemService;
import com.thebridge.user.User;

@Service
public class CalmService {

	private final JdbcTemplate jdbc;
	private final JsonMapper jsonMapper;
	private final ExerciseSessionRepository sessionRepository;
	private final GemService gemService;

	public CalmService(JdbcTemplate jdbc, JsonMapper jsonMapper, ExerciseSessionRepository sessionRepository,
			GemService gemService) {
		this.jdbc = jdbc;
		this.jsonMapper = jsonMapper;
		this.sessionRepository = sessionRepository;
		this.gemService = gemService;
	}

	/** Read-only catalog — queried via SQL so jsonb and smallint[] stay untangled. */
	@Transactional(readOnly = true)
	public List<ExerciseView> exercises() {
		return jdbc.query("""
				select id, slug, name, type, pattern::text as pattern, array_to_string(duration_options, ',') as durations,
				       description, sos
				from exercises
				order by sort_order, id
				""", (rs, rowNum) -> new ExerciseView(
				rs.getLong("id"),
				rs.getString("slug"),
				rs.getString("name"),
				rs.getString("type"),
				parseJson(rs.getString("pattern")),
				parseDurations(rs.getString("durations")),
				rs.getString("description"),
				rs.getBoolean("sos")));
	}

	@Transactional
	public SessionResponse create(User user, SessionRequest request) {
		Integer exists = jdbc.queryForObject("select count(*) from exercises where id = ?", Integer.class,
				request.exerciseId());
		if (exists == null || exists == 0) {
			throw new IllegalArgumentException("Unknown exercise: " + request.exerciseId());
		}

		DayWindow window = new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
		Instant since = window.startOf(window.today());

		String kind = "sos".equalsIgnoreCase(request.kind()) ? "sos" : "regular";
		boolean completed = Boolean.TRUE.equals(request.completed());
		int durationSec = request.durationSec() == null ? 0 : Math.max(0, request.durationSec());
		Instant startedAt = request.startedAt() == null ? Instant.now() : request.startedAt();

		boolean firstToday = sessionRepository
				.countByUserIdAndCompletedTrueAndStartedAtGreaterThanEqual(user.getId(), since) == 0;

		ExerciseSession session = new ExerciseSession();
		session.setUserId(user.getId());
		session.setExerciseId(request.exerciseId());
		session.setKind(kind);
		session.setStartedAt(startedAt);
		session.setDurationSec(durationSec);
		session.setCompleted(completed);
		session.setGemsAwarded(0);
		sessionRepository.save(session);

		int gems = 0;
		if (completed && durationSec > 0) {
			gems += gemService.awardCapped(user.getId(), Math.max(1, durationSec / 60),
					"calm_session", "session", session.getId(), since);
			if (firstToday) {
				gems += gemService.awardCapped(user.getId(), 2,
						"first_session_bonus", "first_session", session.getId(), since);
			}
		}
		session.setGemsAwarded(gems);
		sessionRepository.save(session);

		return new SessionResponse(SessionView.from(session), gemService.rewards(user.getId(), since, gems));
	}

	private JsonNode parseJson(String json) {
		if (json == null) {
			return null;
		}
		try {
			return jsonMapper.readTree(json);
		} catch (Exception e) {
			return null;
		}
	}

	private List<Integer> parseDurations(String durations) {
		List<Integer> result = new ArrayList<>();
		if (durations == null || durations.isBlank()) {
			return result;
		}
		for (String part : durations.split(",")) {
			result.add(Integer.parseInt(part.trim()));
		}
		return result;
	}
}
