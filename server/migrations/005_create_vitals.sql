-- Vitals — nurse-recorded observations taken after check-in
-- one row per visit, enforced by UNIQUE on visit_id

CREATE TABLE IF NOT EXISTS vitals (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    visit_id             INT UNSIGNED    NOT NULL,
    patient_id           INT UNSIGNED    NOT NULL,
    recorded_by          INT UNSIGNED    NULL COMMENT 'nurse who recorded the vitals',
    bp_systolic          INT             NULL,
    bp_diastolic         INT             NULL,
    temperature_celsius  DECIMAL(4,1)    NULL,
    weight_kg            DECIMAL(5,2)    NULL,
    height_cm            DECIMAL(5,1)    NULL,
    bmi                  DECIMAL(4,1)    NULL COMMENT 'calculated from weight_kg and height_cm',
    pulse_bpm            INT             NULL,
    oxygen_saturation    DECIMAL(4,1)    NULL,
    respiratory_rate     INT             NULL,
    pain_score           TINYINT         NULL COMMENT '0–10 scale',
    recorded_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_vitals_visit_id (visit_id),
    CONSTRAINT fk_vitals_visit_id
        FOREIGN KEY (visit_id) REFERENCES visits (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_vitals_patient_id
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_vitals_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='nurse-recorded vitals per visit — one row per visit enforced by UNIQUE on visit_id';
