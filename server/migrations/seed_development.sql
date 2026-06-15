-- =============================================================
-- PulseOS Development Seed  (date-relative  --  always anchors to CURDATE())
-- Run: mysql -u root -p1234 --default-character-set=utf8mb4 pulseos < seed_development.sql
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE notifications;
TRUNCATE TABLE checkout_line_items;
TRUNCATE TABLE checkouts;
TRUNCATE TABLE vitals;
TRUNCATE TABLE sick_certificates;
TRUNCATE TABLE otc_recommendations;
TRUNCATE TABLE investigation_requests;
TRUNCATE TABLE imaging_requests;
TRUNCATE TABLE documents;
TRUNCATE TABLE consent_records;
TRUNCATE TABLE visits;
TRUNCATE TABLE appointments;
TRUNCATE TABLE blocked_time;
TRUNCATE TABLE doctor_working_hours;
TRUNCATE TABLE patients;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- DATE VARIABLES  (everything relative to CURDATE())
-- Mon of current week = CURDATE() minus (DAYOFWEEK(CURDATE())-2) days
-- DAYOFWEEK: Sun=1, Mon=2, ... Sat=7  -->  Mon offset = (DAYOFWEEK-2)
-- =============================================================
SET @today   = CURDATE();
SET @mon_cur = @today - INTERVAL (DAYOFWEEK(@today) - 2) DAY;

-- Previous week Mon-Fri (past history)
SET @pw_mon  = @mon_cur - INTERVAL 7 DAY;
SET @pw_tue  = @mon_cur - INTERVAL 6 DAY;
SET @pw_wed  = @mon_cur - INTERVAL 5 DAY;
SET @pw_thu  = @mon_cur - INTERVAL 4 DAY;
SET @pw_fri  = @mon_cur - INTERVAL 3 DAY;

-- Current week Mon-Fri (today is somewhere in here; today = @today)
SET @cw_mon  = @mon_cur;
SET @cw_tue  = @mon_cur + INTERVAL 1 DAY;
SET @cw_wed  = @mon_cur + INTERVAL 2 DAY;
SET @cw_thu  = @mon_cur + INTERVAL 3 DAY;
SET @cw_fri  = @mon_cur + INTERVAL 4 DAY;

-- Next week Mon-Fri
SET @nw_mon  = @mon_cur + INTERVAL 7  DAY;
SET @nw_tue  = @mon_cur + INTERVAL 8  DAY;
SET @nw_wed  = @mon_cur + INTERVAL 9  DAY;
SET @nw_thu  = @mon_cur + INTERVAL 10 DAY;
SET @nw_fri  = @mon_cur + INTERVAL 11 DAY;

-- Week after next Mon-Fri
SET @ww_mon  = @mon_cur + INTERVAL 14 DAY;
SET @ww_tue  = @mon_cur + INTERVAL 15 DAY;
SET @ww_wed  = @mon_cur + INTERVAL 16 DAY;
SET @ww_thu  = @mon_cur + INTERVAL 17 DAY;
SET @ww_fri  = @mon_cur + INTERVAL 18 DAY;

