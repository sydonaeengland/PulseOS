-- Prescriptions — drugs issued by a doctor during a visit
-- interaction_warning is AI-generated on save, must be acknowledged before finalising

CREATE TABLE IF NOT EXISTS prescriptions (
    id                        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id                  INT UNSIGNED    NOT NULL,
    patient_id                INT UNSIGNED    NOT NULL,
    prescribed_by             INT UNSIGNED    NULL,
    drug_name                 VARCHAR(255)    NOT NULL,
    dosage                    VARCHAR(100)    NULL,
    route                     VARCHAR(50)     NOT NULL DEFAULT 'oral',
    frequency                 VARCHAR(100)    NULL,
    duration_days             INT             NULL,
    quantity                  INT             NULL,
    instructions              TEXT            NULL,
    reason                    TEXT            NULL,
    nhf_covered               TINYINT(1)      NOT NULL DEFAULT 0,
    interaction_warning       TEXT            NULL COMMENT 'AI-generated drug interaction warning, populated on save',
    interaction_acknowledged  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 once the doctor has reviewed the interaction_warning',
    status                    ENUM('active','completed','cancelled','on_hold') NOT NULL DEFAULT 'active',
    created_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_prescriptions_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_prescriptions_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_prescriptions_prescribed_by
        FOREIGN KEY (prescribed_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='prescriptions issued per visit — interaction_warning is AI-generated on save';
