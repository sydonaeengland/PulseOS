-- OTC Recommendations — over-the-counter items recommended by a doctor during a visit
-- interaction_warning is AI-generated on save, multiple per visit

CREATE TABLE IF NOT EXISTS otc_recommendations (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id            INT UNSIGNED    NOT NULL,
    patient_id          INT UNSIGNED    NOT NULL,
    recommended_by      INT UNSIGNED    NULL,
    item_name           VARCHAR(255)    NOT NULL,
    category            VARCHAR(100)    NULL,
    dosage              VARCHAR(100)    NULL,
    how_to_use          TEXT            NULL,
    duration            VARCHAR(100)    NULL,
    reason              TEXT            NULL,
    interaction_warning TEXT            NULL COMMENT 'AI-generated warning if interaction detected',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_otc_recommendations_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_otc_recommendations_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_otc_recommendations_recommended_by
        FOREIGN KEY (recommended_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='OTC items recommended per visit — interaction_warning is AI-generated on save';
