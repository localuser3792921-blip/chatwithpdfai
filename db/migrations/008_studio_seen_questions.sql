-- =================================================================
-- Migration 008: studio_seen_questions — cross-session never-repeat
-- Created: 2026-05-30. Apply manually (see 003 for the SSH command).
-- =================================================================
CREATE TABLE IF NOT EXISTS studio_seen_questions (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  topic_key  VARCHAR(80)     NOT NULL,
  stem       VARCHAR(220)    NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_topic_time (user_id, topic_key, created_at),
  CONSTRAINT fk_seen_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
