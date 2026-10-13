package com.thebridge.days;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.days.DayDtos.DayRecord;
import com.thebridge.days.DayDtos.DaySummary;
import com.thebridge.user.User;

@RestController
@RequestMapping("/api/v1/days")
public class DayController {

	private final DayService dayService;

	public DayController(DayService dayService) {
		this.dayService = dayService;
	}

	@GetMapping("/calendar")
	public List<DaySummary> calendar(@AuthenticationPrincipal User user,
			@RequestParam(defaultValue = "30") int days) {
		return dayService.calendar(user, days);
	}

	@GetMapping("/{date}")
	public DayRecord day(@AuthenticationPrincipal User user,
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return dayService.day(user, date);
	}
}
