-- Checkout Line Items — individual fee items that make up a checkout total
-- multiple per checkout, cascade delete when checkout is removed

CREATE TABLE IF NOT EXISTS checkout_line_items (
    id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    checkout_id  INT UNSIGNED    NOT NULL,
    description  VARCHAR(255)    NOT NULL COMMENT 'e.g. Consultation, Dressing, Procedure',
    amount_jmd   DECIMAL(10,2)   NOT NULL,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_checkout_line_items_checkout_id
        FOREIGN KEY (checkout_id) REFERENCES checkouts (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='fee line items per checkout — multiple items per visit e.g. consultation plus dressing';
