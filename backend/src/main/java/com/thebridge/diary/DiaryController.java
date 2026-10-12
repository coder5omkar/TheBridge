package com.thebridge.diary;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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

	/** Today's entry in the user's own day boundaries — 204 when nothing written yet. */
	@GetMapping("/today")
	public ResponseEntity<View> today(@AuthenticationPrincipal User user) {
		return diaryService.today(user)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PutMapping("/today")
	public Response save(@AuthenticationPrincipal User user, @Valid @RequestBody UpsertRequest request) {
		return diaryService.save(user, request);
	}
}
