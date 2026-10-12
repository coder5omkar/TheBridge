package com.thebridge.calm;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.calm.CalmDtos.ExerciseView;
import com.thebridge.calm.CalmDtos.SessionRequest;
import com.thebridge.calm.CalmDtos.SessionResponse;
import com.thebridge.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/calm")
public class CalmController {

	private final CalmService calmService;

	public CalmController(CalmService calmService) {
		this.calmService = calmService;
	}

	@GetMapping("/exercises")
	public List<ExerciseView> exercises() {
		return calmService.exercises();
	}

	@PostMapping("/sessions")
	public SessionResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody SessionRequest request) {
		return calmService.create(user, request);
	}
}
