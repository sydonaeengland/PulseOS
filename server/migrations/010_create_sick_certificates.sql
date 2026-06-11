-- Sick Certificates — issued by a doctor at the end of a visit when required
-- one per visit, certificate_reference is unique for audit and fraud prevention

CREATE TABLE IF NOT EXISTS sick_certificates (
    id                       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id                 INT UNSIGNED    NOT NULL,
    patient_id               INT UNSIGNED    NOT NULL,
    issued_by                INT UNSIGNED    NULL,
    diagnosis                TEXT            NOT NULL,
    unfit_for                ENUM('work','school','both') NOT NULL,
    date_unfit_from          DATE            NOT NULL,
    date_unfit_to            DATE            NOT NULL,
    return_date              DATE            NULL,
    restrictions             TEXT            NULL COMMENT 'e.g. light duties only',
    certificate_reference    VARCHAR(50)     NOT NULL COMMENT 'auto-generated unique reference',
    created_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_sick_certificates_visit_id (visit_id),
    UNIQUE KEY uq_sick_certificates_reference (certificate_reference),
    CONSTRAINT fk_sick_certificates_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_sick_certificates_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_sick_certificates_issued_by
        FOREIGN KEY (issued_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='sick certificates issued per visit — certificate_reference is unique per certificate for audit and fraud prevention';
