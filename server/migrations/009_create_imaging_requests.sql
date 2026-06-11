-- Imaging Requests — X-ray, ultrasound, ECG, CT orders
-- results come back as written radiology reports, not numerical values

CREATE TABLE IF NOT EXISTS imaging_requests (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id                INT UNSIGNED    NOT NULL,
    patient_id              INT UNSIGNED    NOT NULL,
    requested_by            INT UNSIGNED    NULL,
    imaging_type            VARCHAR(255)    NOT NULL COMMENT 'e.g. Chest X-ray, Abdominal Ultrasound, ECG',
    priority                ENUM('routine','urgent') NOT NULL DEFAULT 'routine',
    clinical_reason         TEXT            NULL,
    imaging_centre          VARCHAR(255)    NULL,
    special_instructions    TEXT            NULL,
    status                  ENUM('ordered','report_received','reviewed') NOT NULL DEFAULT 'ordered',
    report_document_path    VARCHAR(500)    NULL COMMENT 'path to uploaded radiology report',
    report_date             DATE            NULL COMMENT 'date the imaging centre produced the report',
    radiologist_name        VARCHAR(255)    NULL,
    doctor_notes            TEXT            NULL,
    reviewed_by             INT UNSIGNED    NULL,
    reviewed_at             DATETIME        NULL,
    requested_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_imaging_requests_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_imaging_requests_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_imaging_requests_requested_by
        FOREIGN KEY (requested_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_imaging_requests_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='imaging orders — results are written radiology reports, not numerical values';
