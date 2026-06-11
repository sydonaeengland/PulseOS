-- Users — stores all staff accounts (admins, doctors, nurses, receptionists)
-- one table for all roles, doctor-specific fields are just NULL for everyone else

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    first_name    VARCHAR(100)    NOT NULL,
    last_name     VARCHAR(100)    NOT NULL,
    email         VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    role          ENUM('admin','doctor','nurse','receptionist') NOT NULL,
    phone         VARCHAR(20)     NULL,
    mcj_number    VARCHAR(50)     NULL COMMENT 'doctors only - Medical Council of Jamaica number',
    designation   VARCHAR(100)    NULL COMMENT 'doctors only - e.g. General Practitioner',
    signature_path VARCHAR(500)   NULL COMMENT 'doctors only - path to their signature image',
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_by    INT UNSIGNED    NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='all staff accounts regardless of role';

-- FK added after the table exists so the first admin can be seeded with created_by = NULL
ALTER TABLE users
    ADD CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
