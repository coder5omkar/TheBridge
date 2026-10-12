package com.thebridge.user;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "display_name", nullable = false)
	private String displayName;

	@Column(nullable = false)
	private String timezone;

	@Column(name = "day_start_hour", nullable = false)
	private int dayStartHour;

	@Column(name = "height_cm", precision = 5, scale = 1)
	private java.math.BigDecimal heightCm;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	public Long getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getTimezone() {
		return timezone;
	}

	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}

	public int getDayStartHour() {
		return dayStartHour;
	}

	public void setDayStartHour(int dayStartHour) {
		this.dayStartHour = dayStartHour;
	}

	public java.math.BigDecimal getHeightCm() {
		return heightCm;
	}

	public void setHeightCm(java.math.BigDecimal heightCm) {
		this.heightCm = heightCm;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
