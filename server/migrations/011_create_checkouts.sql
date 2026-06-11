-- Checkouts — payment and insurance processing at the end of a visit
-- one per visit, receipt_reference is unique across all transactions

CREATE TABLE IF NOT EXISTS checkouts (
    id                           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id                     INT UNSIGNED    NOT NULL,
    patient_id                   INT UNSIGNED    NOT NULL,
    processed_by                 INT UNSIGNED    NULL,
    payment_type                 ENUM('out_of_pocket','insurance_balance','full_insurance') NOT NULL,
    insurance_provider           VARCHAR(100)    NULL,
    insurance_claim_reference    VARCHAR(100)    NULL COMMENT 'reference from health card machine',
    insurance_amount_approved    DECIMAL(10,2)   NULL COMMENT 'amount approved by health card machine',
    total_fee                    DECIMAL(10,2)   NOT NULL,
    patient_balance              DECIMAL(10,2)   NOT NULL,
    patient_payment_method       ENUM('cash','card','mobile') NOT NULL,
    amount_paid                  DECIMAL(10,2)   NOT NULL,
    receipt_reference            VARCHAR(50)     NOT NULL COMMENT 'auto-generated PulseOS receipt reference',
    checked_out_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_checkouts_visit_id (visit_id),
    UNIQUE KEY uq_checkouts_receipt_reference (receipt_reference),
    CONSTRAINT fk_checkouts_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_checkouts_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_checkouts_processed_by
        FOREIGN KEY (processed_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='one checkout per visit — tracks payment, insurance claim reference, and receipt';
