-- =================================================================
-- Migration 005: rate_limits (IP + bucket window counter) — M7
-- Created: 2026-05-29. Apply manually (see 003 for the SSH command).
-- Account lockout reuses users.failed_login_attempts / locked_until (002).
-- =================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bucket     VARCHAR(48)     NOT NULL,
  ip         VARCHAR(45)     NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bucket_ip_time (bucket, ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
