-- =================================================================
-- Migration 006: studio_papers — saved question papers (Studio library)
-- Created: 2026-05-30. Foundation for assignable tests + institution library.
-- Apply manually (see 003 for the SSH command):
--   MYSQL_PWD='<DB_PASSWORD>' mysql -h 127.0.0.1 -u u692382124_chatwithpdf \
--     u692382124_chatwithpdfai < 006_studio_papers.sql
-- =================================================================
CREATE TABLE IF NOT EXISTS studio_papers (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(160)    NOT NULL,
  exam_style    VARCHAR(80)     NULL,
  num_questions INT UNSIGNED    NOT NULL DEFAULT 0,
  payload       LONGTEXT        NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_created (user_id, created_at),
  CONSTRAINT fk_studio_papers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
