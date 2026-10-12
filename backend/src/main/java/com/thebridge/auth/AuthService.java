package com.thebridge.auth;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thebridge.auth.dto.AuthResponse;
import com.thebridge.auth.dto.LoginRequest;
import com.thebridge.auth.dto.RegisterRequest;
import com.thebridge.auth.dto.UserView;
import com.thebridge.common.InvalidCredentialsException;
import com.thebridge.common.RegistrationClosedException;
import com.thebridge.user.User;
import com.thebridge.user.UserRepository;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	/**
	 * Self-closing registration: only the very first account can register.
	 */
	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (userRepository.count() > 0) {
			throw new RegistrationClosedException();
		}
		User user = new User();
		user.setEmail(normalizeEmail(request.email()));
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setDisplayName(request.displayName().trim());
		user.setTimezone(resolveTimezone(request.timezone()));
		user.setDayStartHour(4);
		userRepository.save(user);
		return issue(user);
	}

	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(normalizeEmail(request.email()))
				.orElseThrow(InvalidCredentialsException::new);
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new InvalidCredentialsException();
		}
		return issue(user);
	}

	public boolean registrationOpen() {
		return userRepository.count() == 0;
	}

	private AuthResponse issue(User user) {
		JwtService.IssuedToken issued = jwtService.issue(user);
		return new AuthResponse(issued.token(), issued.expiresAt(), UserView.from(user));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private String resolveTimezone(String timezone) {
		if (timezone == null || timezone.isBlank()) {
			return "UTC";
		}
		try {
			return ZoneId.of(timezone).getId();
		} catch (DateTimeException e) {
			return "UTC";
		}
	}
}
