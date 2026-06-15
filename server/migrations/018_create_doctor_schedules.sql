-- Doctor working hours — weekly recurring schedule per doctor
-- One row per doctor per day-of-week (0=Sun … 6=Sat)

CREATE TABLE IF NOT EXISTS doctor_working_hours (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    doctor_id     INT UNSIGNED NOT NULL,
    day_of_week   TINYINT UNSIGNED NOT NULL COMMENT '0=Sun 1=Mon … 6=Sat',
    start_time    TIME         NOT NULL,
    end_time      TIME         NOT NULL,
    is_working    TINYINT(1)   NOT NULL DEFAULT 1,
    updated_by    INT UNSIGNED NULL,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_doctor_day (doctor_id, day_of_week),
    CONSTRAINT fk_dwh_doctor FOREIGN KEY (doctor_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dwh_updater FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blocked time slots — one-off blocks (lunch, training, leave, etc.)
CREATE TABLE IF NOT EXISTS blocked_time (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    doctor_id     INT UNSIGNED NOT NULL,
    block_date    DATE         NOT NULL,
    start_time    TIME         NOT NULL,
    end_time      TIME         NOT NULL,
    reason        VARCHAR(200) NULL,
    created_by    INT UNSIGNED NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_bt_doctor  FOREIGN KEY (doctor_id)  REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bt_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
