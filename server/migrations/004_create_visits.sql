-- Visits — one row per patient consultation
-- clinical_notes_raw is doctor free-text, clinical_notes_summary is AI-generated

CREATE TABLE IF NOT EXISTS visits (
    id                       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    appointment_id           INT UNSIGNED    NULL COMMENT 'NULL for walk-ins',
    patient_id               INT UNSIGNED    NOT NULL,
    doctor_id                INT UNSIGNED    NOT NULL,
    created_by               INT UNSIGNED    NULL COMMENT 'staff member who opened the visit',
    visit_date               DATE            NOT NULL,
    visit_time               TIME            NOT NULL,
    visit_type               VARCHAR(100)    NULL,
    presenting_complaint     TEXT            NULL,
    clinical_notes_raw       TEXT            NULL,
    clinical_notes_summary   TEXT            NULL COMMENT 'AI-generated structured summary of clinical_notes_raw',
    diagnosis                TEXT            NULL,
    secondary_diagnoses      TEXT            NULL,
    treatment_plan           TEXT            NULL,
    follow_up_required       TINYINT(1)      NOT NULL DEFAULT 0,
    follow_up_date           DATE            NULL,
    referral_issued          TINYINT(1)      NOT NULL DEFAULT 0,
    sick_certificate_issued  TINYINT(1)      NOT NULL DEFAULT 0,
    status                   ENUM('open','completed') NOT NULL DEFAULT 'open',
    created_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_visits_appointment_id
        FOREIGN KEY (appointment_id) REFERENCES appointments (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_visits_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_visits_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_visits_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='one row per patient consultation — clinical_notes_raw is doctor free-text, clinical_notes_summary is AI-generated';
