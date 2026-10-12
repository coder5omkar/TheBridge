package com.thebridge.common;

public class InvalidCredentialsException extends RuntimeException {

	public InvalidCredentialsException() {
		super("Email or password is incorrect.");
	}
}
