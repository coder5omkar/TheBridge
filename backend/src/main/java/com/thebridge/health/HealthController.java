package com.thebridge.health;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.health.HealthDtos.MealRequest;
import com.thebridge.health.HealthDtos.ProfileRequest;
import com.thebridge.health.HealthDtos.ProfileResponse;
import com.thebridge.health.HealthDtos.Summary;
import com.thebridge.health.HealthDtos.SummaryResponse;
import com.thebridge.health.HealthDtos.WeightRequest;
import com.thebridge.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

	private final HealthService healthService;

	public HealthController(HealthService healthService) {
		this.healthService = healthService;
	}

	@GetMapping("/summary")
	public Summary summary(@AuthenticationPrincipal User user) {
		return healthService.summary(user);
	}

	@PostMapping("/weight")
	public SummaryResponse weighIn(@AuthenticationPrincipal User user, @Valid @RequestBody WeightRequest request) {
		return healthService.weighIn(user, request);
	}

	@PostMapping("/meals")
	public SummaryResponse addMeal(@AuthenticationPrincipal User user, @Valid @RequestBody MealRequest request) {
		return healthService.addMeal(user, request);
	}

	@PatchMapping("/profile")
	public ProfileResponse setHeight(@AuthenticationPrincipal User user, @Valid @RequestBody ProfileRequest request) {
		return healthService.setHeight(user, request);
	}
}
