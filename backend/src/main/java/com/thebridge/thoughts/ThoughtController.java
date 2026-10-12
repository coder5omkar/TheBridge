package com.thebridge.thoughts;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.thoughts.ThoughtDtos.CreateRequest;
import com.thebridge.thoughts.ThoughtDtos.Response;
import com.thebridge.thoughts.ThoughtDtos.UpdateRequest;
import com.thebridge.thoughts.ThoughtDtos.View;
import com.thebridge.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/thoughts")
public class ThoughtController {

	private final ThoughtService thoughtService;

	public ThoughtController(ThoughtService thoughtService) {
		this.thoughtService = thoughtService;
	}

	@GetMapping
	public List<View> open(@AuthenticationPrincipal User user) {
		return thoughtService.open(user);
	}

	@PostMapping
	public Response create(@AuthenticationPrincipal User user, @Valid @RequestBody CreateRequest request) {
		return thoughtService.create(user, request);
	}

	@PatchMapping("/{id}")
	public Response update(@AuthenticationPrincipal User user, @PathVariable Long id,
			@Valid @RequestBody UpdateRequest request) {
		return thoughtService.update(user, id, request);
	}
}
