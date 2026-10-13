package com.thebridge.common;

public class DayFrozenException extends RuntimeException {

	public DayFrozenException() {
		super("This day froze at midnight — it is read-only now.");
	}
}
