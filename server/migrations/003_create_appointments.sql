-- Appointments — one row per scheduled visit between a patient and a doctor
-- triage and no_show_risk fields are populated later in the workflow, not at booking time

CREATE TABLE IF NOT EXISTS appointments (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    patient_id          INT UNSIGNED    NOT NULL,
    doctor_id           INT UNSIGNED    NOT NULL,
    booked_by           INT UNSIGNED    NULL COMMENT 'staff member who created the booking, NULL if self-booked',
    appointment_date    DATE            NOT NULL,
    appointment_time    TIME            NOT NULL,
    duration_minutes    INT             NOT NULL DEFAULT 15,
    visit_type          VARCHAR(100)    NULL,
    status              ENUM('scheduled','confirmed','checked_in','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
    reason              VARCHAR(500)    NULL,
    triage_urgency      ENUM('routine','priority','emergency') NULL,
    triage_symptoms     TEXT            NULL,
    no_show_risk        DECIMAL(3,2)    NULL COMMENT '0.00–1.00 score from the prediction model',
    reminder_sent       TINYINT(1)      NOT NULL DEFAULT 0,
    notes               TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_appointments_patient
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_doctor
        FOREIGN KEY (doctor_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_booked_by
        FOREIGN KEY (booked_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='scheduled visits — triage and risk fields are filled in after booking';
