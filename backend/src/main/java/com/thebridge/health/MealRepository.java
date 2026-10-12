package com.thebridge.health;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MealRepository extends JpaRepository<Meal, Long> {

	List<Meal> findByUserIdAndEatenAtBetweenOrderByEatenAtDesc(Long userId, Instant from, Instant to);
}
