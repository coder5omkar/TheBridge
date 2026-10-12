package com.thebridge.sleep;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SleepLogRepository extends JpaRepository<SleepLog, Long> {

	Optional<SleepLog> findByUserIdAndSleepDate(Long userId, LocalDate sleepDate);

	Optional<SleepLog> findTopByUserIdOrderBySleepDateDesc(Long userId);

	List<SleepLog> findByUserIdAndSleepDateBetweenOrderBySleepDateAsc(Long userId, LocalDate from, LocalDate to);
}
