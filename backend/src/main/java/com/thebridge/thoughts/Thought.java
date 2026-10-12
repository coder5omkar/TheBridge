package com.thebridge.thoughts;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "thoughts")
public class Thought {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(nullable = false)
	private String content;

	@Column(nullable = false)
	private String kind;

	@Column(nullable = false)
	private String status;

	private String reframe;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "released_at")
	private Instant releasedAt;

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getKind() {
		return kind;
	}

	public void setKind(String kind) {
		this.kind = kind;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getReframe() {
		return reframe;
	}

	public void setReframe(String reframe) {
		this.reframe = reframe;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getReleasedAt() {
		return releasedAt;
	}

	public void setReleasedAt(Instant releasedAt) {
		this.releasedAt = releasedAt;
	}
}
