package com.thebridge.auth.dto;

import com.thebridge.user.User;

public record UserView(Long id, String email, String displayName, String timezone, int dayStartHour) {

	public static UserView from(User user) {
		return new UserView(user.getId(), user.getEmail(), user.getDisplayName(),
				user.getTimezone(), user.getDayStartHour());
	}
}
