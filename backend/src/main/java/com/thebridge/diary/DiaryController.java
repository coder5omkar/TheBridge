package com.thebridge.diary;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.diary.DiaryDtos.Response;
import com.thebridge.diary.DiaryDtos.UpsertRequest;
import com.thebridge.diary.DiaryDtos.View;
import com.thebridge.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/diary")
public class DiaryController {

	private final DiaryService diaryService;

	public DiaryController(DiaryService diaryService) {
		this.diaryService = diaryService;
	}

	@GetMapping("/today")
	public ResponseEntity<View> today(@AuthenticationPrincipal User user) {
		return entryOrNoContent(diaryService.today(user));
	}

	@GetMapping("/{date}")
	public ResponseEntity<View> byDate(@AuthenticationPrincipal User user,
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return entryOrNoContent(diaryService.entry(user, date));
	}

	@PutMapping("/today")
	public Response saveToday(@AuthenticationPrincipal User user, @Valid @RequestBody UpsertRequest request) {
		return diaryService.saveToday(user, request);
	}

	@PutMapping("/{date}")
	public Response saveByDate(@AuthenticationPrincipal User user,
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
			@Valid @RequestBody UpsertRequest request) {
		return diaryService.save(user, date, request);
	}

	@PostMapping("/today/seal")
	public Response sealToday(@AuthenticationPrincipal User user) {
		return diaryService.sealToday(user);
	}

	@PostMapping("/{date}/seal")
	public Response sealByDate(@AuthenticationPrincipal User user,
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return diaryService.seal(user, date);
	}

	private ResponseEntity<View> entryOrNoContent(java.util.Optional<View> entry) {
		return entry.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
	}
}
