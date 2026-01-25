-- =========================================
-- EDUVATE - Complete Seed Data
-- Run AFTER init.sql
-- Tables are inserted in dependency order
-- =========================================

-- ============================================================
-- 1. SCHOOL_YEARS (no dependencies)
-- ============================================================
INSERT INTO school_years (id, name, start_date, end_date, is_current, is_next) VALUES
  ('c3bee4d7-d02c-4bb5-9c80-2122666e9d11', '2024-2025', '2024-09-01', '2025-06-30', false, false),
  ('3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-2026', '2025-09-01', '2026-06-30', true, false),
  ('9c80376e-9fc0-488a-9de8-08a7f691526a', '2026-2027', '2026-09-01', '2027-06-30', false, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. SCHOOLS (no dependencies)
-- ============================================================
INSERT INTO schools (id, name, identifier, city, country, currency, is_active, academic_year, address, phone, website, logo_url) VALUES
  ('e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Mundiapolis', 'MUNDIA01', 'Casablanca', 'Maroc', 'MAD', true, '2025-2026', 'Bd Roudani', '+212 5424242', 'https://www.mundiapolis.ma', NULL),
  ('42f93ce5-9562-4825-a249-b780018834da', 'ESTEM', 'ESTEM01', 'Casablanca', 'Maroc', 'MAD', true, '2025-2026', '1 Rue ESTEM', '+212 5000000', 'https://www.estem.ma', NULL),
  ('5acf580d-c00c-4d94-9656-8d630046b6a1', 'Rayane School', 'rayane-school', 'Casablanca', 'Maroc', 'MAD', true, '2025-2026', '1 Rue Prosper Mérimée', '+212705143625', '', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. APP_USERS - Admin accounts (depends on schools)
-- Password hash is SHA-256 of 'password123'
-- ============================================================
INSERT INTO app_users (id, email, first_name, last_name, school_id, is_active, email_verified, password_hash, teacher_id, student_id) VALUES
  -- Global Admin (no school)
  ('dd45639d-2749-4d80-97e0-1a28b3da7e50', 'admin@eduvate.io', 'Admin', 'EduVate', NULL, true, true, 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', NULL, NULL),
  -- School Admin Mundiapolis
  ('aa11111a-1111-1111-1111-111111111111', 'admin@mundiapolis.ma', 'Admin', 'Mundiapolis', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true, true, 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', NULL, NULL),
  -- School Admin ESTEM
  ('bb22222b-2222-2222-2222-222222222222', 'admin@estem.ma', 'Admin', 'ESTEM', '42f93ce5-9562-4825-a249-b780018834da', true, true, 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', NULL, NULL),
  -- School Admin Rayane
  ('c14d513b-a0f9-4dd4-a545-1d442f4ab47d', 'admin@rayane.io', 'Admin', 'Rayane School', '5acf580d-c00c-4d94-9656-8d630046b6a1', true, true, 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. APP_USER_ROLES (depends on app_users, schools)
-- ============================================================
INSERT INTO app_user_roles (id, user_id, role, school_id) VALUES
  ('e6eaeb65-cd8c-434e-99c5-88ff7dd4a20d', 'dd45639d-2749-4d80-97e0-1a28b3da7e50', 'global_admin', NULL),
  ('aa111111-1111-1111-1111-111111111111', 'aa11111a-1111-1111-1111-111111111111', 'school_admin', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951'),
  ('bb222222-2222-2222-2222-222222222222', 'bb22222b-2222-2222-2222-222222222222', 'school_admin', '42f93ce5-9562-4825-a249-b780018834da'),
  ('60279b0f-3811-438d-84eb-ac9cb7791b4a', 'c14d513b-a0f9-4dd4-a545-1d442f4ab47d', 'school_admin', '5acf580d-c00c-4d94-9656-8d630046b6a1')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SUBSCRIPTION_PLANS (no dependencies)
-- ============================================================
INSERT INTO subscription_plans (id, name, type, description, features, student_limit, teacher_limit, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Starter', 'starter', 'Plan de démarrage', ARRAY['Gestion basique', '50 étudiants max'], 50, 5, true),
  ('22222222-2222-2222-2222-222222222222', 'Basic', 'basic', 'Plan basique', ARRAY['Gestion étudiants', 'Gestion notes', '200 étudiants max'], 200, 20, true),
  ('33333333-3333-3333-3333-333333333333', 'Standard', 'standard', 'Plan standard', ARRAY['Toutes les fonctionnalités', '500 étudiants max'], 500, 50, true),
  ('44444444-4444-4444-4444-444444444444', 'Premium', 'premium', 'Plan premium', ARRAY['Fonctionnalités avancées', '1000 étudiants max'], 1000, 100, true),
  ('55555555-5555-5555-5555-555555555555', 'Enterprise', 'enterprise', 'Plan entreprise', ARRAY['Illimité', 'Support prioritaire'], NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SUBSCRIPTIONS (depends on schools, subscription_plans)
-- ============================================================
INSERT INTO subscriptions (id, school_id, plan_type, status, duration, start_date, end_date, amount, currency, is_trial, auto_renew) VALUES
  ('sub11111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'premium', 'active', '1_year', '2025-01-01', '2026-01-01', 50000, 'MAD', false, true),
  ('sub22222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'standard', 'active', '1_year', '2025-01-01', '2026-01-01', 30000, 'MAD', false, true),
  ('sub33333-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'basic', 'active', '6_months', '2025-01-01', '2025-07-01', 15000, 'MAD', false, false)
ON CONFLICT (school_id) DO NOTHING;

-- ============================================================
-- 7. CYCLES (depends on schools)
-- ============================================================
INSERT INTO cycles (id, name, school_id, level, duration_years, calculation_system, is_active) VALUES
  -- Mundiapolis cycles
  ('cd64c569-cab8-4584-8d62-16e2295a695e', 'Licence en Informatique', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Licence', 3, 'coefficient', true),
  ('9dbc3e2c-2654-43f2-afdc-3e05e61e8570', 'Master en Informatique', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Master', 2, 'coefficient', true),
  -- ESTEM cycles
  ('5cab911c-8a2f-44c1-93a9-378a980ef30f', 'Licence en Informatique', '42f93ce5-9562-4825-a249-b780018834da', 'Licence', 3, 'credit', true),
  ('b3d242ac-55bf-4e36-871f-2478f5effc0e', 'Master en Finance', '42f93ce5-9562-4825-a249-b780018834da', 'Master', 2, 'coefficient', true),
  -- Rayane cycles
  ('rayc1111-1111-1111-1111-111111111111', 'Primaire', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'Primaire', 6, 'coefficient', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. OPTIONS (depends on cycles, schools)
-- ============================================================
INSERT INTO options (id, name, cycle_id, school_id, is_active) VALUES
  -- Mundiapolis options
  ('7a974879-f68a-42b5-ab6a-f3e2c2312d8d', 'Développement', 'cd64c569-cab8-4584-8d62-16e2295a695e', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('ad3ee7e2-9e21-46fe-9bff-c8b9d57d0a00', 'Réseau', 'cd64c569-cab8-4584-8d62-16e2295a695e', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('83067070-08cb-4590-b218-f7aee1771fe7', 'IA', '9dbc3e2c-2654-43f2-afdc-3e05e61e8570', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('db772dd2-cd8a-4409-a31e-0c8c7033fbe1', 'Data Science', '9dbc3e2c-2654-43f2-afdc-3e05e61e8570', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  -- ESTEM options
  ('daed8db0-fe4b-4b66-9af5-9543a93ab5a7', 'Réseau', '5cab911c-8a2f-44c1-93a9-378a980ef30f', '42f93ce5-9562-4825-a249-b780018834da', true),
  ('f8aaee4b-b4ec-47ae-9b69-6c87e5225bb8', 'DevOps', '5cab911c-8a2f-44c1-93a9-378a980ef30f', '42f93ce5-9562-4825-a249-b780018834da', true),
  ('a982fca9-e52f-45a9-a66e-7df0c6f03333', 'Finance de Marché', 'b3d242ac-55bf-4e36-871f-2478f5effc0e', '42f93ce5-9562-4825-a249-b780018834da', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. SCHOOL_SEMESTER (depends on schools, school_years)
-- ============================================================
INSERT INTO school_semester (id, name, school_id, school_year_id, start_date, end_date, is_actual, archived) VALUES
  -- Mundiapolis semesters
  ('85babf7e-682d-442d-98d2-3b42baa7fdb8', 'Semestre 1', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-09-01', '2026-02-01', true, false),
  ('595ff6b8-dc33-418d-9def-8fcf1448fe26', 'Semestre 2', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2026-02-01', '2026-06-30', false, false),
  -- ESTEM semesters
  ('0db25489-b397-40f1-9f2d-edba3b8111cd', 'Semestre 1', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-09-01', '2026-02-01', true, false),
  ('4df8bed1-7f95-4834-9363-9dcbcc64977d', 'Semestre 2', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2026-02-01', '2026-06-30', false, false),
  -- Rayane semesters
  ('raysem11-1111-1111-1111-111111111111', 'Semestre 1', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-09-01', '2026-02-01', true, false),
  ('raysem22-2222-2222-2222-222222222222', 'Semestre 2', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2026-02-01', '2026-06-30', false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. CLASSES (depends on schools, school_years, cycles, options)
-- ============================================================
INSERT INTO classes (id, name, school_id, school_year_id, cycle_id, option_id, year_level, is_specialization, archived) VALUES
  -- Mundiapolis classes
  ('283e35f3-ff6e-497b-aa54-f4febdd64368', '1ère Année Licence Info', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'cd64c569-cab8-4584-8d62-16e2295a695e', NULL, 1, false, false),
  ('476083d7-4678-42fe-9d8c-fea68b1df172', '2ème Année Licence Info', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'cd64c569-cab8-4584-8d62-16e2295a695e', NULL, 2, false, false),
  ('9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '3ème Année Licence Dev', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'cd64c569-cab8-4584-8d62-16e2295a695e', '7a974879-f68a-42b5-ab6a-f3e2c2312d8d', 3, true, false),
  ('883b1315-f6ba-44e3-ba73-d493728c3608', '1ère Année Master IA', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '9dbc3e2c-2654-43f2-afdc-3e05e61e8570', '83067070-08cb-4590-b218-f7aee1771fe7', 1, true, false),
  -- ESTEM classes
  ('5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '1ère Année Licence Info', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '5cab911c-8a2f-44c1-93a9-378a980ef30f', NULL, 1, false, false),
  ('b221b389-a53f-4c2d-92e9-109668fe34c1', '2ème Année Licence Info', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '5cab911c-8a2f-44c1-93a9-378a980ef30f', NULL, 2, false, false),
  ('869d92df-5a54-4bc3-9791-340a86f3009e', '3ème Année Licence Info', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '5cab911c-8a2f-44c1-93a9-378a980ef30f', 'daed8db0-fe4b-4b66-9af5-9543a93ab5a7', 3, true, false),
  ('82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '1ère Année Master Finance', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'b3d242ac-55bf-4e36-871f-2478f5effc0e', 'a982fca9-e52f-45a9-a66e-7df0c6f03333', 1, true, false),
  -- Rayane classes
  ('d884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'CI (Classe Initiation)', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'rayc1111-1111-1111-1111-111111111111', NULL, 1, false, false),
  ('ad225a2e-fc92-4ee5-b191-8d2d4d352681', 'CP', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'rayc1111-1111-1111-1111-111111111111', NULL, 2, false, false),
  ('21c6e05a-9bac-4756-901b-c7b21a13b522', 'CE1', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'rayc1111-1111-1111-1111-111111111111', NULL, 3, false, false),
  ('11d34e58-f7be-441a-863e-a75190f636a1', 'CE2', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'rayc1111-1111-1111-1111-111111111111', NULL, 4, false, false),
  ('6831e75f-a3d4-4ca9-bb1a-2d7f5abafe76', 'CM1', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'rayc1111-1111-1111-1111-111111111111', NULL, 5, false, false),
  ('72156db5-7286-4fa5-acb3-6e24867ca9a2', 'CM2', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'rayc1111-1111-1111-1111-111111111111', NULL, 6, false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. TEACHERS (depends on schools)
-- ============================================================
INSERT INTO teachers (id, firstname, lastname, email, mobile, school_id, status, qualification, salary, birth_date, join_date, address) VALUES
  -- Mundiapolis teachers
  ('849aa9c2-824f-485e-88a5-86f56c3ec7e5', 'Saad', 'Khoudali', 's.khoudali@mundiapolis.ma', '+212612345678', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'active', 'Docteur en Informatique', 15000, '1985-06-13', '2020-09-01', 'Casablanca'),
  ('teach1111-1111-1111-1111-111111111111', 'Fatima', 'Bennani', 'f.bennani@mundiapolis.ma', '+212612345679', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'active', 'Master en Mathématiques', 12000, '1988-03-22', '2021-09-01', 'Casablanca'),
  -- ESTEM teachers
  ('e2e1880e-883f-4c63-bb41-27e13fbcce38', 'Khalid', 'Fahsi', 'k.fahsi@estem.ma', '+212612345680', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Docteur en SI', 16000, '1982-09-12', '2019-09-01', 'Casablanca'),
  ('cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 'Ahmed', 'Benali', 'a.benali@estem.ma', '+212612345681', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Doctorat en Mathématiques', 14000, '1980-01-15', '2018-09-01', 'Casablanca'),
  ('3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 'Fatima', 'El Idrissi', 'f.elidrissi@estem.ma', '+212612345682', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Master en Informatique', 13000, '1990-05-20', '2022-09-01', 'Rabat'),
  ('4b2c36ce-e44f-4f6c-bac7-23813934964d', 'Mohamed', 'Tazi', 'm.tazi@estem.ma', '+212612345683', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Master en Physique', 12000, '1987-11-08', '2021-09-01', 'Casablanca'),
  ('fc74d9e5-016a-4a06-9847-852c8ca69d37', 'Youssef', 'Bennani', 'y.bennani@estem.ma', '+212612345684', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Master en Économie', 11000, '1991-07-30', '2023-09-01', 'Casablanca'),
  ('af408790-32f5-47b5-97a9-564ef5958315', 'Khadija', 'Alami', 'k.alami@estem.ma', '+212612345685', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Licence en Français', 10000, '1993-02-14', '2023-09-01', 'Casablanca'),
  -- Rayane teachers
  ('rayteach-1111-1111-1111-111111111111', 'Amina', 'Chaoui', 'a.chaoui@rayane.ma', '+212612345686', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'active', 'Licence en Éducation', 8000, '1995-04-10', '2024-09-01', 'Casablanca'),
  ('rayteach-2222-2222-2222-222222222222', 'Omar', 'Lahlou', 'o.lahlou@rayane.ma', '+212612345687', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'active', 'Licence en Sciences', 8500, '1992-08-25', '2023-09-01', 'Casablanca')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. STUDENTS (no school dependency - school link is via student_school)
-- ============================================================
INSERT INTO students (id, firstname, lastname, email, cin_number, birth_date, student_phone, parent_phone, tutor_name, tutor_email, archived) VALUES
  -- Mundiapolis students
  ('3b182537-3cf6-42c3-859a-7349b7feaa26', 'Chaimaa', 'Bahi', 'c.bahi@mundiapolis.ma', 'AB123456', '2002-10-17', '+212612345700', '+212612345701', 'Chakib Bahi', 'chakib.bahi@gmail.com', false),
  ('f70de8fa-a35d-43ff-9b2f-2305b672672c', 'Mohamed', 'Khouli', 'm.khouli@mundiapolis.ma', 'AB123457', '2003-04-08', '+212612345702', '+212612345703', 'Ahmed Khouli', 'ahmed.khouli@gmail.com', false),
  ('stud1111-1111-1111-1111-111111111111', 'Yasmine', 'Alaoui', 'y.alaoui@mundiapolis.ma', 'AB123458', '2002-07-15', '+212612345704', '+212612345705', 'Hassan Alaoui', 'hassan.alaoui@gmail.com', false),
  ('stud2222-2222-2222-2222-222222222222', 'Karim', 'Berrada', 'k.berrada@mundiapolis.ma', 'AB123459', '2003-01-20', '+212612345706', '+212612345707', 'Ali Berrada', 'ali.berrada@gmail.com', false),
  -- ESTEM students
  ('dd15c0fd-9d00-40da-bca7-96ff5293b183', 'Ahmadou', 'Lo', 'a.lo@estem.ma', 'CD123460', '2001-09-10', '+212612345708', '+212612345709', 'Mohamed Diallo', 'm.diallo@gmail.com', false),
  ('7a15a49b-fc7e-4bea-b078-1a180eb9b405', 'Adil', 'Abou', 'a.abou@estem.ma', 'CD123461', '2002-03-15', '+212612345710', '+212612345711', 'Said Abou', 's.abou@gmail.com', false),
  ('ac8e9017-2e5a-452b-b46e-b777c7177179', 'Sara', 'Mansouri', 's.mansouri@estem.ma', 'CD123462', '2002-06-20', '+212612345712', '+212612345713', 'Omar Mansouri', 'o.mansouri@gmail.com', false),
  ('de936c07-e45a-43db-8243-d8f58744cb6a', 'Nadia', 'Driss', 'n.driss@estem.ma', 'CD123463', '2003-02-25', '+212612345714', '+212612345715', 'Mehdi Driss', 'm.driss@gmail.com', false),
  ('833a4a27-bdb2-4815-95bb-5faa6ce83a13', 'Karim', 'El Amrani', 'k.elamrani@estem.ma', 'CD123464', '2002-09-12', '+212612345716', '+212612345717', 'Rachid El Amrani', 'r.elamrani@gmail.com', false),
  ('e63f82eb-8a88-4820-a50b-8b57bf6bd8b2', 'Laila', 'Fassi', 'l.fassi@estem.ma', 'CD123465', '2003-11-08', '+212612345718', '+212612345719', 'Nabil Fassi', 'n.fassi@gmail.com', false),
  ('55868d8b-c9f6-4f33-b988-4485fbabdb6d', 'Mehdi', 'Ghali', 'm.ghali@estem.ma', 'CD123466', '2001-01-30', '+212612345720', '+212612345721', 'Youssef Ghali', 'y.ghali@gmail.com', false),
  ('3df1b674-72b7-4048-b624-ce401a7c4ee5', 'Imane', 'Hamza', 'i.hamza@estem.ma', 'CD123467', '2002-04-18', '+212612345722', '+212612345723', 'Khalid Hamza', 'k.hamza@gmail.com', false),
  ('6bd82460-62a3-4c20-97db-a525d2470d55', 'Rachid', 'Idrissi', 'r.idrissi@estem.ma', 'CD123468', '2002-06-22', '+212612345724', '+212612345725', 'Samir Idrissi', 's.idrissi@gmail.com', false),
  ('b422a288-fc27-40a1-bc25-87bfa602b888', 'Zineb', 'Jamal', 'z.jamal@estem.ma', 'CD123469', '2003-08-14', '+212612345726', '+212612345727', 'Hassan Jamal', 'h.jamal@gmail.com', false),
  ('8174f3af-e2a5-4bb3-a71f-23d79fc9fe17', 'Hassan', 'Kadiri', 'h.kadiri@estem.ma', 'CD123470', '2000-03-10', '+212612345728', '+212612345729', 'Mustapha Kadiri', 'mu.kadiri@gmail.com', false),
  ('0a9c804c-c27a-43f6-9bc9-8fbcfe2f566b', 'Samira', 'Lamrani', 's.lamrani@estem.ma', 'CD123471', '2001-05-15', '+212612345730', '+212612345731', 'Taoufik Lamrani', 't.lamrani@gmail.com', false),
  -- Rayane students (primary school)
  ('raystud1-1111-1111-1111-111111111111', 'Yassine', 'Zaki', NULL, '', '2018-09-05', NULL, '+212612345732', 'Fouad Zaki', 'f.zaki@gmail.com', false),
  ('raystud2-2222-2222-2222-222222222222', 'Salma', 'Rifai', NULL, '', '2017-03-12', NULL, '+212612345733', 'Aziz Rifai', 'a.rifai@gmail.com', false),
  ('raystud3-3333-3333-3333-333333333333', 'Adam', 'Senhaji', NULL, '', '2016-07-20', NULL, '+212612345734', 'Hamid Senhaji', 'h.senhaji@gmail.com', false),
  ('raystud4-4444-4444-4444-444444444444', 'Lina', 'Bennis', NULL, '', '2015-12-01', NULL, '+212612345735', 'Brahim Bennis', 'b.bennis@gmail.com', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. STUDENT_SCHOOL (depends on students, schools, classes, school_years)
-- ============================================================
INSERT INTO student_school (id, student_id, school_id, class_id, school_year_id, is_active) VALUES
  -- Mundiapolis enrollments
  (gen_random_uuid(), '3b182537-3cf6-42c3-859a-7349b7feaa26', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'f70de8fa-a35d-43ff-9b2f-2305b672672c', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'stud1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '476083d7-4678-42fe-9d8c-fea68b1df172', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'stud2222-2222-2222-2222-222222222222', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  -- ESTEM enrollments
  (gen_random_uuid(), 'dd15c0fd-9d00-40da-bca7-96ff5293b183', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '7a15a49b-fc7e-4bea-b078-1a180eb9b405', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'ac8e9017-2e5a-452b-b46e-b777c7177179', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'de936c07-e45a-43db-8243-d8f58744cb6a', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '833a4a27-bdb2-4815-95bb-5faa6ce83a13', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'e63f82eb-8a88-4820-a50b-8b57bf6bd8b2', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '55868d8b-c9f6-4f33-b988-4485fbabdb6d', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '3df1b674-72b7-4048-b624-ce401a7c4ee5', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '6bd82460-62a3-4c20-97db-a525d2470d55', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'b422a288-fc27-40a1-bc25-87bfa602b888', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '8174f3af-e2a5-4bb3-a71f-23d79fc9fe17', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), '0a9c804c-c27a-43f6-9bc9-8fbcfe2f566b', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  -- Rayane enrollments
  (gen_random_uuid(), 'raystud1-1111-1111-1111-111111111111', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'raystud2-2222-2222-2222-222222222222', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'ad225a2e-fc92-4ee5-b191-8d2d4d352681', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'raystud3-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', '21c6e05a-9bac-4756-901b-c7b21a13b522', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true),
  (gen_random_uuid(), 'raystud4-4444-4444-4444-444444444444', '5acf580d-c00c-4d94-9656-8d630046b6a1', '11d34e58-f7be-441a-863e-a75190f636a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. SUBJECTS (depends on classes, teachers, schools)
-- ============================================================
INSERT INTO subjects (id, name, school_id, class_id, teacher_id, coefficient, coefficient_type, archived) VALUES
  -- Mundiapolis 1ère Année Licence
  ('subj1111-1111-1111-1111-111111111111', 'Algorithmique', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 4, 'coefficient', false),
  ('subj1112-1111-1111-1111-111111111111', 'Mathématiques', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', 'teach1111-1111-1111-1111-111111111111', 3, 'coefficient', false),
  -- Mundiapolis 2ème Année Licence
  ('subj2221-2222-2222-2222-222222222222', 'Programmation OOP', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '476083d7-4678-42fe-9d8c-fea68b1df172', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 4, 'coefficient', false),
  ('subj2222-2222-2222-2222-222222222222', 'Base de Données', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '476083d7-4678-42fe-9d8c-fea68b1df172', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 3, 'coefficient', false),
  -- Mundiapolis 3ème Année Licence Dev
  ('8041d1a1-8e38-4090-b216-e3283d19dfbb', 'Développement Web', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 4, 'coefficient', false),
  ('subj3332-3333-3333-3333-333333333333', 'Framework JS', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 3, 'coefficient', false),
  -- Mundiapolis Master IA
  ('subj4441-4444-4444-4444-444444444444', 'Machine Learning', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '883b1315-f6ba-44e3-ba73-d493728c3608', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 5, 'coefficient', false),
  ('subj4442-4444-4444-4444-444444444444', 'Deep Learning', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '883b1315-f6ba-44e3-ba73-d493728c3608', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 5, 'coefficient', false),
  -- ESTEM 1ère Année Licence
  ('41099692-cd4a-4f25-b1c4-cec8b40623d9', 'Algorithmique', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 4, 'credit', false),
  ('9da1e75e-0037-4eb9-9b65-f3750a096782', 'Communication', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'af408790-32f5-47b5-97a9-564ef5958315', 2, 'credit', false),
  ('f323ccd5-b7df-464e-97cd-d1f4650fc93d', 'Mathématiques 1', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 3, 'credit', false),
  -- ESTEM 2ème Année Licence
  ('06d1b82f-51e0-4cee-91c0-29e804f3daf8', 'Mathématiques 2', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 3, 'credit', false),
  ('c476e8ce-a672-429d-9bae-6ad0737b036f', 'Bases de Données', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 3, 'credit', false),
  ('c30d9839-a0b6-41d4-8991-e5abd0d6a429', 'Réseaux Informatiques', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '4b2c36ce-e44f-4f6c-bac7-23813934964d', 3, 'credit', false),
  -- ESTEM 3ème Année Licence
  ('da1b82f5-51e0-4cee-91c0-29e804f3d1f0', 'Développement Web', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 4, 'credit', false),
  ('eb1b82f5-51e0-4cee-91c0-29e804f3d2e1', 'Sécurité Informatique', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '4b2c36ce-e44f-4f6c-bac7-23813934964d', 3, 'credit', false),
  -- ESTEM Master Finance
  ('bacef16b-534f-497b-a506-40788cec0220', 'Finance d''Entreprise', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', 'fc74d9e5-016a-4a06-9847-852c8ca69d37', 5, 'credit', false),
  ('811e6356-a40f-4336-81f2-4c4aa48a674a', 'Mathématiques Financières', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 4, 'credit', false),
  -- Rayane primary subjects
  ('raysubj1-1111-1111-1111-111111111111', 'Français', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'rayteach-1111-1111-1111-111111111111', 3, 'coefficient', false),
  ('raysubj2-2222-2222-2222-222222222222', 'Mathématiques', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'rayteach-2222-2222-2222-222222222222', 3, 'coefficient', false),
  ('raysubj3-3333-3333-3333-333333333333', 'Arabe', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'rayteach-1111-1111-1111-111111111111', 2, 'coefficient', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. TEACHER_CLASSES (depends on teachers, classes)
-- ============================================================
INSERT INTO teacher_classes (id, teacher_id, class_id) VALUES
  -- Mundiapolis
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '283e35f3-ff6e-497b-aa54-f4febdd64368'),
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '476083d7-4678-42fe-9d8c-fea68b1df172'),
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780'),
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '883b1315-f6ba-44e3-ba73-d493728c3608'),
  (gen_random_uuid(), 'teach1111-1111-1111-1111-111111111111', '283e35f3-ff6e-497b-aa54-f4febdd64368'),
  -- ESTEM
  (gen_random_uuid(), 'e2e1880e-883f-4c63-bb41-27e13fbcce38', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c'),
  (gen_random_uuid(), 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c'),
  (gen_random_uuid(), 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 'b221b389-a53f-4c2d-92e9-109668fe34c1'),
  (gen_random_uuid(), 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2'),
  (gen_random_uuid(), '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c'),
  (gen_random_uuid(), '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 'b221b389-a53f-4c2d-92e9-109668fe34c1'),
  (gen_random_uuid(), '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '869d92df-5a54-4bc3-9791-340a86f3009e'),
  (gen_random_uuid(), '4b2c36ce-e44f-4f6c-bac7-23813934964d', 'b221b389-a53f-4c2d-92e9-109668fe34c1'),
  (gen_random_uuid(), '4b2c36ce-e44f-4f6c-bac7-23813934964d', '869d92df-5a54-4bc3-9791-340a86f3009e'),
  (gen_random_uuid(), 'fc74d9e5-016a-4a06-9847-852c8ca69d37', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2'),
  (gen_random_uuid(), 'af408790-32f5-47b5-97a9-564ef5958315', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c'),
  -- Rayane
  (gen_random_uuid(), 'rayteach-1111-1111-1111-111111111111', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2'),
  (gen_random_uuid(), 'rayteach-1111-1111-1111-111111111111', 'ad225a2e-fc92-4ee5-b191-8d2d4d352681'),
  (gen_random_uuid(), 'rayteach-2222-2222-2222-222222222222', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2'),
  (gen_random_uuid(), 'rayteach-2222-2222-2222-222222222222', '21c6e05a-9bac-4756-901b-c7b21a13b522')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. CLASS_SUBJECTS (depends on classes, subjects)
-- ============================================================
INSERT INTO class_subjects (id, class_id, subject_id) VALUES
  -- Mundiapolis
  (gen_random_uuid(), '283e35f3-ff6e-497b-aa54-f4febdd64368', 'subj1111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), '283e35f3-ff6e-497b-aa54-f4febdd64368', 'subj1112-1111-1111-1111-111111111111'),
  (gen_random_uuid(), '476083d7-4678-42fe-9d8c-fea68b1df172', 'subj2221-2222-2222-2222-222222222222'),
  (gen_random_uuid(), '476083d7-4678-42fe-9d8c-fea68b1df172', 'subj2222-2222-2222-2222-222222222222'),
  (gen_random_uuid(), '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '8041d1a1-8e38-4090-b216-e3283d19dfbb'),
  (gen_random_uuid(), '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', 'subj3332-3333-3333-3333-333333333333'),
  (gen_random_uuid(), '883b1315-f6ba-44e3-ba73-d493728c3608', 'subj4441-4444-4444-4444-444444444444'),
  (gen_random_uuid(), '883b1315-f6ba-44e3-ba73-d493728c3608', 'subj4442-4444-4444-4444-444444444444'),
  -- ESTEM
  (gen_random_uuid(), '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '41099692-cd4a-4f25-b1c4-cec8b40623d9'),
  (gen_random_uuid(), '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '9da1e75e-0037-4eb9-9b65-f3750a096782'),
  (gen_random_uuid(), '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'f323ccd5-b7df-464e-97cd-d1f4650fc93d'),
  (gen_random_uuid(), 'b221b389-a53f-4c2d-92e9-109668fe34c1', '06d1b82f-51e0-4cee-91c0-29e804f3daf8'),
  (gen_random_uuid(), 'b221b389-a53f-4c2d-92e9-109668fe34c1', 'c476e8ce-a672-429d-9bae-6ad0737b036f'),
  (gen_random_uuid(), 'b221b389-a53f-4c2d-92e9-109668fe34c1', 'c30d9839-a0b6-41d4-8991-e5abd0d6a429'),
  (gen_random_uuid(), '869d92df-5a54-4bc3-9791-340a86f3009e', 'da1b82f5-51e0-4cee-91c0-29e804f3d1f0'),
  (gen_random_uuid(), '869d92df-5a54-4bc3-9791-340a86f3009e', 'eb1b82f5-51e0-4cee-91c0-29e804f3d2e1'),
  (gen_random_uuid(), '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', 'bacef16b-534f-497b-a506-40788cec0220'),
  (gen_random_uuid(), '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '811e6356-a40f-4336-81f2-4c4aa48a674a'),
  -- Rayane
  (gen_random_uuid(), 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'raysubj1-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'raysubj2-2222-2222-2222-222222222222'),
  (gen_random_uuid(), 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'raysubj3-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 17. SCHOOL_ROLES (depends on schools)
-- ============================================================
INSERT INTO school_roles (id, name, school_id, color, is_system) VALUES
  ('srole111-1111-1111-1111-111111111111', 'Responsable Pédagogique', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'blue', false),
  ('srole222-2222-2222-2222-222222222222', 'Responsable Scolarité', '42f93ce5-9562-4825-a249-b780018834da', 'green', false),
  ('srole333-3333-3333-3333-333333333333', 'Coordinateur', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'purple', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. CLASSROOMS (depends on schools)
-- ============================================================
INSERT INTO classrooms (id, school_id, name, building, floor, capacity, equipment, is_active, archived) VALUES
  -- Mundiapolis
  ('room1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Salle A101', 'Bâtiment A', '1er étage', 40, ARRAY['Projecteur', 'Tableau blanc'], true, false),
  ('room1112-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Labo Info 1', 'Bâtiment B', 'RDC', 30, ARRAY['Ordinateurs', 'Projecteur'], true, false),
  -- ESTEM
  ('room2221-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'Amphi 1', 'Bâtiment Principal', 'RDC', 100, ARRAY['Micro', 'Projecteur', 'Sonorisation'], true, false),
  ('room2222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'Salle TD1', 'Bâtiment Principal', '1er étage', 35, ARRAY['Tableau interactif'], true, false),
  -- Rayane
  ('room3331-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'Salle CI', 'Bâtiment Primaire', 'RDC', 25, ARRAY['Tableau', 'TV'], true, false),
  ('room3332-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'Salle CP', 'Bâtiment Primaire', 'RDC', 25, ARRAY['Tableau', 'TV'], true, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 19. BULLETIN_SETTINGS (depends on schools)
-- ============================================================
INSERT INTO bulletin_settings (id, school_id, template_style, primary_color, secondary_color, accent_color, show_weighted_average, show_ranking, show_mention, show_decision, show_observations) VALUES
  ('bset1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'modern', '#1e3a8a', '#3b82f6', '#60a5fa', true, true, true, true, false),
  ('bset2222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'classic', '#166534', '#22c55e', '#4ade80', true, true, true, true, true),
  ('bset3333-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'elegant', '#7c2d12', '#ea580c', '#fb923c', true, false, true, true, true)
ON CONFLICT (school_id) DO NOTHING;

-- ============================================================
-- 20. ASSIGNMENTS (depends on schools, teachers, classes, subjects, school_years)
-- ============================================================
INSERT INTO assignments (id, school_id, teacher_id, class_id, subject_id, school_year_id, title, description, type, session_date, start_time, end_time, is_recurring, recurrence_pattern, recurrence_day) VALUES
  -- Mundiapolis
  ('asgn1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '283e35f3-ff6e-497b-aa54-f4febdd64368', 'subj1111-1111-1111-1111-111111111111', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'Cours Algorithmique', 'Introduction aux algorithmes', 'course', '2025-01-27', '08:30', '10:30', true, 'weekly', 1),
  ('asgn1112-1111-1111-1111-111111111112', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'teach1111-1111-1111-1111-111111111111', '283e35f3-ff6e-497b-aa54-f4febdd64368', 'subj1112-1111-1111-1111-111111111111', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'TD Mathématiques', 'Exercices pratiques', 'course', '2025-01-28', '10:30', '12:30', true, 'weekly', 2),
  -- ESTEM
  ('asgn2221-2222-2222-2222-222222222221', '42f93ce5-9562-4825-a249-b780018834da', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '41099692-cd4a-4f25-b1c4-cec8b40623d9', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'Cours Algorithmique', 'Les bases de la programmation', 'course', '2025-01-27', '09:00', '11:00', true, 'weekly', 1),
  ('asgn2222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'f323ccd5-b7df-464e-97cd-d1f4650fc93d', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'Cours Mathématiques', 'Analyse et algèbre', 'course', '2025-01-29', '14:00', '16:00', true, 'weekly', 3),
  -- Rayane
  ('asgn3331-3333-3333-3333-333333333331', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'rayteach-1111-1111-1111-111111111111', 'd884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'raysubj1-1111-1111-1111-111111111111', '3814d3a0-3546-4fce-92cb-3547d3dcee79', 'Cours Français', 'Lecture et écriture', 'course', '2025-01-27', '08:00', '09:30', true, 'weekly', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 21. GRADES (depends on students, subjects, teachers, school_years, school_semester)
-- ============================================================
INSERT INTO grades (id, student_id, subject_id, teacher_id, school_year_id, school_semester_id, grade, grade_type, exam_date, comment) VALUES
  -- Mundiapolis grades
  (gen_random_uuid(), '3b182537-3cf6-42c3-859a-7349b7feaa26', 'subj1111-1111-1111-1111-111111111111', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '85babf7e-682d-442d-98d2-3b42baa7fdb8', 15.5, 'controle', '2025-01-15', 'Bon travail'),
  (gen_random_uuid(), '3b182537-3cf6-42c3-859a-7349b7feaa26', 'subj1112-1111-1111-1111-111111111111', 'teach1111-1111-1111-1111-111111111111', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '85babf7e-682d-442d-98d2-3b42baa7fdb8', 14.0, 'controle', '2025-01-16', 'À améliorer'),
  (gen_random_uuid(), 'f70de8fa-a35d-43ff-9b2f-2305b672672c', 'subj1111-1111-1111-1111-111111111111', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '85babf7e-682d-442d-98d2-3b42baa7fdb8', 17.0, 'controle', '2025-01-15', 'Excellent'),
  -- ESTEM grades
  (gen_random_uuid(), 'dd15c0fd-9d00-40da-bca7-96ff5293b183', '41099692-cd4a-4f25-b1c4-cec8b40623d9', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '0db25489-b397-40f1-9f2d-edba3b8111cd', 16.0, 'examen', '2025-01-20', 'Très bien'),
  (gen_random_uuid(), '7a15a49b-fc7e-4bea-b078-1a180eb9b405', '41099692-cd4a-4f25-b1c4-cec8b40623d9', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '0db25489-b397-40f1-9f2d-edba3b8111cd', 13.5, 'examen', '2025-01-20', 'Passable')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 22. ATTENDANCE (depends on students, classes, teachers, subjects, schools, school_years)
-- ============================================================
INSERT INTO attendance (id, student_id, class_id, teacher_id, subject_id, school_id, school_year_id, date, status, method, is_justified, justification_status) VALUES
  -- Mundiapolis attendance
  (gen_random_uuid(), '3b182537-3cf6-42c3-859a-7349b7feaa26', '283e35f3-ff6e-497b-aa54-f4febdd64368', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 'subj1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-01-20', 'present', 'manual', false, NULL),
  (gen_random_uuid(), 'f70de8fa-a35d-43ff-9b2f-2305b672672c', '283e35f3-ff6e-497b-aa54-f4febdd64368', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 'subj1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-01-20', 'absent', 'manual', false, 'pending'),
  -- ESTEM attendance
  (gen_random_uuid(), 'dd15c0fd-9d00-40da-bca7-96ff5293b183', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '41099692-cd4a-4f25-b1c4-cec8b40623d9', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-01-21', 'present', 'qr_scan', false, NULL),
  (gen_random_uuid(), '7a15a49b-fc7e-4bea-b078-1a180eb9b405', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '41099692-cd4a-4f25-b1c4-cec8b40623d9', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-01-21', 'late', 'manual', false, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 23. EVENTS (depends on schools, classes)
-- ============================================================
INSERT INTO events (id, school_id, title, description, location, scope, class_id, start_at, end_at, published, attendance_enabled) VALUES
  ('event111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Rentrée Académique 2025-2026', 'Cérémonie d''ouverture de l''année', 'Amphithéâtre Principal', 'school', NULL, '2025-09-01 09:00:00+00', '2025-09-01 12:00:00+00', true, true),
  ('event222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'Journée Portes Ouvertes', 'Présentation des formations', 'Campus ESTEM', 'school', NULL, '2025-03-15 10:00:00+00', '2025-03-15 17:00:00+00', true, false),
  ('event333-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'Fête de fin d''année', 'Spectacle des élèves', 'Cour de l''école', 'school', NULL, '2025-06-28 14:00:00+00', '2025-06-28 18:00:00+00', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 24. ANNOUNCEMENTS (depends on schools)
-- ============================================================
INSERT INTO announcements (id, school_id, title, body, visibility, pinned, starts_at, ends_at) VALUES
  ('ann11111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Bienvenue à Mundiapolis', 'Nous vous souhaitons une excellente année académique 2025-2026.', 'all', true, '2025-09-01 00:00:00+00', '2025-09-30 23:59:59+00'),
  ('ann22222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'Inscriptions ouvertes', 'Les inscriptions pour le semestre 2 sont maintenant ouvertes.', 'all', false, '2025-01-15 00:00:00+00', '2025-02-15 23:59:59+00'),
  ('ann33333-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'Réunion Parents-Enseignants', 'La réunion aura lieu le 15 février à 17h.', 'all', true, '2025-02-01 00:00:00+00', '2025-02-15 23:59:59+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 25. DOCUMENT_TEMPLATES (depends on schools)
-- ============================================================
INSERT INTO document_templates (id, school_id, name, type, content, header_style, footer_color, is_active) VALUES
  ('dtpl1111-1111-1111-1111-111111111111', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Attestation de Scolarité', 'attestation', 'Nous attestons que {student_name} est régulièrement inscrit(e) dans notre établissement pour l''année académique {academic_year}.', 'modern', '#1e3a8a', true),
  ('dtpl2222-2222-2222-2222-222222222222', '42f93ce5-9562-4825-a249-b780018834da', 'Certificat de Scolarité', 'certificate', 'Le présent certificat atteste que {student_name} est inscrit(e) en {class_name} pour l''année {academic_year}.', 'classic', '#166534', true),
  ('dtpl3333-3333-3333-3333-333333333333', '5acf580d-c00c-4d94-9656-8d630046b6a1', 'Attestation d''Inscription', 'attestation', 'Nous confirmons l''inscription de l''élève {student_name} en classe de {class_name}.', 'elegant', '#7c2d12', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- END OF SEED DATA
-- ============================================================
