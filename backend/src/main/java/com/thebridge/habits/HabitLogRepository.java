package com.thebridge.habits;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

	Optional<HabitLog> findByHabitIdAndLogDate(Long habitId, LocalDate logDate);

	List<HabitLog> findByUserIdAndLogDateGreaterThanEqual(Long userId, LocalDate since);
}
