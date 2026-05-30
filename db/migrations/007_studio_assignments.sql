-- =================================================================
-- Migration 007: studio_assignments + studio_attempts (assignable tests)
-- Created: 2026-05-30. Apply manually (see 003 for the SSH command).
-- =================================================================
CREATE TABLE IF NOT EXISTS studio_assignments (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  token         VARCHAR(24)     NOT NULL,
  title         VARCHAR(160)    NOT NULL,
  num_questions INT UNSIGNED    NOT NULL DEFAULT 0,
  payload       LONGTEXT        NOT NULL,
  active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token),
  INDEX idx_user_created (user_id, created_at),
  CONSTRAINT fk_assign_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS studio_attempts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  student_name  VARCHAR(120)    NULL,
  score         INT UNSIGNED    NOT NULL DEFAULT 0,
  total         INT UNSIGNED    NOT NULL DEFAULT 0,
  answers       LONGTEXT        NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_assignment_created (assignment_id, created_at),
  CONSTRAINT fk_attempt_assign FOREIGN KEY (assignment_id) REFERENCES studio_assignments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
