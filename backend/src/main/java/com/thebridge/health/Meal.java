package com.thebridge.health;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "meals")
public class Meal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "eaten_at", nullable = false)
	private Instant eatenAt;

	@Column(name = "meal_type", nullable = false)
	private String mealType;

	private String description;

	@Column(name = "home_cooked")
	private Boolean homeCooked;

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

	public Instant getEatenAt() {
		return eatenAt;
	}

	public void setEatenAt(Instant eatenAt) {
		this.eatenAt = eatenAt;
	}

	public String getMealType() {
		return mealType;
	}

	public void setMealType(String mealType) {
		this.mealType = mealType;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Boolean getHomeCooked() {
		return homeCooked;
	}

	public void setHomeCooked(Boolean homeCooked) {
		this.homeCooked = homeCooked;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
