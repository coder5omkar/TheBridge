package com.thebridge.thoughts;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ThoughtRepository extends JpaRepository<Thought, Long> {

	List<Thought> findTop20ByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

	long countByUserIdAndStatus(Long userId, String status);
}
