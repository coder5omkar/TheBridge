package com.thebridge.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.auth.dto.AuthResponse;
import com.thebridge.auth.dto.AuthStatusResponse;
import com.thebridge.auth.dto.LoginRequest;
import com.thebridge.auth.dto.RegisterRequest;
import com.thebridge.auth.dto.UserView;
import com.thebridge.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/status")
	public AuthStatusResponse status() {
		return new AuthStatusResponse(authService.registrationOpen());
	}

	@GetMapping("/me")
	public UserView me(@AuthenticationPrincipal User user) {
		return UserView.from(user);
	}
}