-- ─────────────────────────────────────────────
-- USERS  (1 admin, 2 receptionists, 2 triage nurses, 5 doctors)
-- ─────────────────────────────────────────────
-- password hash = bcrypt('Password1!')
INSERT INTO users (id, first_name, last_name, email, password_hash, role, is_active, designation) VALUES
-- Admin
(1,  'Admin',     'User',       'admin@seymourda.com',              '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'admin',        1, NULL),
-- Receptionists
(2,  'Grace',     'Thompson',   'grace.thompson@seymourda.com',     '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'receptionist', 1, NULL),
(8,  'Nadine',    'Gordon',     'nadine.gordon@seymourda.com',      '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'receptionist', 1, NULL),
-- Triage nurses
(9,  'Beverley',  'Clarke',     'beverley.clarke@seymourda.com',    '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'nurse',        1, 'Triage Nurse'),
(10, 'Rohan',     'Reid',       'rohan.reid@seymourda.com',         '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'nurse',        1, 'Triage Nurse'),
-- Doctors
(3,  'Marcus',    'Campbell',   'dr.campbell@seymourda.com',        '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'doctor',       1, 'General Practitioner'),
(4,  'Simone',    'Grant',      'dr.grant@seymourda.com',           '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'doctor',       1, 'Internist'),
(5,  'Rajiv',     'Nair',       'dr.nair@seymourda.com',            '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'doctor',       1, 'Cardiologist'),
(6,  'Dionne',    'Williams',   'dr.williams@seymourda.com',        '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'doctor',       1, 'Paediatrician'),
(7,  'Patrick',   'Henry',      'dr.henry@seymourda.com',           '$2b$10$19XHEpuV5/X0gaAIuZAcDu0Kmv/D15gwZg2F.YfYZQjtYm6xTL4x2', 'doctor',       1, 'General Practitioner');

-- ---------------------------------------------
-- DOCTOR WORKING HOURS  (Mon-Fri 8am-5pm)
-- day_of_week: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
-- ---------------------------------------------
INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, is_working) VALUES
-- Campbell (3)
(3,0,'08:00','17:00',0),(3,1,'08:00','17:00',1),(3,2,'08:00','17:00',1),
(3,3,'08:00','17:00',1),(3,4,'08:00','17:00',1),(3,5,'08:00','17:00',1),(3,6,'08:00','17:00',0),
-- Grant (4)
(4,0,'08:00','17:00',0),(4,1,'08:00','17:00',1),(4,2,'08:00','17:00',1),
(4,3,'08:00','17:00',1),(4,4,'08:00','17:00',1),(4,5,'08:00','17:00',1),(4,6,'08:00','17:00',0),
-- Nair (5)
(5,0,'08:00','17:00',0),(5,1,'09:00','16:00',1),(5,2,'09:00','16:00',1),
(5,3,'09:00','16:00',1),(5,4,'09:00','16:00',1),(5,5,'09:00','16:00',1),(5,6,'08:00','17:00',0),
-- Williams (6)
(6,0,'08:00','17:00',0),(6,1,'08:00','15:00',1),(6,2,'08:00','15:00',1),
(6,3,'08:00','15:00',1),(6,4,'08:00','15:00',1),(6,5,'08:00','15:00',1),(6,6,'08:00','17:00',0),
-- Henry (7)
(7,0,'08:00','17:00',0),(7,1,'10:00','18:00',1),(7,2,'10:00','18:00',1),
(7,3,'10:00','18:00',1),(7,4,'10:00','18:00',1),(7,5,'10:00','18:00',1),(7,6,'08:00','17:00',0);

-- ---------------------------------------------
-- PATIENTS  (48 active + 3 pending_review)
-- Columns: id, first_name, middle_name, last_name, date_of_birth, sex,
--          national_id, trn, phone, phone_secondary, email,
--          preferred_contact, address, parish, occupation,
--          marital_status, blood_type, insurance_provider, nhf_card_number,
--          allergies_summary, registration_source, status,
--          consent_given, consent_date, registered_by, created_at
-- ---------------------------------------------
INSERT INTO patients
  (id, first_name, middle_name, last_name, date_of_birth, sex,
   national_id, trn, phone, phone_secondary, email,
   preferred_contact, address, parish, occupation,
   marital_status, blood_type, insurance_provider, nhf_card_number,
   allergies_summary, registration_source, status,
   consent_given, consent_date, registered_by, created_at)
VALUES
-- 1
(1,  'Tamara',    NULL,      'Lewis',     '1985-03-14', 'female',
 '5001001', '123-456-789', '876-555-0101', '876-555-1101', 'tamara.lewis@gmail.com',
 'call',    '12 Hope Rd, Kingston',       'Kingston',  'Teacher',
 'married',  'O+',  'Sagicor',          'NHF-10001', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 2
(2,  'Sandra',    'May',     'Morrison',  '1972-07-22', 'female',
 '5001002', '123-456-790', '876-555-0102', NULL,          'smorrison@yahoo.com',
 'whatsapp','5 Dunrobin Ave, Kingston',    'Kingston',  'Nurse',
 'divorced', 'A+',  'Medecus',          'NHF-10002', 'Penicillin',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 3
(3,  'Carlton',   NULL,      'Edwards',   '1990-11-05', 'male',
 '5001003', '123-456-791', '876-555-0103', '876-555-1103', 'cedwards@gmail.com',
 'call',    '88 Maxfield Ave, Kingston',  'Kingston',  'Mechanic',
 'single',   'B+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 4
(4,  'Keisha',    'Ann',     'Brown',     '1988-06-18', 'female',
 '5001004', '123-456-792', '876-555-0104', '876-555-1104', 'keisha.brown@hotmail.com',
 'sms',     '30 Old Hope Rd, Kingston',   'Kingston',  'Accountant',
 'married',  'AB+', 'Sagicor',          'NHF-10004', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 5
(5,  'Devon',     NULL,      'Clarke',    '1979-02-28', 'male',
 '5001005', '123-456-793', '876-555-0105', NULL,          'dclarke@gmail.com',
 'call',    '14 Maxfield Ave, Kingston',  'Kingston',  'Driver',
 'common_law','O-', NULL,               NULL,        'Aspirin',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 6
(6,  'Nadine',    NULL,      'Reid',      '1995-09-10', 'female',
 '5001006', '123-456-794', '876-555-0106', '876-555-1106', 'nadine.reid@gmail.com',
 'whatsapp','22 Barbican Rd, Kingston',   'Kingston',  'Student',
 'single',   'A-',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 7
(7,  'Winston',   'Paul',    'Johnson',   '1965-04-03', 'male',
 '5001007', '123-456-795', '876-555-0107', '876-555-1107', 'wjohnson@yahoo.com',
 'call',    '9 Hagley Park Rd, Kingston', 'Kingston',  'Retired',
 'married',  'B-',  'Medecus',          'NHF-10007', 'Sulfa drugs',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 8
(8,  'Marcia',    NULL,      'Campbell',  '1983-12-19', 'female',
 '5001008', '123-456-796', '876-555-0108', NULL,          'marcia.campbell@gmail.com',
 'email',   '45 Hope Rd, Kingston',       'Kingston',  'Manager',
 'married',  'O+',  'Sagicor',          'NHF-10008', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 9
(9,  'Damion',    NULL,      'Thompson',  '1998-08-07', 'male',
 '5001009', '123-456-797', '876-555-0109', '876-555-1109', 'dthompson@gmail.com',
 'sms',     '7 Cherry Gardens, Kingston', 'Kingston',  'Student',
 'single',   'A+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 10
(10, 'Yvonne',    'Grace',   'White',     '1960-01-15', 'female',
 '5001010', '123-456-798', '876-555-0110', '876-555-1110', 'ywhite@hotmail.com',
 'call',    '3 Acadia Dr, Kingston',      'St. Andrew','Retired',
 'widowed',  'AB-', 'Medecus',          'NHF-10010', 'Latex',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 11
(11, 'Rohan',     NULL,      'Stewart',   '1992-05-24', 'male',
 '5001011', '123-456-799', '876-555-0111', NULL,          'rstewart@gmail.com',
 'call',    '17 Manor Park, Kingston',    'Kingston',  'IT Technician',
 'single',   'O+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 12
(12, 'Latoya',    NULL,      'Harris',    '1987-10-31', 'female',
 '5001012', '123-456-800', '876-555-0112', '876-555-1112', 'lharris@yahoo.com',
 'whatsapp','6 Washington Blvd, Kingston','Kingston',  'Nurse',
 'married',  'B+',  'Sagicor',          'NHF-10012', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 13
(13, 'Andre',     'Michael', 'Graham',    '1975-07-08', 'male',
 '5001013', '123-456-801', '876-555-0113', '876-555-1113', 'agraham@gmail.com',
 'call',    '29 Halfway Tree Rd, Kingston','Kingston', 'Contractor',
 'married',  'A+',  'Medecus',          'NHF-10013', 'Codeine',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 14
(14, 'Simone',    NULL,      'Martin',    '1993-03-17', 'female',
 '5001014', '123-456-802', '876-555-0114', NULL,          'smartin@gmail.com',
 'sms',     '41 Constant Spring Rd, Kingston','Kingston','Hairdresser',
 'single',   'O-',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 15
(15, 'Clifton',   NULL,      'Bailey',    '1968-11-29', 'male',
 '5001015', '123-456-803', '876-555-0115', '876-555-1115', 'cbailey@hotmail.com',
 'call',    '8 Duhaney Park, Kingston',   'Kingston',  'Security Guard',
 'divorced', 'B+',  NULL,               NULL,        'NSAIDs',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 16
(16, 'Tricia',    'Lynn',    'Walker',    '1991-08-13', 'female',
 '5001016', '123-456-804', '876-555-0116', '876-555-1116', 'twalker@gmail.com',
 'whatsapp','33 Papine, Kingston',         'St. Andrew','Pharmacist',
 'common_law','A-', 'Sagicor',          'NHF-10016', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 17
(17, 'Garfield',  NULL,      'Allen',     '1974-06-06', 'male',
 '5001017', '123-456-805', '876-555-0117', NULL,          'gallen@yahoo.com',
 'call',    '12 Mona Rd, Kingston',        'Kingston',  'Electrician',
 'married',  'O+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 18
(18, 'Patrice',   NULL,      'Robinson',  '1996-02-20', 'female',
 '5001018', '123-456-806', '876-555-0118', '876-555-1118', 'probinson@gmail.com',
 'email',   '55 Old Stony Hill Rd, Kingston','St. Andrew','University Student',
 'single',   'AB+', NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 19
(19, 'Errol',     NULL,      'Francis',   '1956-09-04', 'male',
 '5001019', '123-456-807', '876-555-0119', '876-555-1119', 'efrancis@hotmail.com',
 'call',    '19 Norbrook Rd, Kingston',   'Kingston',  'Retired',
 'widowed',  'A+',  'Medecus',          'NHF-10019', 'Warfarin interaction — check meds',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 20
(20, 'Beverley',  'Jean',    'Dixon',     '1980-04-27', 'female',
 '5001020', '123-456-808', '876-555-0120', '876-555-1120', 'bdixon@gmail.com',
 'whatsapp','7 Shortwood Rd, Kingston',   'St. Andrew','Teacher',
 'married',  'O+',  'Sagicor',          'NHF-10020', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 21
(21, 'Maurice',   NULL,      'Nelson',    '1977-12-01', 'male',
 '5001021', '123-456-809', '876-555-0121', NULL,          'mnelson@gmail.com',
 'call',    '14 Lyndhurst Rd, Kingston',  'Kingston',  'Police Officer',
 'married',  'B+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 22
(22, 'Annette',   NULL,      'Gordon',    '1989-07-14', 'female',
 '5001022', '123-456-810', '876-555-0122', '876-555-1122', 'agordon@yahoo.com',
 'sms',     '26 Dunrobin Ave, Kingston',  'Kingston',  'Social Worker',
 'single',   'A+',  'Sagicor',          'NHF-10022', 'Shellfish — dietary',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 23
(23, 'Hopeton',   'Earl',    'Wright',    '1963-05-19', 'male',
 '5001023', '123-456-811', '876-555-0123', '876-555-1123', 'hwright@gmail.com',
 'call',    '10 Trafalgar Rd, Kingston',  'Kingston',  'Plumber',
 'married',  'O-',  'Medecus',          'NHF-10023', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 24
(24, 'Sophia',    NULL,      'Duncan',    '1994-10-08', 'female',
 '5001024', '123-456-812', '876-555-0124', NULL,          'sduncan@gmail.com',
 'whatsapp','38 Devon Rd, Kingston',       'Kingston',  'Graphic Designer',
 'single',   'B-',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 25
(25, 'Lennox',    'George',  'Brown',     '1971-03-23', 'male',
 '5001025', '123-456-813', '876-555-0125', '876-555-1125', 'lbrown@hotmail.com',
 'call',    '5 Hope Blvd, Kingston',       'Kingston',  'Business Owner',
 'married',  'A-',  'Sagicor',          'NHF-10025', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 26
(26, 'Kezia',     NULL,      'Lawrence',  '1999-08-30', 'female',
 '5001026', '123-456-814', '876-555-0126', '876-555-1126', 'klawrence@gmail.com',
 'whatsapp','21 Halfway Tree Rd, Kingston','Kingston',  'Student',
 'single',   'O+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 27
(27, 'Anthony',   NULL,      'Williams',  '1966-01-11', 'male',
 '5001027', '123-456-815', '876-555-0127', NULL,          'awilliams@yahoo.com',
 'call',    '43 Mannings Hill Rd, Kingston','St. Andrew','Taxi Driver',
 'common_law','B+', NULL,               NULL,        'Metformin — on current meds',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 28
(28, 'Claudette', NULL,      'Henry',     '1982-06-25', 'female',
 '5001028', '123-456-816', '876-555-0128', '876-555-1128', 'chenry@gmail.com',
 'sms',     '9 Seymour Ave, Kingston',    'Kingston',  'Administrative Assistant',
 'married',  'AB+', 'Medecus',          'NHF-10028', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 29
(29, 'Rudolph',   NULL,      'McLean',    '1970-11-16', 'male',
 '5001029', '123-456-817', '876-555-0129', '876-555-1129', 'rmclean@hotmail.com',
 'call',    '17 Barbican Rd, Kingston',   'Kingston',  'Carpenter',
 'divorced', 'O+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 30
(30, 'Ingrid',    'May',     'Young',     '1985-04-02', 'female',
 '5001030', '123-456-818', '876-555-0130', '876-555-1130', 'iyoung@gmail.com',
 'whatsapp','32 Stony Hill Rd, Kingston', 'St. Andrew','Banker',
 'married',  'A+',  'Sagicor',          'NHF-10030', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 31
(31, 'Bertram',   NULL,      'Senior',    '1958-07-07', 'male',
 '5001031', '123-456-819', '876-555-0131', '876-555-1131', 'bsenior@yahoo.com',
 'call',    '6 College Common, Kingston', 'Kingston',  'Retired',
 'married',  'B+',  'Medecus',          'NHF-10031', 'Ibuprofen',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 32
(32, 'Sherone',   NULL,      'Blake',     '1997-09-18', 'female',
 '5001032', '123-456-820', '876-555-0132', NULL,          'sblake@gmail.com',
 'sms',     '44 Dunrobin Ave, Kingston',  'Kingston',  'Sales Rep',
 'single',   'O-',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 33
(33, 'Godfrey',   'Owen',    'Taylor',    '1953-02-14', 'male',
 '5001033', '123-456-821', '876-555-0133', '876-555-1133', 'gtaylor@hotmail.com',
 'call',    '11 Paddington Terrace, Kingston','Kingston','Retired',
 'widowed',  'A-',  'Sagicor',          'NHF-10033', 'Aspirin, Peanuts',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 34
(34, 'Nadisha',   NULL,      'Green',     '1990-12-22', 'female',
 '5001034', '123-456-822', '876-555-0134', '876-555-1134', 'ngreen@gmail.com',
 'whatsapp','28 Arthur Wint Dr, Kingston','Kingston',  'Event Planner',
 'single',   'B-',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 35
(35, 'Everton',   NULL,      'Reid',      '1962-05-05', 'male',
 '5001035', '123-456-823', '876-555-0135', NULL,          'ereid@yahoo.com',
 'call',    '15 Marescaux Rd, Kingston',  'Kingston',  'Security Guard',
 'married',  'O+',  'Medecus',          'NHF-10035', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 36
(36, 'Paulette',  'Grace',   'James',     '1978-08-28', 'female',
 '5001036', '123-456-824', '876-555-0136', '876-555-1136', 'pjames@gmail.com',
 'email',   '7 Norbrook Rd, Kingston',    'St. Andrew','Attorney',
 'divorced', 'AB-', 'Sagicor',          'NHF-10036', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 37
(37, 'Courtney',  NULL,      'Brown',     '1984-03-11', 'male',
 '5001037', '123-456-825', '876-555-0137', NULL,          'cbrown2@gmail.com',
 'call',    '39 Hope Rd, Kingston',        'Kingston',  'Warehouse Supervisor',
 'common_law','A+', NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 38
(38, 'Danielle',  'Ann',     'Morgan',    '1993-10-17', 'female',
 '5001038', '123-456-826', '876-555-0138', '876-555-1138', 'dmorgan@hotmail.com',
 'whatsapp','22 Constant Spring Rd, Kingston','Kingston','Dental Assistant',
 'single',   'O+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 39
(39, 'Fitzroy',   NULL,      'Barrett',   '1969-06-30', 'male',
 '5001039', '123-456-827', '876-555-0139', '876-555-1139', 'fbarrett@gmail.com',
 'call',    '18 Dunrobin Ave, Kingston',  'Kingston',  'Bus Driver',
 'married',  'B+',  'Medecus',          'NHF-10039', 'Penicillin',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 40
(40, 'Camille',   NULL,      'Douglas',   '1986-01-24', 'female',
 '5001040', '123-456-828', '876-555-0140', NULL,          'cdouglas@yahoo.com',
 'sms',     '53 Maxfield Ave, Kingston',  'Kingston',  'Cosmetologist',
 'single',   'A-',  'Sagicor',          'NHF-10040', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 41
(41, 'Neville',   'Omar',    'Anderson',  '1976-07-19', 'male',
 '5001041', '123-456-829', '876-555-0141', '876-555-1141', 'nanderson@gmail.com',
 'call',    '8 Tucker Ave, Kingston',      'Kingston',  'Civil Engineer',
 'married',  'O-',  'Medecus',          'NHF-10041', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 42
(42, 'Sasha',     NULL,      'Powell',    '2001-04-06', 'female',
 '5001042', '123-456-830', '876-555-0142', '876-555-1142', 'spowell@gmail.com',
 'whatsapp','31 Barbican Rd, Kingston',   'Kingston',  'Student',
 'single',   'AB+', NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 43
(43, 'Leroy',     NULL,      'Hamilton',  '1959-11-03', 'male',
 '5001043', '123-456-831', '876-555-0143', NULL,          'lhamilton@hotmail.com',
 'call',    '14 Orange St, Kingston',      'Kingston',  'Retired',
 'widowed',  'B-',  'Sagicor',          'NHF-10043', 'Statins — on current meds',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 44
(44, 'Tracey',    'Marie',   'Hunter',    '1988-08-15', 'female',
 '5001044', '123-456-832', '876-555-0144', '876-555-1144', 'thunter@gmail.com',
 'email',   '26 Meadowbrook Ave, Kingston','St. Andrew','Nutritionist',
 'married',  'A+',  'Medecus',          'NHF-10044', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 45
(45, 'Orville',   NULL,      'Richards',  '1973-02-09', 'male',
 '5001045', '123-456-833', '876-555-0145', '876-555-1145', 'orichards@yahoo.com',
 'call',    '9 Half Way Tree Rd, Kingston','Kingston',  'Journalist',
 'divorced', 'O+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 46
(46, 'Vanessa',   'Nicole',  'Ferguson',  '1991-06-21', 'female',
 '5001046', '123-456-834', '876-555-0146', '876-555-1146', 'vferguson@gmail.com',
 'whatsapp','37 Old Hope Rd, Kingston',   'Kingston',  'Marketing Manager',
 'married',  'B+',  'Sagicor',          'NHF-10046', NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 47
(47, 'Denton',    NULL,      'Knight',    '1980-09-27', 'male',
 '5001047', '123-456-835', '876-555-0147', NULL,          'dknight@gmail.com',
 'call',    '6 Sandhurst Ave, Kingston',  'Kingston',  'Chef',
 'single',   'A+',  NULL,               NULL,        NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 48
(48, 'Marva',     'Louise',  'Burke',     '1967-12-14', 'female',
 '5001048', '123-456-836', '876-555-0148', '876-555-1148', 'mburke@hotmail.com',
 'call',    '20 Seymour Crescent, Kingston','Kingston','Church Administrator',
 'married',  'AB+', 'Medecus',          'NHF-10048', 'Sulfa drugs',
 'staff', 'active', 1, NOW(), 2, NOW());

-- ---------------------------------------------
-- PENDING REGISTRATIONS (self-registered, awaiting staff review)
-- ---------------------------------------------
INSERT INTO patients
  (id, first_name, middle_name, last_name, date_of_birth, sex,
   national_id, trn, phone, phone_secondary, email,
   preferred_contact, address, parish, occupation,
   marital_status, blood_type, insurance_provider, nhf_card_number,
   allergies_summary, registration_source, status,
   consent_given, consent_date, registered_by, created_at)
VALUES
-- 49
(49, 'Marcus',    NULL,  'Reid',     '2000-03-12', 'male',
 NULL, NULL, '876-555-0149', NULL, 'mreid2000@gmail.com',
 'call', '11 Waltham Park Rd, Kingston', 'Kingston', 'Student',
 'single', NULL, NULL, NULL, NULL,
 'self_registration', 'pending_review', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
-- 50
(50, 'Sherene',   NULL,  'Campbell', '1994-07-08', 'female',
 NULL, NULL, '876-555-0150', '876-555-1150', 'scampbell94@yahoo.com',
 'whatsapp', '4 Molynes Rd, Kingston', 'Kingston', 'Receptionist',
 'single', NULL, NULL, NULL, NULL,
 'self_registration', 'pending_review', 1, DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
-- 51
(51, 'Dwayne',    'A.',  'Gordon',   '1982-11-17', 'male',
 NULL, NULL, '876-555-0151', NULL, 'dgordon82@gmail.com',
 'call', '19 Dunrobin Ave, Kingston', 'Kingston', 'Self-employed',
 'married', NULL, NULL, NULL, NULL,
 'self_registration', 'pending_review', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ---------------------------------------------
-- PAEDIATRIC PATIENTS  (IDs 52-61, under 18 as of 2026)
-- Parent/guardian phone used as contact; occupation = 'Student' / 'Child'
-- ---------------------------------------------
INSERT INTO patients
  (id, first_name, middle_name, last_name, date_of_birth, sex,
   national_id, trn, phone, phone_secondary, email,
   preferred_contact, address, parish, occupation,
   marital_status, blood_type, insurance_provider, nhf_card_number,
   allergies_summary, registration_source, status,
   consent_given, consent_date, registered_by, created_at)
VALUES
-- 52  age 7
(52, 'Jaylen',   NULL,   'Campbell',  '2018-05-12', 'male',
 NULL, NULL, '876-555-0152', NULL, NULL,
 'call', '12 Hope Rd, Kingston', 'Kingston', 'Student',
 'single', 'A+', NULL, NULL, NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 53  age 4
(53, 'Amara',    NULL,   'Brown',     '2021-09-03', 'female',
 NULL, NULL, '876-555-0153', NULL, NULL,
 'call', '30 Old Hope Rd, Kingston', 'Kingston', 'Child',
 'single', 'O+', 'Sagicor', NULL, 'Peanuts',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 54  age 11
(54, 'Tristan',  NULL,   'Reid',      '2014-02-18', 'male',
 NULL, NULL, '876-555-0154', NULL, NULL,
 'call', '22 Barbican Rd, Kingston', 'Kingston', 'Student',
 'single', 'B+', NULL, NULL, 'Penicillin',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 55  age 2
(55, 'Naomi',    NULL,   'Johnson',   '2023-11-27', 'female',
 NULL, NULL, '876-555-0155', NULL, NULL,
 'call', '9 Hagley Park Rd, Kingston', 'Kingston', 'Child',
 'single', 'B-', NULL, NULL, NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 56  age 9
(56, 'Ethan',    NULL,   'Clarke',    '2016-07-04', 'male',
 NULL, NULL, '876-555-0156', NULL, NULL,
 'call', '14 Maxfield Ave, Kingston', 'Kingston', 'Student',
 'single', 'O-', NULL, NULL, 'Amoxicillin',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 57  age 14
(57, 'Brianna',  NULL,   'Morrison',  '2011-04-21', 'female',
 NULL, NULL, '876-555-0157', NULL, NULL,
 'whatsapp', '5 Dunrobin Ave, Kingston', 'Kingston', 'Student',
 'single', 'A-', 'Sagicor', NULL, NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 58  age 6
(58, 'Kaden',    NULL,   'Williams',  '2019-12-09', 'male',
 NULL, NULL, '876-555-0158', NULL, NULL,
 'call', '43 Mannings Hill Rd, Kingston', 'St. Andrew', 'Child',
 'single', 'AB+', NULL, NULL, NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 59  age 13
(59, 'Lila',     'Ann',  'Thompson',  '2012-08-15', 'female',
 NULL, NULL, '876-555-0159', NULL, NULL,
 'call', '7 Cherry Gardens, Kingston', 'Kingston', 'Student',
 'single', 'O+', 'Medecus', NULL, 'Dust mites — asthma trigger',
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 60  age 3
(60, 'Malik',    NULL,   'Edwards',   '2022-03-30', 'male',
 NULL, NULL, '876-555-0160', NULL, NULL,
 'call', '88 Maxfield Ave, Kingston', 'Kingston', 'Child',
 'single', 'A+', NULL, NULL, NULL,
 'staff', 'active', 1, NOW(), 2, NOW()),
-- 61  age 16
(61, 'Destiny',  NULL,   'Grant',     '2009-06-17', 'female',
 NULL, NULL, '876-555-0161', '876-555-1161', 'destgrant@gmail.com',
 'call', '45 Hope Rd, Kingston', 'Kingston', 'Student',
 'single', 'AB-', 'Sagicor', NULL, 'Shellfish',
 'staff', 'active', 1, NOW(), 2, NOW());

-- =============================================================
-- APPOINTMENTS
--
-- Doctors:  3=Campbell  4=Grant  5=Nair  6=Williams(Paed)  7=Henry
-- Kids (52-61) go exclusively to Dr. Williams (6).
-- Patients batched uniquely per day  --  no patient on two days
-- within the same block.
-- Today=2026-06-12(Fri).
-- Past: Mon08Jun-Thu11Jun  |  Today: 12Jun  |  Future: Mon15Jun-Fri26Jun
-- =============================================================

-- -------------------------------------------------------------
-- PAST: Monday 2026-06-08  (patients 1-10)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(1,  1,  3, 2, @pw_mon,'08:30',30,'follow_up',  'completed','Diabetes management follow-up'),
(2,  2,  4, 2, @pw_mon,'09:00',20,'consultation','completed','Chest tightness evaluation'),
(3,  3,  5, 2, @pw_mon,'09:15',30,'follow_up',  'completed','Cardiology 3-month review'),
(4,  4,  7, 2, @pw_mon,'08:45',15,'walk_in',    'completed','Fever and sore throat'),
(5,  5,  7, 2, @pw_mon,'10:00',20,'consultation','completed','Back pain assessment'),
(6,  6,  3, 2, @pw_mon,'10:30',15,'consultation','completed','Routine blood pressure check'),
(7,  7,  4, 2, @pw_mon,'11:00',30,'follow_up',  'completed','Hypertension 6-month review'),
(8,  8,  5, 2, @pw_mon,'11:30',20,'consultation','completed','Palpitations workup'),
(9,  9,  3, 2, @pw_mon,'09:30',15,'walk_in',    'completed','Ear pain'),
(10, 10, 7, 2, @pw_mon,'14:00',30,'follow_up',  'completed','Post-operative follow-up');

-- -------------------------------------------------------------
-- PAST: Tuesday 2026-06-09  (patients 11-20)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(11, 11, 3, 2, @pw_tue,'08:00',20,'consultation','completed','Annual physical'),
(12, 12, 4, 2, @pw_tue,'08:30',15,'walk_in',    'completed','Rash on arm'),
(13, 13, 5, 2, @pw_tue,'09:00',30,'follow_up',  'completed','Cardiology follow-up'),
(14, 14, 4, 2, @pw_tue,'08:15',20,'consultation','completed','Fatigue and dizziness'),
(15, 15, 7, 2, @pw_tue,'10:00',30,'follow_up',  'completed','Diabetes quarterly check'),
(16, 16, 3, 2, @pw_tue,'10:30',15,'consultation','completed','Contraceptive counselling'),
(17, 17, 4, 2, @pw_tue,'11:00',20,'consultation','completed','Joint pain review'),
(18, 18, 5, 2, @pw_tue,'11:30',30,'follow_up',  'completed','Echo follow-up'),
(19, 19, 7, 2, @pw_tue,'09:30',15,'walk_in',    'completed','Flu symptoms'),
(20, 20, 7, 2, @pw_tue,'14:30',20,'consultation','completed','Anxiety management');

-- -------------------------------------------------------------
-- PAST: Wednesday 2026-06-10  (patients 21-30)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(21, 21, 3, 2, @pw_wed,'08:30',20,'consultation','completed','Cholesterol results review'),
(22, 22, 4, 2, @pw_wed,'09:00',15,'walk_in',    'completed','Headache'),
(23, 23, 5, 2, @pw_wed,'09:30',30,'follow_up',  'completed','ECG review'),
(24, 24, 3, 2, @pw_wed,'08:00',20,'consultation','completed','Asthma check'),
(25, 25, 7, 2, @pw_wed,'10:00',30,'follow_up',  'completed','Hypertension management'),
(26, 26, 3, 2, @pw_wed,'10:30',15,'consultation','completed','STI screening'),
(27, 27, 4, 2, @pw_wed,'11:00',20,'consultation','completed','Prostate PSA review'),
(28, 28, 5, 2, @pw_wed,'11:30',30,'follow_up',  'completed','Holter monitor results'),
(29, 29, 4, 2, @pw_wed,'09:00',15,'walk_in',    'completed','Allergic reaction'),
(30, 30, 7, 2, @pw_wed,'13:00',20,'consultation','completed','Weight management counselling');

-- -------------------------------------------------------------
-- PAST: Thursday 2026-06-11  (patients 31-40)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(31, 31, 3, 2, @pw_thu,'08:00',30,'follow_up',  'completed','Kidney function review'),
(32, 32, 4, 2, @pw_thu,'08:30',15,'walk_in',    'completed','Sprained ankle'),
(33, 33, 5, 2, @pw_thu,'09:00',30,'follow_up',  'completed','Stress test results'),
(34, 34, 7, 2, @pw_thu,'08:15',20,'consultation','completed','Thyroid follow-up'),
(35, 35, 7, 2, @pw_thu,'10:00',30,'follow_up',  'completed','COPD management review'),
(36, 36, 3, 2, @pw_thu,'10:30',20,'consultation','completed','Breast exam'),
(37, 37, 4, 2, @pw_thu,'11:00',15,'consultation','completed','Skin lesion check'),
(38, 38, 5, 2, @pw_thu,'11:30',30,'follow_up',  'completed','Arrhythmia check'),
(39, 39, 3, 2, @pw_thu,'09:15',15,'walk_in',    'completed','Eye irritation'),
(40, 40, 7, 2, @pw_thu,'14:00',20,'consultation','completed','Depression screening');

-- -------------------------------------------------------------
-- TODAY: Friday 2026-06-12  (patients 1-15 spread across docs)
-- completed (no checkout), waiting, triage, scheduled
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason,triage_urgency) VALUES
-- Completed  --  await checkout
(41, 1,  3, 2, @today,'08:00',30,'follow_up',  'completed','Diabetes quarterly review',NULL),
(42, 2,  4, 2, @today,'08:15',20,'consultation','completed','Blood pressure check',     NULL),
(43, 3,  5, 2, @today,'08:30',30,'follow_up',  'completed','Cardiology 6-month review',NULL),
-- Waiting
(44, 4,  7, 2, @today,'09:00',20,'walk_in',    'waiting',  'Fever and chills',         'routine'),
(45, 5,  3, 2, @today,'09:15',20,'consultation','waiting',  'Lower back pain',          'routine'),
-- Triage
(46, 6,  4, 2, @today,'09:30',15,'walk_in',    'triage',   'Shortness of breath',      'priority'),
(47, 7,  7, 2, @today,'09:45',30,'follow_up',  'triage',   'Hypertension med review',  'routine'),
-- Scheduled upcoming today
(48, 8,  5, 2, @today,'10:30',30,'consultation','scheduled','Chest pain evaluation',    NULL),
(49, 9,  3, 2, @today,'11:00',15,'walk_in',    'scheduled','Ear ache',                 NULL),
(50, 10, 7, 2, @today,'11:30',30,'follow_up',  'scheduled','Post-op check',            NULL),
(51, 11, 3, 2, @today,'12:00',20,'consultation','scheduled','Annual wellness visit',    NULL),
(52, 12, 4, 2, @today,'12:30',15,'consultation','scheduled','Medication refill',        NULL),
(53, 13, 5, 2, @today,'13:00',30,'follow_up',  'scheduled','Cardiac rehab review',     NULL),
(54, 14, 4, 2, @today,'14:00',20,'consultation','scheduled','Fatigue workup',           NULL),
(55, 15, 7, 2, @today,'14:30',30,'follow_up',  'scheduled','Diabetes 3-month check',   NULL);

-- -------------------------------------------------------------
-- FUTURE: Monday 2026-06-15  (patients 16-25)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(56, 16, 3, 2, @nw_mon,'08:00',15,'consultation','scheduled','Contraceptive review'),
(57, 17, 4, 2, @nw_mon,'08:30',20,'follow_up',  'scheduled','Arthritis management'),
(58, 18, 5, 2, @nw_mon,'09:00',30,'follow_up',  'scheduled','Echocardiogram review'),
(59, 19, 7, 2, @nw_mon,'09:30',20,'consultation','scheduled','Flu vaccine'),
(60, 20, 7, 2, @nw_mon,'10:00',20,'consultation','scheduled','Mental health check-in'),
(61, 21, 3, 2, @nw_mon,'10:30',30,'follow_up',  'scheduled','Lipid panel review'),
(62, 22, 4, 2, @nw_mon,'11:00',15,'walk_in',    'scheduled','Rash follow-up'),
(63, 23, 5, 2, @nw_mon,'11:30',30,'follow_up',  'scheduled','Pacemaker check'),
(64, 24, 3, 2, @nw_mon,'12:00',20,'consultation','scheduled','Asthma action plan'),
(65, 25, 7, 2, @nw_mon,'14:00',30,'follow_up',  'scheduled','Blood pressure target review');

-- -------------------------------------------------------------
-- FUTURE: Tuesday 2026-06-16  (patients 26-35)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(66, 26, 3, 2, @nw_tue,'08:30',15,'consultation','scheduled','Results review'),
(67, 27, 4, 2, @nw_tue,'09:00',20,'follow_up',  'scheduled','Prostate follow-up'),
(68, 28, 5, 2, @nw_tue,'09:30',30,'follow_up',  'scheduled','Holter results review'),
(69, 29, 4, 2, @nw_tue,'10:00',15,'consultation','scheduled','Allergy management'),
(70, 30, 7, 2, @nw_tue,'10:30',30,'follow_up',  'scheduled','Weight management follow-up'),
(71, 31, 3, 2, @nw_tue,'11:00',20,'follow_up',  'scheduled','Kidney disease review'),
(72, 32, 4, 2, @nw_tue,'11:30',15,'consultation','scheduled','Physiotherapy referral'),
(73, 33, 5, 2, @nw_tue,'13:00',30,'follow_up',  'scheduled','Stress test review'),
(74, 34, 7, 2, @nw_tue,'14:00',20,'follow_up',  'scheduled','Thyroid results'),
(75, 35, 7, 2, @nw_tue,'14:30',30,'follow_up',  'scheduled','COPD pulmonary function');

-- -------------------------------------------------------------
-- FUTURE: Wednesday 2026-06-17  (patients 36-45)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(76, 36, 3, 2, @nw_wed,'08:00',20,'follow_up',  'scheduled','Mammography referral follow-up'),
(77, 37, 4, 2, @nw_wed,'08:30',15,'consultation','scheduled','Dermatology referral'),
(78, 38, 5, 2, @nw_wed,'09:00',30,'follow_up',  'scheduled','Arrhythmia management'),
(79, 39, 3, 2, @nw_wed,'09:15',15,'consultation','scheduled','Vision check'),
(80, 40, 7, 2, @nw_wed,'10:00',30,'follow_up',  'scheduled','Antidepressant review'),
(81, 41, 3, 2, @nw_wed,'10:30',20,'consultation','scheduled','Kidney stones prevention'),
(82, 42, 4, 2, @nw_wed,'11:00',15,'consultation','scheduled','Vaccination catch-up'),
(83, 43, 5, 2, @nw_wed,'11:30',30,'follow_up',  'scheduled','Stent follow-up'),
(84, 44, 4, 2, @nw_wed,'12:00',20,'consultation','scheduled','Women health screening'),
(85, 45, 7, 2, @nw_wed,'14:00',20,'follow_up',  'scheduled','Gout management');

-- -------------------------------------------------------------
-- FUTURE: Thursday 2026-06-18  (patients 46-48, then 1-7)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(86, 46, 3, 2, @nw_thu,'08:30',20,'consultation','scheduled','PCOS management'),
(87, 47, 4, 2, @nw_thu,'09:00',30,'follow_up',  'scheduled','Sleep apnea review'),
(88, 48, 5, 2, @nw_thu,'09:30',30,'follow_up',  'scheduled','Heart failure management'),
(89, 1,  7, 2, @nw_thu,'10:00',20,'follow_up',  'scheduled','Diabetes complication screen'),
(90, 2,  7, 2, @nw_thu,'10:30',30,'follow_up',  'scheduled','Hypertension med titration'),
(91, 3,  3, 2, @nw_thu,'11:00',30,'follow_up',  'scheduled','Cardiology annual review'),
(92, 4,  4, 2, @nw_thu,'11:30',15,'walk_in',    'scheduled','Wound dressing'),
(93, 5,  5, 2, @nw_thu,'13:00',20,'consultation','scheduled','Referral letter discussion'),
(94, 6,  3, 2, @nw_thu,'14:00',15,'consultation','scheduled','Respiratory follow-up'),
(95, 7,  7, 2, @nw_thu,'14:30',30,'follow_up',  'scheduled','Hypertension 3-month check');

-- -------------------------------------------------------------
-- FUTURE: Friday 2026-06-19  (patients 8-17)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(96,  8,  3, 2, @nw_fri,'08:00',30,'follow_up',  'scheduled','Cardiology stress test review'),
(97,  9,  4, 2, @nw_fri,'08:30',15,'consultation','scheduled','Ear wax removal'),
(98,  10, 5, 2, @nw_fri,'09:00',30,'follow_up',  'scheduled','Post-op cardiac 6-week'),
(99,  11, 7, 2, @nw_fri,'09:30',20,'consultation','scheduled','Child immunisation'),
(100, 12, 7, 2, @nw_fri,'10:00',15,'consultation','scheduled','Prescription refill'),
(101, 13, 3, 2, @nw_fri,'10:30',30,'follow_up',  'scheduled','Cardiac rehab week 6'),
(102, 14, 4, 2, @nw_fri,'11:00',20,'consultation','scheduled','Iron deficiency review'),
(103, 15, 5, 2, @nw_fri,'11:30',30,'follow_up',  'scheduled','Diabetes HbA1c review'),
(104, 16, 4, 2, @nw_fri,'13:00',15,'consultation','scheduled','Gynaecology referral'),
(105, 17, 7, 2, @nw_fri,'14:00',20,'follow_up',  'scheduled','Arthritis flare management');

-- -------------------------------------------------------------
-- FUTURE: Monday 2026-06-22  (patients 18-27)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(106, 18, 3, 2, @ww_mon,'08:30',30,'follow_up',  'scheduled','Echo results review'),
(107, 19, 4, 2, @ww_mon,'09:00',15,'consultation','scheduled','Vaccine catch-up'),
(108, 20, 5, 2, @ww_mon,'09:30',20,'follow_up',  'scheduled','Mental health review'),
(109, 21, 7, 2, @ww_mon,'10:00',30,'follow_up',  'scheduled','Renal function check'),
(110, 22, 7, 2, @ww_mon,'10:30',15,'consultation','scheduled','Skin check'),
(111, 23, 3, 2, @ww_mon,'11:00',30,'follow_up',  'scheduled','Pacemaker battery check'),
(112, 24, 4, 2, @ww_mon,'11:30',20,'consultation','scheduled','Asthma spacer review'),
(113, 25, 5, 2, @ww_mon,'13:00',30,'follow_up',  'scheduled','Hypertension 6-month'),
(114, 26, 3, 2, @ww_mon,'14:00',15,'consultation','scheduled','Contraception change'),
(115, 27, 7, 2, @ww_mon,'14:30',20,'follow_up',  'scheduled','Benign prostatic review');

-- -------------------------------------------------------------
-- FUTURE: Tuesday 2026-06-23  (patients 28-37)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(116, 28, 3, 2, @ww_tue,'08:00',30,'follow_up',  'scheduled','Heart rhythm review'),
(117, 29, 4, 2, @ww_tue,'08:30',15,'consultation','scheduled','Allergy shot review'),
(118, 30, 5, 2, @ww_tue,'09:00',30,'follow_up',  'scheduled','Cardiomyopathy review'),
(119, 31, 4, 2, @ww_tue,'09:30',20,'follow_up',  'scheduled','CKD stage review'),
(120, 32, 7, 2, @ww_tue,'10:00',20,'consultation','scheduled','Fracture follow-up'),
(121, 33, 3, 2, @ww_tue,'10:30',30,'follow_up',  'scheduled','CAD management'),
(122, 34, 4, 2, @ww_tue,'11:00',20,'follow_up',  'scheduled','Hyperthyroid review'),
(123, 35, 5, 2, @ww_tue,'11:30',30,'follow_up',  'scheduled','COPD exacerbation review'),
(124, 36, 7, 2, @ww_tue,'13:00',15,'consultation','scheduled','Cervical screening'),
(125, 37, 7, 2, @ww_tue,'14:00',20,'consultation','scheduled','Acne treatment review');

-- -------------------------------------------------------------
-- FUTURE: Wednesday 2026-06-24  (patients 38-47)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(126, 38, 3, 2, @ww_wed,'08:30',20,'follow_up',  'scheduled','SVT management review'),
(127, 39, 4, 2, @ww_wed,'09:00',15,'consultation','scheduled','Gout flare follow-up'),
(128, 40, 5, 2, @ww_wed,'09:30',30,'follow_up',  'scheduled','Antidepressant titration'),
(129, 41, 3, 2, @ww_wed,'10:00',20,'consultation','scheduled','Dietary counselling'),
(130, 42, 7, 2, @ww_wed,'10:30',15,'consultation','scheduled','Growth and development check'),
(131, 43, 3, 2, @ww_wed,'11:00',30,'follow_up',  'scheduled','Post-cardiac catheterisation'),
(132, 44, 4, 2, @ww_wed,'11:30',20,'consultation','scheduled','Pap smear results'),
(133, 45, 5, 2, @ww_wed,'13:00',20,'follow_up',  'scheduled','Gout uric acid review'),
(134, 46, 4, 2, @ww_wed,'14:00',20,'consultation','scheduled','Fertility screening'),
(135, 47, 7, 2, @ww_wed,'14:30',30,'follow_up',  'scheduled','Sleep study review');

-- -------------------------------------------------------------
-- FUTURE: Thursday 2026-06-25  (patients 48, 1-9)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(136, 48, 3, 2, @ww_thu,'08:00',20,'follow_up',  'scheduled','Congestive heart failure'),
(137, 1,  4, 2, @ww_thu,'08:30',30,'follow_up',  'scheduled','Retinopathy screening'),
(138, 2,  5, 2, @ww_thu,'09:00',30,'follow_up',  'scheduled','Hypertension 9-month'),
(139, 3,  7, 2, @ww_thu,'09:30',30,'follow_up',  'scheduled','Cardiology device check'),
(140, 4,  7, 2, @ww_thu,'10:00',15,'walk_in',    'scheduled','Rash'),
(141, 5,  3, 2, @ww_thu,'10:30',20,'consultation','scheduled','Back pain re-assessment'),
(142, 6,  4, 2, @ww_thu,'11:00',20,'consultation','scheduled','Respiratory function test'),
(143, 7,  5, 2, @ww_thu,'11:30',30,'follow_up',  'scheduled','Ambulatory BP monitoring results'),
(144, 8,  3, 2, @ww_thu,'13:00',30,'follow_up',  'scheduled','Cardiac stress test'),
(145, 9,  7, 2, @ww_thu,'14:00',15,'consultation','scheduled','ENT referral discussion');

-- -------------------------------------------------------------
-- FUTURE: Friday 2026-06-26  (patients 10-19)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
(146, 10, 3, 2, @ww_fri,'08:00',30,'follow_up',  'scheduled','Post-op 12-week check'),
(147, 11, 4, 2, @ww_fri,'08:30',20,'consultation','scheduled','Annual physical examination'),
(148, 12, 5, 2, @ww_fri,'09:00',30,'follow_up',  'scheduled','Aortic stenosis review'),
(149, 13, 4, 2, @ww_fri,'09:30',20,'follow_up',  'scheduled','Cardiac rehab final session'),
(150, 14, 7, 2, @ww_fri,'10:00',30,'follow_up',  'scheduled','Anaemia management'),
(151, 15, 3, 2, @ww_fri,'10:30',30,'follow_up',  'scheduled','Insulin adjustment'),
(152, 16, 4, 2, @ww_fri,'11:00',20,'consultation','scheduled','Annual cervical check'),
(153, 17, 5, 2, @ww_fri,'11:30',20,'follow_up',  'scheduled','Joint replacement assessment'),
(154, 18, 7, 2, @ww_fri,'13:00',30,'follow_up',  'scheduled','Dilated cardiomyopathy'),
(155, 19, 7, 2, @ww_fri,'14:00',30,'follow_up',  'scheduled','COPD + hypertension combined');

-- -------------------------------------------------------------
-- PAEDIATRIC APPOINTMENTS — Past week (kids 52-61 with Dr. Williams id=6)
-- -------------------------------------------------------------
INSERT INTO appointments (id,patient_id,doctor_id,booked_by,appointment_date,appointment_time,duration_minutes,visit_type,status,reason) VALUES
-- Monday: Jaylen Campbell age 7 — routine check
(156, 52, 6, 2, @pw_mon,'10:00',20,'consultation','completed','Routine growth and development check'),
-- Monday: Amara Brown age 4 — fever
(157, 53, 6, 2, @pw_mon,'10:30',15,'walk_in',    'completed','Fever 38.9C, fussy, not eating'),
-- Tuesday: Tristan Reid age 11 — asthma review
(158, 54, 6, 2, @pw_tue,'10:00',20,'follow_up',  'completed','Asthma management review'),
-- Tuesday: Naomi Johnson age 2 — 24-month developmental
(159, 55, 6, 2, @pw_tue,'10:30',20,'consultation','completed','24-month developmental milestone check'),
-- Wednesday: Ethan Clarke age 9 — ear infection
(160, 56, 6, 2, @pw_wed,'10:00',15,'walk_in',    'completed','Ear pain, pulling left ear, fever'),
-- Wednesday: Brianna Morrison age 14 — scoliosis follow-up
(161, 57, 6, 2, @pw_wed,'10:30',20,'follow_up',  'completed','Scoliosis 6-month monitoring'),
-- Thursday: Kaden Williams age 6 — vaccination
(162, 58, 6, 2, @pw_thu,'10:00',15,'consultation','completed','MMR booster vaccination'),
-- Thursday: Lila Thompson age 13 — asthma acute
(163, 59, 6, 2, @pw_thu,'10:30',20,'walk_in',    'completed','Asthma exacerbation — mild wheeze'),

-- -------------------------------------------------------------
-- PAEDIATRIC APPOINTMENTS — Today (kids on Dr. Williams schedule today)
-- -------------------------------------------------------------
(164, 60, 6, 2, @today,'09:00',20,'consultation','completed','3-year well-child visit — Malik Edwards'),
(165, 61, 6, 2, @today,'13:00',20,'follow_up',  'scheduled','Sickle cell anaemia follow-up — Destiny Grant'),

-- -------------------------------------------------------------
-- PAEDIATRIC APPOINTMENTS — Future weeks (Dr. Williams paeds-only)
-- -------------------------------------------------------------

-- Next Mon (15 Jun) — Williams paed slots
(166, 52, 6, 2, @nw_mon,'08:00',20,'follow_up',  'scheduled','Post-fever follow-up check'),
(167, 53, 6, 2, @nw_mon,'12:30',15,'consultation','scheduled','Vaccination catch-up — Amara Brown'),

-- Next Tue (16 Jun) — Williams paed slots
(168, 54, 6, 2, @nw_tue,'08:00',20,'follow_up',  'scheduled','Asthma preventer inhaler review'),
(169, 55, 6, 2, @nw_tue,'12:30',15,'consultation','scheduled','30-month check — Naomi Johnson'),

-- Next Wed (17 Jun) — Williams paed slots
(170, 56, 6, 2, @nw_wed,'08:00',15,'follow_up',  'scheduled','Post-ear infection check'),
(171, 57, 6, 2, @nw_wed,'12:30',20,'follow_up',  'scheduled','Scoliosis X-ray review'),

-- Next Thu (18 Jun) — Williams paed slots
(172, 58, 6, 2, @nw_thu,'08:00',20,'consultation','scheduled','Post-vaccine reaction check'),
(173, 59, 6, 2, @nw_thu,'12:00',20,'follow_up',  'scheduled','Asthma action plan update — Lila Thompson'),

-- Next Fri (19 Jun) — Williams paed slots
(174, 60, 6, 2, @nw_fri,'08:00',20,'follow_up',  'scheduled','4-year well-child — Malik Edwards'),
(175, 61, 6, 2, @nw_fri,'12:30',20,'follow_up',  'scheduled','Haematology results review — Destiny Grant'),

-- Week after (22-26 Jun) — Williams paed slots
-- Mon 22
(176, 52, 6, 2, @ww_mon,'08:00',20,'follow_up',  'scheduled','Growth chart review'),
-- Tue 23
(177, 54, 6, 2, @ww_tue,'08:00',20,'consultation','scheduled','School health form completion'),
-- Wed 24
(178, 56, 6, 2, @ww_wed,'08:00',20,'follow_up',  'scheduled','ENT referral follow-up'),
-- Thu 25
(179, 59, 6, 2, @ww_thu,'08:00',20,'follow_up',  'scheduled','Asthma spirometry review'),
-- Fri 26
(180, 61, 6, 2, @ww_fri,'08:00',20,'follow_up',  'scheduled','Sickle cell hydroxyurea review');

-- =============================================================
-- VISITS
-- Past closed visits for appts 1-40 (Mon-Thu last week)
-- Paediatric past visits for appts 156-163 (Mon-Thu last week)
-- Today completed visits (no checkout) for appts 41-43, 164
-- Today open visits for appts 44-47 (in triage/waiting)
-- =============================================================

-- Monday 2026-06-08
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(1,  1,  1,  3, 2, @pw_mon,'08:30','follow_up',  'completed','Diabetes follow-up'),
(2,  2,  2,  4, 2, @pw_mon,'09:00','consultation','completed','Chest tightness'),
(3,  3,  3,  5, 2, @pw_mon,'09:15','follow_up',  'completed','Cardiology 3-month review'),
(4,  4,  4,  7, 2, @pw_mon,'08:45','walk_in',    'completed','Fever 38.8C, sore throat'),
(5,  5,  5,  7, 2, @pw_mon,'10:00','consultation','completed','Lower back pain'),
(6,  6,  6,  3, 2, @pw_mon,'10:30','consultation','completed','BP 148/92'),
(7,  7,  7,  4, 2, @pw_mon,'11:00','follow_up',  'completed','Hypertension review'),
(8,  8,  8,  5, 2, @pw_mon,'11:30','consultation','completed','Palpitations'),
(9,  9,  9,  3, 2, @pw_mon,'09:30','walk_in',    'completed','Left ear pain 2 days'),
(10, 10, 10, 7, 2, @pw_mon,'14:00','follow_up',  'completed','Post-op week 8');

-- Tuesday 2026-06-09
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(11, 11, 11, 3, 2, @pw_tue,'08:00','consultation','completed','Annual physical'),
(12, 12, 12, 4, 2, @pw_tue,'08:30','walk_in',    'completed','Arm rash 3 days'),
(13, 13, 13, 5, 2, @pw_tue,'09:00','follow_up',  'completed','Cardiology follow-up'),
(14, 14, 14, 4, 2, @pw_tue,'08:15','consultation','completed','Fatigue and dizziness'),
(15, 15, 15, 7, 2, @pw_tue,'10:00','follow_up',  'completed','Diabetes quarterly check'),
(16, 16, 16, 3, 2, @pw_tue,'10:30','consultation','completed','Contraceptive counselling'),
(17, 17, 17, 4, 2, @pw_tue,'11:00','consultation','completed','Joint pain both knees'),
(18, 18, 18, 5, 2, @pw_tue,'11:30','follow_up',  'completed','Echo follow-up'),
(19, 19, 19, 7, 2, @pw_tue,'09:30','walk_in',    'completed','Flu symptoms 4 days'),
(20, 20, 20, 7, 2, @pw_tue,'14:30','consultation','completed','Anxiety');

-- Wednesday 2026-06-10
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(21, 21, 21, 3, 2, @pw_wed,'08:30','consultation','completed','Cholesterol results review'),
(22, 22, 22, 4, 2, @pw_wed,'09:00','walk_in',    'completed','Headache 2 days'),
(23, 23, 23, 5, 2, @pw_wed,'09:30','follow_up',  'completed','ECG review'),
(24, 24, 24, 3, 2, @pw_wed,'08:00','consultation','completed','Asthma check'),
(25, 25, 25, 7, 2, @pw_wed,'10:00','follow_up',  'completed','Hypertension management'),
(26, 26, 26, 3, 2, @pw_wed,'10:30','consultation','completed','STI screening'),
(27, 27, 27, 4, 2, @pw_wed,'11:00','consultation','completed','PSA 4.8 review'),
(28, 28, 28, 5, 2, @pw_wed,'11:30','follow_up',  'completed','Holter monitor results'),
(29, 29, 29, 4, 2, @pw_wed,'09:00','walk_in',    'completed','Allergic reaction face'),
(30, 30, 30, 7, 2, @pw_wed,'13:00','consultation','completed','Weight management');

-- Thursday 2026-06-11
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(31, 31, 31, 3, 2, @pw_thu,'08:00','follow_up',  'completed','Kidney function review'),
(32, 32, 32, 4, 2, @pw_thu,'08:30','walk_in',    'completed','Sprained ankle'),
(33, 33, 33, 5, 2, @pw_thu,'09:00','follow_up',  'completed','Stress test results'),
(34, 34, 34, 7, 2, @pw_thu,'08:15','consultation','completed','Thyroid follow-up'),
(35, 35, 35, 7, 2, @pw_thu,'10:00','follow_up',  'completed','COPD management review'),
(36, 36, 36, 3, 2, @pw_thu,'10:30','consultation','completed','Breast exam'),
(37, 37, 37, 4, 2, @pw_thu,'11:00','consultation','completed','Skin lesion check'),
(38, 38, 38, 5, 2, @pw_thu,'11:30','follow_up',  'completed','Arrhythmia check'),
(39, 39, 39, 3, 2, @pw_thu,'09:15','walk_in',    'completed','Eye redness, irritation'),
(40, 40, 40, 7, 2, @pw_thu,'14:00','consultation','completed','Depression screening');

-- Paediatric past visits (Mon-Thu last week)
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(48, 156, 52, 6, 2, @pw_mon,'10:05','consultation','completed','Routine growth and development — height 118cm weight 22kg, on track'),
(49, 157, 53, 6, 2, @pw_mon,'10:32','walk_in',    'completed','Fever 38.9C, pharyngitis — strep rapid positive'),
(50, 158, 54, 6, 2, @pw_tue,'10:05','follow_up',  'completed','Asthma well controlled on preventer — peak flow 85%'),
(51, 159, 55, 6, 2, @pw_tue,'10:32','consultation','completed','24-month milestones met, language on track, no concerns'),
(52, 160, 56, 6, 2, @pw_wed,'10:05','walk_in',    'completed','Otitis media left ear — amoxicillin course prescribed'),
(53, 161, 57, 6, 2, @pw_wed,'10:32','follow_up',  'completed','Scoliosis stable at 18 degrees — continue monitoring 6 months'),
(54, 162, 58, 6, 2, @pw_thu,'10:05','consultation','completed','MMR booster administered, no adverse reaction noted'),
(55, 163, 59, 6, 2, @pw_thu,'10:32','walk_in',    'completed','Mild asthma exacerbation — salbutamol given, improved, Seretide continued');

-- Today: completed, awaiting checkout (no checkout record)
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(41, 41, 1,  3, 2, @today,'08:05','follow_up',   'completed','Diabetes quarterly review'),
(42, 42, 2,  4, 2, @today,'08:20','consultation', 'completed','Blood pressure check'),
(43, 43, 3,  5, 2, @today,'08:35','follow_up',   'completed','Cardiology 6-month review'),
(56, 164, 60, 6, 2, @today,'09:05','consultation','completed','3-year well-child — Malik Edwards, all milestones met, weight 15kg');

-- Today: open visits (patients currently in triage/waiting)
INSERT INTO visits (id,appointment_id,patient_id,doctor_id,created_by,visit_date,visit_time,visit_type,status,presenting_complaint) VALUES
(44, 44, 4,  7, 2, @today,'09:05','walk_in',    'open','Fever 38.5C and chills since last night'),
(45, 45, 5,  3, 2, @today,'09:18','consultation','open','Lower back pain worsening over 3 days'),
(46, 46, 6,  4, 2, @today,'09:32','walk_in',    'open','Shortness of breath on exertion'),
(47, 47, 7,  7, 2, @today,'09:48','follow_up',  'open','Hypertension medication review');

-- =============================================================
-- CHECKOUTS  (all past completed visits, Mon-Thu last week)
-- Schema: visit_id, patient_id, processed_by, payment_type,
--         total_fee, patient_balance, patient_payment_method,
--         amount_paid, receipt_reference, checked_out_at
-- =============================================================
INSERT INTO checkouts (visit_id, patient_id, processed_by, payment_type, total_fee, patient_balance, patient_payment_method, amount_paid, receipt_reference, checked_out_at) VALUES
-- Monday 08 Jun
(1,  1,  2, 'insurance_balance', 3500.00,  700.00,  'cash', 700.00,  'RX20260608001', '2026-06-08 09:10:00'),
(2,  2,  2, 'out_of_pocket',     2500.00, 2500.00,  'cash', 2500.00, 'RX20260608002', '2026-06-08 09:35:00'),
(3,  3,  2, 'insurance_balance', 4000.00,  800.00,  'card', 800.00,  'RX20260608003', '2026-06-08 09:55:00'),
(4,  4,  2, 'out_of_pocket',     1500.00, 1500.00,  'cash', 1500.00, 'RX20260608004', '2026-06-08 09:20:00'),
(5,  5,  2, 'insurance_balance', 2800.00,  560.00,  'cash', 560.00,  'RX20260608005', '2026-06-08 10:45:00'),
(6,  6,  2, 'out_of_pocket',     2500.00, 2500.00,  'cash', 2500.00, 'RX20260608006', '2026-06-08 11:05:00'),
(7,  7,  2, 'full_insurance',    3000.00,    0.00,  'cash',    0.00, 'RX20260608007', '2026-06-08 11:50:00'),
(8,  8,  2, 'insurance_balance', 3500.00,  700.00,  'card', 700.00,  'RX20260608008', '2026-06-08 12:15:00'),
(9,  9,  2, 'out_of_pocket',     1800.00, 1800.00,  'cash', 1800.00, 'RX20260608009', '2026-06-08 10:10:00'),
(10, 10, 2, 'insurance_balance', 2500.00,  500.00,  'card', 500.00,  'RX20260608010', '2026-06-08 15:00:00'),
-- Tuesday 09 Jun
(11, 11, 2, 'full_insurance',    3000.00,    0.00,  'cash',    0.00, 'RX20260609011', '2026-06-09 09:00:00'),
(12, 12, 2, 'out_of_pocket',     1500.00, 1500.00,  'cash', 1500.00, 'RX20260609012', '2026-06-09 09:15:00'),
(13, 13, 2, 'insurance_balance', 4000.00,  800.00,  'card', 800.00,  'RX20260609013', '2026-06-09 09:45:00'),
(14, 14, 2, 'out_of_pocket',     2800.00, 2800.00,  'card', 2800.00, 'RX20260609014', '2026-06-09 09:00:00'),
(15, 15, 2, 'insurance_balance', 3500.00,  700.00,  'cash', 700.00,  'RX20260609015', '2026-06-09 10:45:00'),
(16, 16, 2, 'out_of_pocket',     2000.00, 2000.00,  'cash', 2000.00, 'RX20260609016', '2026-06-09 11:15:00'),
(17, 17, 2, 'insurance_balance', 2800.00,  560.00,  'cash', 560.00,  'RX20260609017', '2026-06-09 11:50:00'),
(18, 18, 2, 'insurance_balance', 4000.00,  800.00,  'card', 800.00,  'RX20260609018', '2026-06-09 12:15:00'),
(19, 19, 2, 'out_of_pocket',     2500.00, 2500.00,  'cash', 2500.00, 'RX20260609019', '2026-06-09 10:15:00'),
(20, 20, 2, 'full_insurance',    3000.00,    0.00,  'cash',    0.00, 'RX20260609020', '2026-06-09 15:15:00'),
-- Wednesday 10 Jun
(21, 21, 2, 'insurance_balance', 3000.00,  600.00,  'cash', 600.00,  'RX20260610021', '2026-06-10 09:15:00'),
(22, 22, 2, 'out_of_pocket',     1500.00, 1500.00,  'cash', 1500.00, 'RX20260610022', '2026-06-10 09:45:00'),
(23, 23, 2, 'full_insurance',    4500.00,    0.00,  'cash',    0.00, 'RX20260610023', '2026-06-10 10:15:00'),
(24, 24, 2, 'insurance_balance', 3000.00,  600.00,  'card', 600.00,  'RX20260610024', '2026-06-10 08:45:00'),
(25, 25, 2, 'insurance_balance', 2500.00,  500.00,  'cash', 500.00,  'RX20260610025', '2026-06-10 10:45:00'),
(26, 26, 2, 'out_of_pocket',     2000.00, 2000.00,  'cash', 2000.00, 'RX20260610026', '2026-06-10 11:15:00'),
(27, 27, 2, 'insurance_balance', 3500.00,  700.00,  'card', 700.00,  'RX20260610027', '2026-06-10 11:45:00'),
(28, 28, 2, 'full_insurance',    4000.00,    0.00,  'cash',    0.00, 'RX20260610028', '2026-06-10 12:15:00'),
(29, 29, 2, 'out_of_pocket',     1800.00, 1800.00,  'cash', 1800.00, 'RX20260610029', '2026-06-10 09:45:00'),
(30, 30, 2, 'insurance_balance', 2500.00,  500.00,  'cash', 500.00,  'RX20260610030', '2026-06-10 13:45:00'),
-- Thursday 11 Jun
(31, 31, 2, 'full_insurance',    4000.00,    0.00,  'cash',    0.00, 'RX20260611031', '2026-06-11 08:45:00'),
(32, 32, 2, 'out_of_pocket',     2000.00, 2000.00,  'cash', 2000.00, 'RX20260611032', '2026-06-11 09:15:00'),
(33, 33, 2, 'full_insurance',    4500.00,    0.00,  'cash',    0.00, 'RX20260611033', '2026-06-11 09:45:00'),
(34, 34, 2, 'insurance_balance', 3000.00,  600.00,  'card', 600.00,  'RX20260611034', '2026-06-11 09:00:00'),
(35, 35, 2, 'full_insurance',    4000.00,    0.00,  'cash',    0.00, 'RX20260611035', '2026-06-11 10:45:00'),
(36, 36, 2, 'out_of_pocket',     2500.00, 2500.00,  'cash', 2500.00, 'RX20260611036', '2026-06-11 11:15:00'),
(37, 37, 2, 'out_of_pocket',     2000.00, 2000.00,  'cash', 2000.00, 'RX20260611037', '2026-06-11 11:45:00'),
(38, 38, 2, 'insurance_balance', 4000.00,  800.00,  'card', 800.00,  'RX20260611038', '2026-06-11 12:15:00'),
(39, 39, 2, 'out_of_pocket',     1800.00, 1800.00,  'cash', 1800.00, 'RX20260611039', '2026-06-11 10:00:00'),
(40, 40, 2, 'insurance_balance', 3500.00,  700.00,  'card', 700.00,  'RX20260611040', '2026-06-11 14:45:00');

-- Paediatric past checkouts (Mon-Thu last week, visits 48-55)
INSERT INTO checkouts (visit_id, patient_id, processed_by, payment_type, total_fee, patient_balance, patient_payment_method, amount_paid, receipt_reference, checked_out_at) VALUES
(48, 52, 2, 'out_of_pocket',     2000.00, 2000.00, 'cash', 2000.00, 'RX20260608056', '2026-06-08 10:35:00'),
(49, 53, 2, 'insurance_balance', 2500.00,  500.00, 'cash',  500.00, 'RX20260608057', '2026-06-08 10:58:00'),
(50, 54, 2, 'insurance_balance', 2500.00,  500.00, 'card',  500.00, 'RX20260609058', '2026-06-09 10:35:00'),
(51, 55, 2, 'out_of_pocket',     2000.00, 2000.00, 'cash', 2000.00, 'RX20260609059', '2026-06-09 11:00:00'),
(52, 56, 2, 'out_of_pocket',     1800.00, 1800.00, 'cash', 1800.00, 'RX20260610060', '2026-06-10 10:30:00'),
(53, 57, 2, 'insurance_balance', 2500.00,  500.00, 'card',  500.00, 'RX20260610061', '2026-06-10 10:58:00'),
(54, 58, 2, 'out_of_pocket',     1500.00, 1500.00, 'cash', 1500.00, 'RX20260611062', '2026-06-11 10:30:00'),
(55, 59, 2, 'out_of_pocket',     2500.00, 2500.00, 'cash', 2500.00, 'RX20260611063', '2026-06-11 11:00:00');

-- =============================================================
-- SEED NOTIFICATIONS
-- user 2 = receptionist Grace Thompson
-- user 8 = receptionist Nadine Gordon
-- user 9 = nurse Beverley Clarke  (triage — gets patient check-in alerts)
-- user 10 = nurse Rohan Reid      (triage — gets patient check-in alerts)
-- =============================================================
INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, is_read, created_at) VALUES
-- Grace Thompson (receptionist) — check-ins
(2, 'patient_checked_in',   'Patient Checked In',         'Keisha Brown has checked in and is now in triage',                  'appointment', 44, 1, DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
(2, 'patient_checked_in',   'Patient Checked In',         'Devon Clarke has checked in and is now in triage',                  'appointment', 45, 1, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(2, 'patient_checked_in',   'Patient Checked In',         'Nadine Reid has checked in and is now in triage',                   'appointment', 46, 0, DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
(2, 'patient_checked_in',   'Patient Checked In',         'Winston Johnson has checked in and is now in triage',               'appointment', 47, 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
-- Grace Thompson — bookings
(2, 'appointment_booked',   'New Appointment Booked',     'Tamara Lewis with Dr. Campbell — today at 08:00',                   'appointment', 41, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'appointment_booked',   'New Appointment Booked',     'Sandra Morrison with Dr. Grant — today at 08:15',                   'appointment', 42, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'appointment_booked',   'New Appointment Booked',     'Carlton Edwards with Dr. Nair — today at 08:30',                    'appointment', 43, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'appointment_booked',   'New Appointment Booked',     'Leroy Hamilton with Dr. Nair — next week',                          'appointment', NULL, 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 'appointment_booked',   'New Appointment Booked',     'Orville Richards with Dr. Henry — next week',                       'appointment', NULL, 0, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
-- Grace Thompson — registrations
(2, 'self_registration',    'New Self-Registration',      'Marcus Reid submitted a self-registration form',                    'patient',     49, 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 'self_registration',    'New Self-Registration',      'Sherene Campbell submitted a self-registration form',               'patient',     50, 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(2, 'pending_registration', 'Pending Registration',       'Dwayne Gordon registered yesterday — awaiting staff review',        'patient',     51, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Nadine Gordon (receptionist 2) — her own queue
(8, 'patient_checked_in',   'Patient Checked In',         'Keisha Brown has checked in and is now in triage',                  'appointment', 44, 1, DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
(8, 'patient_checked_in',   'Patient Checked In',         'Devon Clarke has checked in and is now in triage',                  'appointment', 45, 1, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(8, 'patient_checked_in',   'Patient Checked In',         'Nadine Reid has checked in and is now in triage',                   'appointment', 46, 0, DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
(8, 'patient_checked_in',   'Patient Checked In',         'Winston Johnson has checked in and is now in triage',               'appointment', 47, 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(8, 'self_registration',    'New Self-Registration',      'Dwayne Gordon submitted a self-registration form',                  'patient',     51, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Beverley Clarke (triage nurse 1) — patient ready alerts
(9, 'patient_checked_in',   'Patient Ready for Triage',   'Keisha Brown — walk-in, fever and chills. Awaiting triage',         'appointment', 44, 1, DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
(9, 'patient_checked_in',   'Patient Ready for Triage',   'Devon Clarke — consultation, lower back pain. Awaiting triage',     'appointment', 45, 1, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(9, 'patient_checked_in',   'Patient Ready for Triage',   'Nadine Reid — walk-in, shortness of breath. Priority triage',       'appointment', 46, 0, DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
(9, 'patient_checked_in',   'Patient Ready for Triage',   'Winston Johnson — follow-up, hypertension review. Routine triage',  'appointment', 47, 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
-- Rohan Reid (triage nurse 2) — same alerts, different read states
(10, 'patient_checked_in',  'Patient Ready for Triage',   'Keisha Brown — walk-in, fever and chills. Awaiting triage',         'appointment', 44, 1, DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
(10, 'patient_checked_in',  'Patient Ready for Triage',   'Devon Clarke — consultation, lower back pain. Awaiting triage',     'appointment', 45, 0, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(10, 'patient_checked_in',  'Patient Ready for Triage',   'Nadine Reid — walk-in, shortness of breath. Priority triage',       'appointment', 46, 0, DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
(10, 'patient_checked_in',  'Patient Ready for Triage',   'Winston Johnson — follow-up, hypertension review. Routine triage',  'appointment', 47, 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE));


