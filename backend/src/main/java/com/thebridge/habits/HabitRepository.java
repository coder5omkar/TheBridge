package com.thebridge.habits;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitRepository extends JpaRepository<Habit, Long> {

	List<Habit> findByUserIdAndActiveTrueOrderBySortOrderAscIdAsc(Long userId);

	Optional<Habit> findByIdAndUserIdAndActiveTrue(Long id, Long userId);
}
