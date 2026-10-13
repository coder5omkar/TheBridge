package com.thebridge.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Media media) {

	public record Jwt(String secret, Duration ttl, String issuer) {
	}

	public record Cors(List<String> allowedOrigins) {
	}

	public record Media(String localDir, S3 s3) {

		public record S3(boolean enabled, String bucket, String region) {
		}
	}
}
