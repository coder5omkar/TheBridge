package com.thebridge.common;

public class DayFrozenException extends RuntimeException {

	public DayFrozenException() {
		super("This day froze at 12:00 PM the next day — it is read-only now.");
	}
}
