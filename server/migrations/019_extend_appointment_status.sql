-- Extend the appointment status ENUM to include triage and waiting workflow states
ALTER TABLE appointments
  MODIFY COLUMN status ENUM(
    'scheduled',
    'confirmed',
    'checked_in',
    'triage',
    'waiting',
    'completed',
    'cancelled',
    'no_show'
  ) NOT NULL DEFAULT 'scheduled';
