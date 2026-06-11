-- Investigation Requests — lab test orders (bloodwork, urine, microbiology, other)
-- results come back as numerical values; OCR extracts field values from uploaded documents

CREATE TABLE IF NOT EXISTS investigation_requests (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id                INT UNSIGNED    NOT NULL,
    patient_id              INT UNSIGNED    NOT NULL,
    requested_by            INT UNSIGNED    NULL,
    test_name               VARCHAR(255)    NOT NULL,
    category                ENUM('bloodwork','urine','microbiology','other') NOT NULL,
    priority                ENUM('routine','urgent') NOT NULL DEFAULT 'routine',
    clinical_reason         TEXT            NULL,
    lab_facility            VARCHAR(255)    NULL,
    special_instructions    TEXT            NULL,
    nhf_covered             TINYINT(1)      NOT NULL DEFAULT 0,
    status                  ENUM('ordered','result_received','reviewed') NOT NULL DEFAULT 'ordered',
    result_document_path    VARCHAR(500)    NULL COMMENT 'path to uploaded result file',
    result_date             DATE            NULL COMMENT 'date the lab produced the result',
    ocr_status              ENUM('pending','processing','complete','failed') NULL,
    ocr_result              JSON            NULL COMMENT 'AI-extracted field values from result document',
    ocr_confidence          JSON            NULL COMMENT 'per-field confidence scores from OCR',
    reviewed_by             INT UNSIGNED    NULL,
    doctor_notes            TEXT            NULL,
    reviewed_at             DATETIME        NULL,
    requested_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_investigation_requests_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_investigation_requests_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_investigation_requests_requested_by
        FOREIGN KEY (requested_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_investigation_requests_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='investigation orders — results uploaded on return, OCR extracts values automatically';
