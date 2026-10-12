package com.thebridge.habits;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.habits.HabitDtos.CreateRequest;
import com.thebridge.habits.HabitDtos.Response;
import com.thebridge.habits.HabitDtos.Today;
import com.thebridge.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/habits")
public class HabitController {

	private final HabitService habitService;

	public HabitController(HabitService habitService) {
		this.habitService = habitService;
	}

	@GetMapping("/today")
	public Today today(@AuthenticationPrincipal User user) {
		return habitService.today(user);
	}

	@PostMapping
	public Response create(@AuthenticationPrincipal User user, @Valid @RequestBody CreateRequest request) {
		return habitService.create(user, request);
	}

	@PostMapping("/{id}/toggle")
	public Response toggle(@AuthenticationPrincipal User user, @PathVariable Long id) {
		return habitService.toggle(user, id);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void archive(@AuthenticationPrincipal User user, @PathVariable Long id) {
		habitService.archive(user, id);
	}
}
