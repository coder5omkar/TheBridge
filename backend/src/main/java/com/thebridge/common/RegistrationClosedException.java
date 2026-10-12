package com.thebridge.common;

public class RegistrationClosedException extends RuntimeException {

	public RegistrationClosedException() {
		super("Registration is closed — an account already exists. Sign in instead.");
	}
}
