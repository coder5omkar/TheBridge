package com.thebridge.insights;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thebridge.insights.InsightsDtos.WeeklyInsights;
import com.thebridge.user.User;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightsController {

	private final InsightsService insightsService;

	public InsightsController(InsightsService insightsService) {
		this.insightsService = insightsService;
	}

	@GetMapping("/weekly")
	public WeeklyInsights weekly(@AuthenticationPrincipal User user) {
		return insightsService.weekly(user);
	}
}
