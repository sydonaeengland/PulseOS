-- Patients — core demographic and registration data for each patient
-- clinical data (visits, prescriptions, etc.) lives in separate tables

CREATE TABLE IF NOT EXISTS patients (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    first_name           VARCHAR(100)    NOT NULL,
    middle_name          VARCHAR(100)    NULL,
    last_name            VARCHAR(100)    NOT NULL,
    date_of_birth        DATE            NOT NULL,
    sex                  ENUM('male','female','other') NOT NULL,
    national_id          VARCHAR(50)     NULL,
    trn                  VARCHAR(20)     NULL,
    phone                VARCHAR(20)     NOT NULL,
    phone_secondary      VARCHAR(20)     NULL,
    email                VARCHAR(255)    NULL,
    preferred_contact    ENUM('call','sms','whatsapp','email') NOT NULL DEFAULT 'call',
    address              TEXT            NULL,
    parish               VARCHAR(50)     NULL,
    occupation           VARCHAR(100)    NULL,
    marital_status       ENUM('single','married','common_law','widowed','divorced') NULL,
    blood_type           ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
    insurance_provider   VARCHAR(100)    NULL,
    nhf_card_number      VARCHAR(50)     NULL,
    allergies_summary    TEXT            NULL,
    registration_source  ENUM('staff','self_registration') NOT NULL DEFAULT 'staff',
    status               ENUM('active','pending_review') NOT NULL DEFAULT 'active',
    consent_given        TINYINT(1)      NOT NULL DEFAULT 0,
    consent_date         DATETIME        NULL,
    registered_by        INT UNSIGNED    NULL,
    created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    -- nullable uniques: the constraint only fires when a value is actually provided
    UNIQUE KEY uq_patients_national_id (national_id),
    UNIQUE KEY uq_patients_trn (trn)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='patient demographic and registration data — clinical data lives in separate tables';

ALTER TABLE patients
    ADD CONSTRAINT fk_patients_registered_by
    FOREIGN KEY (registered_by) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
