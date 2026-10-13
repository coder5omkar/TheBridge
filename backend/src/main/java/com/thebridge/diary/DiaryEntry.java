package com.thebridge.diary;

import java.time.Instant;
import java.time.LocalDate;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "diary_entries")
public class DiaryEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "entry_date", nullable = false)
	private LocalDate entryDate;

	private Integer mood;

	private Integer energy;

	@Column(name = "morning_intent")
	private String morningIntent;

	@Column(name = "evening_review")
	private String eveningReview;

	private String body;

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(columnDefinition = "text[]")
	private String[] tags = new String[0];

	@Column(name = "water_cups")
	private Integer waterCups;

	private String highlights;

	private String drained;

	private String gratitude;

	private Boolean moved;

	@Column(name = "sealed_at")
	private Instant sealedAt;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public LocalDate getEntryDate() {
		return entryDate;
	}

	public void setEntryDate(LocalDate entryDate) {
		this.entryDate = entryDate;
	}

	public Integer getMood() {
		return mood;
	}

	public void setMood(Integer mood) {
		this.mood = mood;
	}

	public Integer getEnergy() {
		return energy;
	}

	public void setEnergy(Integer energy) {
		this.energy = energy;
	}

	public String getMorningIntent() {
		return morningIntent;
	}

	public void setMorningIntent(String morningIntent) {
		this.morningIntent = morningIntent;
	}

	public String getEveningReview() {
		return eveningReview;
	}

	public void setEveningReview(String eveningReview) {
		this.eveningReview = eveningReview;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public String[] getTags() {
		return tags;
	}

	public void setTags(String[] tags) {
		this.tags = tags;
	}

	public Integer getWaterCups() {
		return waterCups;
	}

	public void setWaterCups(Integer waterCups) {
		this.waterCups = waterCups;
	}

	public String getHighlights() {
		return highlights;
	}

	public void setHighlights(String highlights) {
		this.highlights = highlights;
	}

	public String getDrained() {
		return drained;
	}

	public void setDrained(String drained) {
		this.drained = drained;
	}

	public String getGratitude() {
		return gratitude;
	}

	public void setGratitude(String gratitude) {
		this.gratitude = gratitude;
	}

	public Boolean getMoved() {
		return moved;
	}

	public void setMoved(Boolean moved) {
		this.moved = moved;
	}

	public Instant getSealedAt() {
		return sealedAt;
	}

	public void setSealedAt(Instant sealedAt) {
		this.sealedAt = sealedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
