package com.thebridge.rewards;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GemService {

	/** Soft daily cap: past this, gems stop accruing for the day. */
	public static final int DAILY_CAP = 25;

	private final GemLedgerRepository repository;

	public GemService(GemLedgerRepository repository) {
		this.repository = repository;
	}

	public long balance(Long userId) {
		return repository.sumDeltaByUser(userId);
	}

	public long earnedSince(Long userId, Instant since) {
		return repository.sumDeltaByUserSince(userId, since);
	}

	/**
	 * Awards gems unless this (refType, refId) pair was already rewarded — used for
	 * once-per-thing rewards like "diary created" or "woke up logged".
	 */
	@Transactional
	public int awardOnce(Long userId, int delta, String reason, String refType, Long refId, Instant since) {
		if (repository.existsByUserIdAndRefTypeAndRefId(userId, refType, refId)) {
			return 0;
		}
		return awardCapped(userId, delta, reason, refType, refId, since);
	}

	/**
	 * Awards gems, clipped to the remaining daily cap.
	 */
	@Transactional
	public int awardCapped(Long userId, int delta, String reason, String refType, Long refId, Instant since) {
		long remaining = DAILY_CAP - repository.sumDeltaByUserSince(userId, since);
		int granted = (int) Math.max(0, Math.min(delta, remaining));
		if (granted == 0) {
			return 0;
		}
		GemLedger entry = new GemLedger();
		entry.setUserId(userId);
		entry.setDelta(granted);
		entry.setReason(reason);
		entry.setRefType(refType);
		entry.setRefId(refId);
		repository.save(entry);
		return granted;
	}

	public Rewards rewards(Long userId, Instant since, int gemsAwarded) {
		return new Rewards(gemsAwarded, balance(userId), earnedSince(userId, since));
	}
}
