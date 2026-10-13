package com.thebridge.health;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.thebridge.rewards.Rewards;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class HealthDtos {

	private HealthDtos() {
	}

	public record ProfileRequest(
			@NotNull @DecimalMin("50") @DecimalMax("300") Double heightCm) {
	}

	public record WeightRequest(
			@NotNull @DecimalMin("20") @DecimalMax("500") Double weightKg,
			Instant measuredAt,
			@Size(max = 500) String note) {
	}

	public record MealRequest(
			String mealType,
			@Size(max = 500) String description,
			Boolean homeCooked,
			Instant eatenAt) {
	}

	public record WeightPoint(LocalDate date, Instant at, double kg) {
	}

	public record MealView(Long id, String mealType, String description, Boolean homeCooked, Instant eatenAt) {

		public static MealView from(Meal meal) {
			return new MealView(meal.getId(), meal.getMealType(), meal.getDescription(),
					meal.getHomeCooked(), meal.getEatenAt());
		}
	}

	public record Summary(
			Double heightCm,
			Double latestWeightKg,
			Instant latestWeightAt,
			Double change7dKg,
			List<WeightPoint> weights,
			int mealsToday,
			List<MealView> todayMeals,
			int mealsWeek,
			Double homeCookedRatioWeek,
			Double bmi) {
	}

	public record SummaryResponse(Summary summary, Rewards rewards) {
	}

	public record ProfileResponse(Double heightCm) {
	}
}
