package com.thebridge.calm;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {

	long countByUserIdAndCompletedTrueAndStartedAtGreaterThanEqual(Long userId, Instant since);

	List<ExerciseSession> findByUserIdAndCompletedTrueAndStartedAtGreaterThanEqualOrderByStartedAtAsc(
			Long userId, Instant since);
}
