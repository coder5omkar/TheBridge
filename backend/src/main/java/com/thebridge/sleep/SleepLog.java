package com.thebridge.sleep;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One row per night. `sleepDate` is the day you wake up, so a bedtime recorded at
 * 23:30 tonight belongs to tomorrow's row.
 */
@Entity
@Table(name = "sleep_logs")
public class SleepLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "sleep_date", nullable = false)
	private LocalDate sleepDate;

	@Column(name = "bed_time")
	private Instant bedTime;

	@Column(name = "wake_time")
	private Instant wakeTime;

	private Integer quality;

	@Column(name = "delay_note")
	private String delayNote;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public LocalDate getSleepDate() {
		return sleepDate;
	}

	public void setSleepDate(LocalDate sleepDate) {
		this.sleepDate = sleepDate;
	}

	public Instant getBedTime() {
		return bedTime;
	}

	public void setBedTime(Instant bedTime) {
		this.bedTime = bedTime;
	}

	public Instant getWakeTime() {
		return wakeTime;
	}

	public void setWakeTime(Instant wakeTime) {
		this.wakeTime = wakeTime;
	}

	public Integer getQuality() {
		return quality;
	}

	public void setQuality(Integer quality) {
		this.quality = quality;
	}

	public String getDelayNote() {
		return delayNote;
	}

	public void setDelayNote(String delayNote) {
		this.delayNote = delayNote;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
