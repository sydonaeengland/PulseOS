-- Visit Type Fees — standard fee per visit type, configured by admin
-- pre-fills at checkout but receptionist can edit the amount per transaction

CREATE TABLE IF NOT EXISTS visit_type_fees (
    id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_type   VARCHAR(100)    NOT NULL,
    fee_jmd      DECIMAL(10,2)   NOT NULL,
    updated_by   INT UNSIGNED    NULL,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_visit_type_fees_visit_type (visit_type),
    CONSTRAINT fk_visit_type_fees_updated_by
        FOREIGN KEY (updated_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='standard fee per visit type — pre-fills at checkout, editable per transaction by receptionist';
