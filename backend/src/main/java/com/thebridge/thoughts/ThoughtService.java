package com.thebridge.thoughts;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.common.DayWindow;
import com.thebridge.rewards.GemService;
import com.thebridge.thoughts.ThoughtDtos.CreateRequest;
import com.thebridge.thoughts.ThoughtDtos.Response;
import com.thebridge.thoughts.ThoughtDtos.UpdateRequest;
import com.thebridge.thoughts.ThoughtDtos.View;
import com.thebridge.user.User;

@Service
public class ThoughtService {

	private final ThoughtRepository repository;
	private final GemService gemService;

	public ThoughtService(ThoughtRepository repository, GemService gemService) {
		this.repository = repository;
		this.gemService = gemService;
	}

	@Transactional(readOnly = true)
	public List<View> open(User user) {
		return repository.findTop20ByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), "open")
				.stream().map(View::from).toList();
	}

	@Transactional
	public Response create(User user, CreateRequest request) {
		String kind = request.kind() != null && ThoughtDtos.KINDS.contains(request.kind().toLowerCase())
				? request.kind().toLowerCase()
				: "worry";
		Thought thought = new Thought();
		thought.setUserId(user.getId());
		thought.setContent(request.content().trim());
		thought.setKind(kind);
		thought.setStatus("open");
		repository.save(thought);
		return new Response(View.from(thought), rewards(user, 0));
	}

	@Transactional
	public Response update(User user, Long id, UpdateRequest request) {
		Thought thought = repository.findById(id)
				.filter(item -> item.getUserId().equals(user.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Thought not found: " + id));

		if (request.reframe() != null) {
			String reframe = request.reframe().trim();
			thought.setReframe(reframe.isEmpty() ? null : reframe);
		}

		int gems = 0;
		if (Boolean.TRUE.equals(request.release()) && !"released".equals(thought.getStatus())) {
			thought.setStatus("released");
			thought.setReleasedAt(Instant.now());
			repository.save(thought);
			// Processing a thought — reframed and let go — is the real work: +2 💎 once.
			gems = gemService.awardOnce(user.getId(), 2, "thought_released", "thought", thought.getId(),
					dayStart(user));
		} else {
			repository.save(thought);
		}

		return new Response(View.from(thought), rewards(user, gems));
	}

	private Instant dayStart(User user) {
		DayWindow window = new DayWindow(ZoneId.of(user.getTimezone()), user.getDayStartHour());
		return window.startOf(window.today());
	}

	private com.thebridge.rewards.Rewards rewards(User user, int gems) {
		return gemService.rewards(user.getId(), dayStart(user), gems);
	}
}
