package com.thebridge.health;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.thebridge.config.AppProperties;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

/**
 * Stores meal photos on S3 when configured (bucket + credentials via env),
 * otherwise on the local disk so the feature works out of the box.
 * Images are compressed client-side to KB before they ever reach this service.
 */
@Service
public class MediaService {

	private static final Logger log = LoggerFactory.getLogger(MediaService.class);
	private static final Duration PRESIGN_TTL = Duration.ofMinutes(15);

	private final AppProperties.Media media;
	private volatile S3Client s3Client;
	private volatile S3Presigner presigner;

	public MediaService(AppProperties props) {
		this.media = props.media();
		if (s3Enabled()) {
			log.info("Meal photos: storing on S3 bucket '{}' ({})", media.s3().bucket(), media.s3().region());
		} else {
			log.info("Meal photos: storing locally in '{}' (set S3_ENABLED/S3_BUCKET to use S3)", media.localDir());
		}
	}

	public boolean s3Enabled() {
		return media != null
				&& media.s3() != null
				&& media.s3().enabled()
				&& media.s3().bucket() != null
				&& !media.s3().bucket().isBlank();
	}

	public String storeMealPhoto(Long userId, Long mealId, byte[] bytes) {
		String key = "users/" + userId + "/meals/" + mealId + ".jpg";
		if (s3Enabled()) {
			s3Client().putObject(
					PutObjectRequest.builder()
							.bucket(media.s3().bucket())
							.key(key)
							.contentType("image/jpeg")
							.build(),
					RequestBody.fromBytes(bytes));
		} else {
			try {
				Path directory = localPath(userId, mealId).getParent();
				Files.createDirectories(directory);
				Files.write(localPath(userId, mealId), bytes);
			} catch (IOException e) {
				throw new IllegalStateException("Could not store the photo locally", e);
			}
		}
		return key;
	}

	public Optional<byte[]> readLocal(Long userId, Long mealId) {
		try {
			return Optional.of(Files.readAllBytes(localPath(userId, mealId)));
		} catch (IOException e) {
			return Optional.empty();
		}
	}

	public String presignedUrl(String key) {
		GetObjectRequest get = GetObjectRequest.builder()
				.bucket(media.s3().bucket())
				.key(key)
				.build();
		return presigner().presignGetObject(
				GetObjectPresignRequest.builder()
						.signatureDuration(PRESIGN_TTL)
						.getObjectRequest(get)
						.build())
				.url()
				.toString();
	}

	private Path localPath(Long userId, Long mealId) {
		return Paths.get(media.localDir(), "users", String.valueOf(userId), "meals", mealId + ".jpg");
	}

	private S3Client s3Client() {
		S3Client client = s3Client;
		if (client == null) {
			synchronized (this) {
				client = s3Client;
				if (client == null) {
					client = S3Client.builder()
							.region(Region.of(media.s3().region()))
							.build();
					s3Client = client;
				}
			}
		}
		return client;
	}

	private S3Presigner presigner() {
		S3Presigner p = presigner;
		if (p == null) {
			synchronized (this) {
				p = presigner;
				if (p == null) {
					p = S3Presigner.builder()
							.region(Region.of(media.s3().region()))
							.build();
					presigner = p;
				}
			}
		}
		return p;
	}
}
