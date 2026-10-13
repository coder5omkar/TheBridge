package com.thebridge.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * The user's "day" is not the UTC day: it starts at {@code dayStartHour} in the
 * user's timezone, so a bedtime logged at 1:00 AM still belongs to the previous day.
 */
public record DayWindow(ZoneId zone, int dayStartHour) {

	public LocalDate today() {
		LocalDate date = LocalDate.now(zone);
		return Instant.now().isBefore(startOf(date)) ? date.minusDays(1) : date;
	}

	public Instant startOf(LocalDate date) {
		return date.atTime(dayStartHour, 0).atZone(zone).toInstant();
	}

	public LocalDate dayOf(Instant instant) {
		ZonedDateTime zoned = instant.atZone(zone);
		LocalDate date = zoned.toLocalDate();
		return zoned.getHour() < dayStartHour ? date.minusDays(1) : date;
	}

	/**
	 * Days stay editable until 12:00 PM the following day, then they freeze forever.
	 */
	public Instant freezeAt(LocalDate date) {
		return date.plusDays(1).atTime(12, 0).atZone(zone).toInstant();
	}

	public boolean editable(LocalDate date) {
		return !date.isAfter(today()) && Instant.now().isBefore(freezeAt(date));
	}
}
