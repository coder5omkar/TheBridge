package com.thebridge.calm;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "exercise_sessions")
public class ExerciseSession {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "exercise_id", nullable = false)
	private Long exerciseId;

	@Column(nullable = false)
	private String kind;

	@Column(name = "started_at", nullable = false)
	private Instant startedAt;

	@Column(name = "duration_sec", nullable = false)
	private int durationSec;

	@Column(nullable = false)
	private boolean completed;

	@Column(name = "gems_awarded", nullable = false)
	private int gemsAwarded;

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

	public Long getExerciseId() {
		return exerciseId;
	}

	public void setExerciseId(Long exerciseId) {
		this.exerciseId = exerciseId;
	}

	public String getKind() {
		return kind;
	}

	public void setKind(String kind) {
		this.kind = kind;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public void setStartedAt(Instant startedAt) {
		this.startedAt = startedAt;
	}

	public int getDurationSec() {
		return durationSec;
	}

	public void setDurationSec(int durationSec) {
		this.durationSec = durationSec;
	}

	public boolean isCompleted() {
		return completed;
	}

	public void setCompleted(boolean completed) {
		this.completed = completed;
	}

	public int getGemsAwarded() {
		return gemsAwarded;
	}

	public void setGemsAwarded(int gemsAwarded) {
		this.gemsAwarded = gemsAwarded;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
