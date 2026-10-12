package com.thebridge.rewards;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GemLedgerRepository extends JpaRepository<GemLedger, Long> {

	@Query("select coalesce(sum(g.delta), 0) from GemLedger g where g.userId = :userId")
	long sumDeltaByUser(@Param("userId") Long userId);

	@Query("""
			select coalesce(sum(g.delta), 0) from GemLedger g
			where g.userId = :userId and g.createdAt >= :since
			""")
	long sumDeltaByUserSince(@Param("userId") Long userId, @Param("since") Instant since);

	@Query("""
			select g.createdAt from GemLedger g
			where g.userId = :userId and g.delta > 0
			order by g.createdAt desc
			""")
	List<Instant> positiveTimestamps(@Param("userId") Long userId);

	boolean existsByUserIdAndRefTypeAndRefId(Long userId, String refType, Long refId);
}
