-- Consent Records — DPA 2020 compliance log of consent actions per patient
-- one row per event, most recent active record for a given consent_type is operative

CREATE TABLE IF NOT EXISTS consent_records (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    patient_id    INT UNSIGNED    NOT NULL,
    staff_id      INT UNSIGNED    NULL,
    consent_type  ENUM('data_processing','marketing','research') NOT NULL DEFAULT 'data_processing',
    status        ENUM('given','withdrawn') NOT NULL,
    method        ENUM('verbal','written','digital') NOT NULL,
    notes         TEXT            NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_consent_records_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_consent_records_staff_id
        FOREIGN KEY (staff_id) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='DPA 2020 consent events — one row per consent action, most recent active record is operative';
