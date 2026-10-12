package com.thebridge.auth.dto;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, UserView user) {
}
