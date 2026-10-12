package com.thebridge.diary;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {

	Optional<DiaryEntry> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);
}
