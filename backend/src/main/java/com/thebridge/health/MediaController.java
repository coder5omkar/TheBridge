package com.thebridge.health;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

	private final HealthService healthService;

	public MediaController(HealthService healthService) {
		this.healthService = healthService;
	}

	/** Unguessable-token photo link — works in plain img tags without auth headers. */
	@GetMapping("/{token}")
	public ResponseEntity<byte[]> byToken(@PathVariable String token) {
		return healthService.photoByToken(token);
	}
}
