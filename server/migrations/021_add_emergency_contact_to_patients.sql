-- Add emergency contact fields to patients table

ALTER TABLE patients
  ADD COLUMN emergency_contact_name     VARCHAR(150) NULL AFTER allergies_summary,
  ADD COLUMN emergency_contact_phone    VARCHAR(20)  NULL AFTER emergency_contact_name,
  ADD COLUMN emergency_contact_relation VARCHAR(80)  NULL AFTER emergency_contact_phone;
