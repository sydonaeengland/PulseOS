-- Facility Settings — clinic branding and configuration
-- used in headers of all printed documents (receipts, certificates, prescriptions)

CREATE TABLE IF NOT EXISTS facility_settings (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    clinic_name          VARCHAR(255)    NOT NULL,
    logo_path            VARCHAR(500)    NULL COMMENT 'path to uploaded clinic logo',
    address_line_1       VARCHAR(255)    NOT NULL,
    address_line_2       VARCHAR(255)    NULL,
    parish               VARCHAR(50)     NOT NULL,
    phone                VARCHAR(20)     NOT NULL,
    email                VARCHAR(255)    NULL,
    registration_number  VARCHAR(100)    NULL COMMENT 'MoH facility registration number',
    receipt_prefix       VARCHAR(10)     NULL COMMENT 'optional prefix for receipt reference numbers e.g. KGN',
    updated_by           INT UNSIGNED    NULL,
    updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_facility_settings_updated_by
        FOREIGN KEY (updated_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='clinic branding and configuration — used in headers of all printed documents';
