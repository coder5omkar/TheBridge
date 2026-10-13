package com.thebridge.health;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WeightEntryRepository extends JpaRepository<WeightEntry, Long> {

	List<WeightEntry> findByUserIdAndMeasuredAtGreaterThanEqualOrderByMeasuredAtAsc(Long userId, Instant since);

	List<WeightEntry> findByUserIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(Long userId, Instant from, Instant to);

	List<WeightEntry> findTop10ByUserIdOrderByMeasuredAtDesc(Long userId);
}
