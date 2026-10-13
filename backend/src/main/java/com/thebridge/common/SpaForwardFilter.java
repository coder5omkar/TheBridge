package com.thebridge.common;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Production: the frontend build is baked into the jar (classpath:/static).
 * Unknown non-API paths (client-side routes like /days/2026-10-13) are
 * forwarded to index.html so deep links work.
 *
 * In local dev there is no index.html in the classpath, so this filter is a
 * no-op and Vite continues to serve the frontend on :5173.
 */
@Component
public class SpaForwardFilter extends OncePerRequestFilter {

	private static final Logger log = LoggerFactory.getLogger(SpaForwardFilter.class);

	private final boolean hasIndex;

	public SpaForwardFilter(ResourceLoader resourceLoader) {
		this.hasIndex = resourceLoader.getResource("classpath:/static/index.html").exists();
		if (hasIndex) {
			log.info("Serving the built frontend from classpath:/static (SPA deep links enabled)");
		}
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		if (hasIndex && "GET".equals(request.getMethod())) {
			String path = request.getRequestURI();
			if (!path.startsWith("/api/") && !path.startsWith("/actuator") && !path.contains(".")) {
				request.getRequestDispatcher("/index.html").forward(request, response);
				return;
			}
		}
		chain.doFilter(request, response);
	}
}
