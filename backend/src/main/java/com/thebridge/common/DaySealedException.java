package com.thebridge.common;

public class DaySealedException extends RuntimeException {

	public DaySealedException() {
		super("This day is sealed — it stays exactly as you kept it.");
	}
}
