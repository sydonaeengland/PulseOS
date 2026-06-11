-- Documents — all uploaded files attached to a patient record
-- OCR runs automatically on upload; visit_id is NULL for documents not tied to a specific visit

CREATE TABLE IF NOT EXISTS documents (
    id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    patient_id     INT UNSIGNED    NOT NULL,
    uploaded_by    INT UNSIGNED    NULL,
    visit_id       INT UNSIGNED    NULL,
    document_type  ENUM('id','lab_result','referral','historical_record','imaging_report','insurance_card','other') NOT NULL,
    document_date  DATE            NULL COMMENT 'date the document was produced, separate from upload date',
    file_path      VARCHAR(500)    NOT NULL,
    file_name      VARCHAR(255)    NULL,
    mime_type      VARCHAR(100)    NULL,
    ocr_status     ENUM('pending','processing','complete','failed') NOT NULL DEFAULT 'pending',
    ocr_result     JSON            NULL,
    ocr_confidence JSON            NULL,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_documents_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_documents_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_documents_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='uploaded files attached to patient records — OCR runs automatically on upload';
