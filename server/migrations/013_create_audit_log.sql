-- Audit Log — immutable record of every sensitive data action in the system
-- INSERT only, never updated or deleted; no FK on user_id so records survive user deletion

CREATE TABLE IF NOT EXISTS audit_log (
    id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id        INT UNSIGNED    NULL COMMENT 'NULL for system-generated events — no FK intentionally, records must survive user deletion',
    action         VARCHAR(100)    NOT NULL COMMENT 'e.g. VIEW_PATIENT, UPDATE_PRESCRIPTION',
    resource_type  VARCHAR(100)    NULL COMMENT 'e.g. patient, visit, prescription',
    resource_id    INT UNSIGNED    NULL,
    ip_address     VARCHAR(45)     NULL,
    user_agent     VARCHAR(500)    NULL,
    details        JSON            NULL COMMENT 'additional context e.g. changed fields',
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='immutable audit log — INSERT only, never UPDATE or DELETE';
