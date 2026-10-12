package com.thebridge.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.thebridge.config.AppProperties;
import com.thebridge.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey key;
	private final AppProperties.Jwt jwt;

	public JwtService(AppProperties props) {
		this.jwt = props.jwt();
		this.key = Keys.hmacShaKeyFor(props.jwt().secret().getBytes(StandardCharsets.UTF_8));
	}

	public IssuedToken issue(User user) {
		Instant now = Instant.now();
		Instant expiresAt = now.plus(jwt.ttl());
		String token = Jwts.builder()
				.subject(String.valueOf(user.getId()))
				.issuer(jwt.issuer())
				.claim("email", user.getEmail())
				.issuedAt(Date.from(now))
				.expiration(Date.from(expiresAt))
				.signWith(key)
				.compact();
		return new IssuedToken(token, expiresAt);
	}

	public Claims parse(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.requireIssuer(jwt.issuer())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public record IssuedToken(String token, Instant expiresAt) {
	}
}
