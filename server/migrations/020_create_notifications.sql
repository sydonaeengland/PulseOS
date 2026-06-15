-- 020_create_notifications.sql
CREATE TABLE IF NOT EXISTS notifications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED      NOT NULL,
  type          VARCHAR(60)       NOT NULL,
  title         VARCHAR(255)      NOT NULL,
  body          TEXT              NULL,
  entity_type   VARCHAR(60)       NULL,
  entity_id     INT UNSIGNED      NULL,
  is_read       TINYINT(1)        NOT NULL DEFAULT 0,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_notif_user_read ON notifications (user_id, is_read);
CREATE INDEX idx_notif_created   ON notifications (created_at DESC);
