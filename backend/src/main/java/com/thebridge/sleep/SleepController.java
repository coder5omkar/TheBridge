package com.thebridge.sleep;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.sleep.SleepDtos.BedtimeRequest;
import com.thebridge.sleep.SleepDtos.Response;
import com.thebridge.sleep.SleepDtos.View;
import com.thebridge.sleep.SleepDtos.WakeRequest;
import com.thebridge.user.User;

@RestController
@RequestMapping("/api/v1/sleep")
public class SleepController {

	private final SleepService sleepService;

	public SleepController(SleepService sleepService) {
		this.sleepService = sleepService;
	}

	@GetMapping("/latest")
	public ResponseEntity<View> latest(@AuthenticationPrincipal User user) {
		return sleepService.latest(user)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping("/bedtime")
	public Response bedtime(@AuthenticationPrincipal User user,
			@RequestBody(required = false) BedtimeRequest request) {
		return sleepService.bedtime(user, request);
	}

	@PostMapping("/wake")
	public Response wake(@AuthenticationPrincipal User user,
			@RequestBody(required = false) WakeRequest request) {
		return sleepService.wake(user, request);
	}
}
