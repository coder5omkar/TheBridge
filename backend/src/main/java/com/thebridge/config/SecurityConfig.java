package com.thebridge.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.thebridge.auth.JwtAuthFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter,
			CorsConfigurationSource corsConfigurationSource) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.configurationSource(corsConfigurationSource))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/status",
								"/api/v1/media/**", "/actuator/health", "/error")
						.permitAll()
						// The SPA (static build + client routes like /days/2026-10-13) is public;
						// everything under /api stays behind the token.
						.requestMatchers(request -> {
							String path = request.getRequestURI();
							return "GET".equals(request.getMethod())
									&& !path.startsWith("/api")
									&& !path.startsWith("/actuator");
						})
						.permitAll()
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(handling -> handling.authenticationEntryPoint(jsonEntryPoint()))
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		// Argon2id: 16-byte salt, 32-byte hash, 1 lane, 19 MiB memory, 2 iterations.
		return new Argon2PasswordEncoder(16, 32, 1, 19456, 2);
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(AppProperties props) {
		var config = new CorsConfiguration();
		config.setAllowedOrigins(props.cors().allowedOrigins());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		var source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		return source;
	}

	private AuthenticationEntryPoint jsonEntryPoint() {
		return (request, response, authException) -> {
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"title\":\"Unauthorized\",\"status\":401,\"detail\":\"Missing or invalid token\"}");
		};
	}
}
