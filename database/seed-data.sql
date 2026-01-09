-- =========================================
-- Données d'insertion pour Supabase
-- Exécuter ce fichier APRÈS init.sql
-- Les données sont insérées en respectant les FK
-- =========================================

-- 1. Années scolaires (aucune dépendance)
INSERT INTO school_years (id, name, start_date, end_date, is_current, is_next) VALUES
  ('c3bee4d7-d02c-4bb5-9c80-2122666e9d11', '2024-2025', '2024-09-01', '2025-06-30', false, false),
  ('3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-2026', '2025-11-04', '2026-06-30', true, false),
  ('9c80376e-9fc0-488a-9de8-08a7f691526a', '2026-2027', '2026-09-01', '2027-06-30', false, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Écoles (aucune dépendance)
INSERT INTO schools (id, name, identifier, city, country, currency, is_active, academic_year, address, phone, website, logo_url) VALUES
  ('e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Mundiapolis', 'MUNDIA01', 'Casablanca', 'Maroc', 'MAD', true, '2024-2025', 'Bd Roudani', '+212 5424242', 'https://www.mundiapolis.ma', NULL),
  ('42f93ce5-9562-4825-a249-b780018834da', 'ESTEM', 'ESTEM01', '', 'Maroc', 'MAD', true, '', '', '', '', NULL),
  ('5acf580d-c00c-4d94-9656-8d630046b6a1', 'Rayane School', 'rayane-school', 'Casablanca', 'Maroc', 'MAD', true, '2024-2025', '1 Rue Prosper Mérimée', '+212705143625', '', NULL)
ON CONFLICT (id) DO NOTHING;

-- 3. Cycles (dépend de schools)
INSERT INTO cycles (id, name, school_id, level, duration_years, calculation_system, is_active) VALUES
  ('cd64c569-cab8-4584-8d62-16e2295a695e', 'Licence en Informatique Appliqué', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Licence', 3, 'coefficient', true),
  ('9dbc3e2c-2654-43f2-afdc-3e05e61e8570', 'Master', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'Master', 2, 'coefficient', true),
  ('5cab911c-8a2f-44c1-93a9-378a980ef30f', 'Licence en Informatique Appliqué', '42f93ce5-9562-4825-a249-b780018834da', 'Licence', 3, 'credit', true),
  ('b3d242ac-55bf-4e36-871f-2478f5effc0e', 'test cycle', '42f93ce5-9562-4825-a249-b780018834da', 'Master', 3, 'coefficient', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Options (dépend de cycles et schools)
INSERT INTO options (id, name, cycle_id, school_id, is_active) VALUES
  ('7a974879-f68a-42b5-ab6a-f3e2c2312d8d', 'Développement', 'cd64c569-cab8-4584-8d62-16e2295a695e', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('ad3ee7e2-9e21-46fe-9bff-c8b9d57d0a00', 'Réseau', 'cd64c569-cab8-4584-8d62-16e2295a695e', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('83067070-08cb-4590-b218-f7aee1771fe7', 'IA', '9dbc3e2c-2654-43f2-afdc-3e05e61e8570', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('db772dd2-cd8a-4409-a31e-0c8c7033fbe1', 'Data', '9dbc3e2c-2654-43f2-afdc-3e05e61e8570', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', true),
  ('daed8db0-fe4b-4b66-9af5-9543a93ab5a7', 'Réseau', '5cab911c-8a2f-44c1-93a9-378a980ef30f', '42f93ce5-9562-4825-a249-b780018834da', true),
  ('f8aaee4b-b4ec-47ae-9b69-6c87e5225bb8', 'DevOps', '5cab911c-8a2f-44c1-93a9-378a980ef30f', '42f93ce5-9562-4825-a249-b780018834da', true),
  ('a982fca9-e52f-45a9-a66e-7df0c6f03333', 'test option', 'b3d242ac-55bf-4e36-871f-2478f5effc0e', '42f93ce5-9562-4825-a249-b780018834da', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Semestres (dépend de schools et school_years)
INSERT INTO school_semester (id, name, school_id, school_year_id, start_date, end_date, is_actual, archived) VALUES
  ('85babf7e-682d-442d-98d2-3b42baa7fdb8', 'Semestre 1', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-10-30', '2026-02-02', false, false),
  ('595ff6b8-dc33-418d-9def-8fcf1448fe26', 'Semestre 2', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2026-02-02', '2026-07-15', true, false),
  ('cda722f2-2d1c-4bc3-afb6-f3ae548eda79', 'SEM 3', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11', '2025-10-30', '2026-01-28', false, true),
  ('0db25489-b397-40f1-9f2d-edba3b8111cd', 'Semestre 1', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2025-09-01', '2026-02-02', true, false),
  ('4df8bed1-7f95-4834-9363-9dcbcc64977d', 'Semestre 2', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', '2026-02-02', '2026-09-01', false, false)
ON CONFLICT (id) DO NOTHING;

-- 6. Classes (dépend de schools, school_years, cycles, options)
INSERT INTO classes (id, name, school_id, school_year_id, cycle_id, option_id, year_level, is_specialization, archived) VALUES
  ('283e35f3-ff6e-497b-aa54-f4febdd64368', '2ALIA', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11', 'cd64c569-cab8-4584-8d62-16e2295a695e', NULL, 2, false, false),
  ('476083d7-4678-42fe-9d8c-fea68b1df172', '3ALIA', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11', 'cd64c569-cab8-4584-8d62-16e2295a695e', 'ad3ee7e2-9e21-46fe-9bff-c8b9d57d0a00', 3, true, false),
  ('9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '2ALIA', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('883b1315-f6ba-44e3-ba73-d493728c3608', '3ALIA', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('97ced00b-f6fa-4530-8fc5-cddde6bbb9be', 'SRSCI5 FIA', '42f93ce5-9562-4825-a249-b780018834da', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11', NULL, NULL, NULL, false, false),
  ('f48fc616-a680-42f2-b7ab-24df97011a2e', 'L3', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11', 'cd64c569-cab8-4584-8d62-16e2295a695e', '7a974879-f68a-42b5-ab6a-f3e2c2312d8d', NULL, false, false),
  ('d884d11b-1450-4e2f-a8cb-c724b2f47ec2', 'CI', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('ad225a2e-fc92-4ee5-b191-8d2d4d352681', 'CP', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('21c6e05a-9bac-4756-901b-c7b21a13b522', 'CE1', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('11d34e58-f7be-441a-863e-a75190f636a1', 'CE2', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('6831e75f-a3d4-4ca9-bb1a-2d7f5abafe76', 'CM1', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('72156db5-7286-4fa5-acb3-6e24867ca9a2', 'CM2', '5acf580d-c00c-4d94-9656-8d630046b6a1', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, NULL, false, false),
  ('b221b389-a53f-4c2d-92e9-109668fe34c1', '2ème Année Licence Informatique', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, 2, false, false),
  ('869d92df-5a54-4bc3-9791-340a86f3009e', '3ème Année Licence Informatique', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, 3, false, false),
  ('82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '1ère Année Master Finance', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, 1, false, false),
  ('5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '1ère Année Licence Informatique', '42f93ce5-9562-4825-a249-b780018834da', '3814d3a0-3546-4fce-92cb-3547d3dcee79', NULL, NULL, 1, false, false)
ON CONFLICT (id) DO NOTHING;

-- 7. Professeurs (dépend de schools)
INSERT INTO teachers (id, firstname, lastname, email, mobile, school_id, status, qualification, salary, birth_date, join_date, address) VALUES
  ('849aa9c2-824f-485e-88a5-86f56c3ec7e5', 'Saad', 'Khoudali', 's.khoudali@eduvate.io', '+212705143625', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', 'active', 'Docteur en informatique', 3000, '1990-06-13', '2025-10-08', '1 Rue Prosper Mérimée'),
  ('e2e1880e-883f-4c63-bb41-27e13fbcce38', 'Khalid', 'FAHSI', 'it.ahmadou@gmail.com', '+212705143625', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Docteur en SI', 10000, '2025-09-12', '2025-10-15', '1 Rue Prosper Mérimée'),
  ('cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 'Ahmed', 'Benali', 'ahmed.benali@test.com', '0612345601', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Doctorat en Mathématiques', NULL, NULL, NULL, NULL),
  ('3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 'Fatima', 'El Idrissi', 'fatima.idrissi@test.com', '0612345602', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Master en Informatique', NULL, NULL, NULL, NULL),
  ('4b2c36ce-e44f-4f6c-bac7-23813934964d', 'Mohamed', 'Tazi', 'mohamed.tazi@test.com', '0612345603', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Master en Physique', NULL, NULL, NULL, NULL),
  ('fc74d9e5-016a-4a06-9847-852c8ca69d37', 'Youssef', 'Bennani', 'youssef.bennani@test.com', '0612345605', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Master en Économie', NULL, NULL, NULL, NULL),
  ('af408790-32f5-47b5-97a9-564ef5958315', 'Khadija', 'Alami', 'khadija.alami@test.com', '0612345604', '42f93ce5-9562-4825-a249-b780018834da', 'active', 'Licence en Français', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 8. Étudiants (aucune FK vers d'autres tables créées)
INSERT INTO students (id, firstname, lastname, email, cin_number, birth_date, student_phone, parent_phone, tutor_name, tutor_email, archived) VALUES
  ('3b182537-3cf6-42c3-859a-7349b7feaa26', 'Chaimaa', 'BAHI', 'it.ahmadou@gmail.com', 'A02668718', '2025-10-17', NULL, NULL, 'Chakib BAHI', 'it.ahmadou@eduvate.io', false),
  ('dd15c0fd-9d00-40da-bca7-96ff5293b183', 'Ahmadou Sakhir', 'LO', 'cheikhlo1999@gmail.com', '3330304CC', '2025-09-10', '+212705143625', NULL, 'Mohamed DIALLO', 'cheikhlo1999@gmail.com', false),
  ('f70de8fa-a35d-43ff-9b2f-2305b672672c', 'Mohamed', 'KHOULI', 'elkhoulimohameddev@gmail.com', 'A02668710', '2025-10-04', '+212705143625', NULL, 'Chakib EL KHOULI', 'elkhoulimohameddev@gmail.com', false),
  ('3b6eccba-9832-493c-b69e-dbec97ff6e8c', 'Test', 'test', 'it.ahmadou@gmail.com', '3330304C', '2025-11-11', '+212705143625', '+212705143625', 'Ahmadou Sakhir LO', 'it.ahmadou@gmail.com', false),
  ('de936c07-e45a-43db-8243-d8f58744cb6a', 'Nadia', 'Driss', 'nadia.driss@test.com', 'TEST004', '2005-02-25', NULL, '0661234504', NULL, NULL, false),
  ('833a4a27-bdb2-4815-95bb-5faa6ce83a13', 'Karim', 'El Amrani', 'karim.amrani@test.com', 'TEST005', '2005-09-12', NULL, '0661234505', NULL, NULL, false),
  ('e63f82eb-8a88-4820-a50b-8b57bf6bd8b2', 'Laila', 'Fassi', 'laila.fassi@test.com', 'TEST006', '2005-11-08', NULL, '0661234506', NULL, NULL, false),
  ('55868d8b-c9f6-4f33-b988-4485fbabdb6d', 'Mehdi', 'Ghali', 'mehdi.ghali@test.com', 'TEST007', '2005-01-30', NULL, '0661234507', NULL, NULL, false),
  ('3df1b674-72b7-4048-b624-ce401a7c4ee5', 'Imane', 'Hamza', 'imane.hamza@test.com', 'TEST008', '2005-04-18', NULL, '0661234508', NULL, NULL, false),
  ('6bd82460-62a3-4c20-97db-a525d2470d55', 'Rachid', 'Idrissi', 'rachid.idrissi@test.com', 'TEST009', '2005-06-22', NULL, '0661234509', NULL, NULL, false),
  ('b422a288-fc27-40a1-bc25-87bfa602b888', 'Zineb', 'Jamal', 'zineb.jamal@test.com', 'TEST010', '2005-08-14', NULL, '0661234510', NULL, NULL, false),
  ('8174f3af-e2a5-4bb3-a71f-23d79fc9fe17', 'Hassan', 'Kadiri', 'hassan.kadiri@test.com', 'TEST011', '2004-03-10', NULL, '0661234511', NULL, NULL, false),
  ('0a9c804c-c27a-43f6-9bc9-8fbcfe2f566b', 'Samira', 'Lamrani', 'samira.lamrani@test.com', 'TEST012', '2004-05-15', NULL, '0661234512', NULL, NULL, false),
  ('095f7f9d-e1ce-462c-b46a-f8f84c680a0c', 'Yassine', 'Moussa', 'yassine.moussa@test.com', 'TEST013', '2004-07-20', NULL, '0661234513', NULL, NULL, false),
  ('7a15a49b-fc7e-4bea-b078-1a180eb9b405', 'Adil', 'Abou', 'keurndiambour@gmail.com', 'TEST001', '2005-03-15', NULL, '0661234501', NULL, NULL, false),
  ('ac8e9017-2e5a-452b-b46e-b777c7177179', 'Ahmadou Sakhir', 'LO', 'a.lo@mundiapolis.ma', 'TEST002', '2005-06-20', NULL, '0661234502', NULL, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- 9. Matières (dépend de classes, teachers, schools)
INSERT INTO subjects (id, name, school_id, class_id, teacher_id, coefficient, coefficient_type, archived) VALUES
  ('8041d1a1-8e38-4090-b216-e3283d19dfbb', 'CEH', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 1, 'coefficient', false),
  ('1da57d43-d9ca-43c3-bef6-56411f36d950', 'KVM', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 1, 'coefficient', false),
  ('f74378c9-b009-437b-b3fb-53f3ec3abe4b', 'COBIT', '42f93ce5-9562-4825-a249-b780018834da', '97ced00b-f6fa-4530-8fc5-cddde6bbb9be', 'e2e1880e-883f-4c63-bb41-27e13fbcce38', 1, 'coefficient', false),
  ('76bbcde6-0958-4077-acdd-99705e000387', 'Virtualisation', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '883b1315-f6ba-44e3-ba73-d493728c3608', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 1, 'coefficient', false),
  ('c3e46fe6-206e-4e57-bd00-8ac3b40e7c2e', 'Mécanique', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '476083d7-4678-42fe-9d8c-fea68b1df172', '849aa9c2-824f-485e-88a5-86f56c3ec7e5', 1, 'coefficient', false),
  ('bacef16b-534f-497b-a506-40788cec0220', 'Finance d''Entreprise', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', 'fc74d9e5-016a-4a06-9847-852c8ca69d37', 5, 'coefficient', false),
  ('811e6356-a40f-4336-81f2-4c4aa48a674a', 'Mathématiques Financières', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 4, 'coefficient', false),
  ('c476e8ce-a672-429d-9bae-6ad0737b036f', 'Bases de Données', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 3, 'credit', false),
  ('41099692-cd4a-4f25-b1c4-cec8b40623d9', 'Algorithmique', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 4, 'coefficient', false),
  ('9da1e75e-0037-4eb9-9b65-f3750a096782', 'Communication', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'af408790-32f5-47b5-97a9-564ef5958315', 2, 'coefficient', false),
  ('f323ccd5-b7df-464e-97cd-d1f4650fc93d', 'Mathématiques 1', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 2, 'coefficient', false),
  ('06d1b82f-51e0-4cee-91c0-29e804f3daf8', 'Mathématiques 2', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 3, 'coefficient', false),
  ('c30d9839-a0b6-41d4-8991-e5abd0d6a429', 'Réseaux Informatiques', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '4b2c36ce-e44f-4f6c-bac7-23813934964d', 3, 'coefficient', false),
  ('da1b82f5-51e0-4cee-91c0-29e804f3d1f0', 'Développement Web', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 4, 'coefficient', false),
  ('eb1b82f5-51e0-4cee-91c0-29e804f3d2e1', 'Sécurité Informatique', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '4b2c36ce-e44f-4f6c-bac7-23813934964d', 3, 'coefficient', false)
ON CONFLICT (id) DO NOTHING;

-- 10. School Roles (dépend de schools)
INSERT INTO school_roles (id, name, school_id, color, is_system) VALUES
  ('c843aa8a-5b66-4eb5-acc5-92dc258b772a', 'Test', '42f93ce5-9562-4825-a249-b780018834da', 'teal', false),
  ('b93dd75c-a324-4347-adca-5ff39918c2e4', 'Essai', '42f93ce5-9562-4825-a249-b780018834da', 'blue', false)
ON CONFLICT (id) DO NOTHING;

-- 11. App Users (dépend de schools, students, teachers) - ADMIN ET STAFF UNIQUEMENT
-- Note: Le mot de passe hashé avec SHA-256 pour "password123" est utilisé comme exemple
INSERT INTO app_users (id, email, first_name, last_name, school_id, is_active, email_verified, password_hash, teacher_id, student_id) VALUES
  -- Global Admin (pas d'école)
  ('dd45639d-2749-4d80-97e0-1a28b3da7e50', 'admin@eduvate.io', 'Admin', 'EduVate', NULL, true, true, 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', NULL, NULL),
  -- School Admin Rayane
  ('c14d513b-a0f9-4dd4-a545-1d442f4ab47d', 'school@rayane.io', 'Admin', 'Rayane School', '5acf580d-c00c-4d94-9656-8d630046b6a1', true, true, 'e7c55b83b0a3aecf657c9c7745b783e63ae192e104c96c1ff8ba33ebd02fccd6', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 12. App User Roles (dépend de app_users, schools)
INSERT INTO app_user_roles (id, user_id, role, school_id) VALUES
  ('e6eaeb65-cd8c-434e-99c5-88ff7dd4a20d', 'dd45639d-2749-4d80-97e0-1a28b3da7e50', 'global_admin', NULL),
  ('60279b0f-3811-438d-84eb-ac9cb7791b4a', 'c14d513b-a0f9-4dd4-a545-1d442f4ab47d', 'school_admin', '5acf580d-c00c-4d94-9656-8d630046b6a1')
ON CONFLICT (id) DO NOTHING;

-- 13. Student School (dépend de students, schools, classes, school_years)
INSERT INTO student_school (id, student_id, school_id, class_id, school_year_id) VALUES
  (gen_random_uuid(), '3b182537-3cf6-42c3-859a-7349b7feaa26', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11'),
  (gen_random_uuid(), 'dd15c0fd-9d00-40da-bca7-96ff5293b183', '42f93ce5-9562-4825-a249-b780018834da', '97ced00b-f6fa-4530-8fc5-cddde6bbb9be', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11'),
  (gen_random_uuid(), 'f70de8fa-a35d-43ff-9b2f-2305b672672c', 'e2d29849-8ae0-4cb5-b0bb-1c6706760951', '283e35f3-ff6e-497b-aa54-f4febdd64368', 'c3bee4d7-d02c-4bb5-9c80-2122666e9d11'),
  (gen_random_uuid(), '7a15a49b-fc7e-4bea-b078-1a180eb9b405', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), 'ac8e9017-2e5a-452b-b46e-b777c7177179', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), 'de936c07-e45a-43db-8243-d8f58744cb6a', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '833a4a27-bdb2-4815-95bb-5faa6ce83a13', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), 'e63f82eb-8a88-4820-a50b-8b57bf6bd8b2', '42f93ce5-9562-4825-a249-b780018834da', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '55868d8b-c9f6-4f33-b988-4485fbabdb6d', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '3df1b674-72b7-4048-b624-ce401a7c4ee5', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '6bd82460-62a3-4c20-97db-a525d2470d55', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), 'b422a288-fc27-40a1-bc25-87bfa602b888', '42f93ce5-9562-4825-a249-b780018834da', 'b221b389-a53f-4c2d-92e9-109668fe34c1', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '8174f3af-e2a5-4bb3-a71f-23d79fc9fe17', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '0a9c804c-c27a-43f6-9bc9-8fbcfe2f566b', '42f93ce5-9562-4825-a249-b780018834da', '869d92df-5a54-4bc3-9791-340a86f3009e', '3814d3a0-3546-4fce-92cb-3547d3dcee79'),
  (gen_random_uuid(), '095f7f9d-e1ce-462c-b46a-f8f84c680a0c', '42f93ce5-9562-4825-a249-b780018834da', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '3814d3a0-3546-4fce-92cb-3547d3dcee79')
ON CONFLICT DO NOTHING;

-- 14. Teacher Classes (dépend de teachers, classes)
INSERT INTO teacher_classes (id, teacher_id, class_id) VALUES
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780'),
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '883b1315-f6ba-44e3-ba73-d493728c3608'),
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '283e35f3-ff6e-497b-aa54-f4febdd64368'),
  (gen_random_uuid(), '849aa9c2-824f-485e-88a5-86f56c3ec7e5', '476083d7-4678-42fe-9d8c-fea68b1df172'),
  (gen_random_uuid(), 'e2e1880e-883f-4c63-bb41-27e13fbcce38', '97ced00b-f6fa-4530-8fc5-cddde6bbb9be'),
  (gen_random_uuid(), 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c'),
  (gen_random_uuid(), 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', 'b221b389-a53f-4c2d-92e9-109668fe34c1'),
  (gen_random_uuid(), 'cbbbcb3f-ac56-41dd-a3ef-e7dc25e09f2e', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2'),
  (gen_random_uuid(), '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c'),
  (gen_random_uuid(), '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', 'b221b389-a53f-4c2d-92e9-109668fe34c1'),
  (gen_random_uuid(), '3a0e0c48-2978-4a5c-8ef0-d4b21c5e7252', '869d92df-5a54-4bc3-9791-340a86f3009e'),
  (gen_random_uuid(), '4b2c36ce-e44f-4f6c-bac7-23813934964d', 'b221b389-a53f-4c2d-92e9-109668fe34c1'),
  (gen_random_uuid(), '4b2c36ce-e44f-4f6c-bac7-23813934964d', '869d92df-5a54-4bc3-9791-340a86f3009e'),
  (gen_random_uuid(), 'fc74d9e5-016a-4a06-9847-852c8ca69d37', '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2'),
  (gen_random_uuid(), 'af408790-32f5-47b5-97a9-564ef5958315', '5ad6abd3-df84-4550-acc8-cf40b0b3af2c')
ON CONFLICT DO NOTHING;

-- 15. Class Subjects (dépend de classes, subjects)
INSERT INTO class_subjects (id, class_id, subject_id) VALUES
  (gen_random_uuid(), '9e77d4c1-5bbe-4fb0-83a1-c35a40d38780', '8041d1a1-8e38-4090-b216-e3283d19dfbb'),
  (gen_random_uuid(), '283e35f3-ff6e-497b-aa54-f4febdd64368', '1da57d43-d9ca-43c3-bef6-56411f36d950'),
  (gen_random_uuid(), '97ced00b-f6fa-4530-8fc5-cddde6bbb9be', 'f74378c9-b009-437b-b3fb-53f3ec3abe4b'),
  (gen_random_uuid(), '883b1315-f6ba-44e3-ba73-d493728c3608', '76bbcde6-0958-4077-acdd-99705e000387'),
  (gen_random_uuid(), '476083d7-4678-42fe-9d8c-fea68b1df172', 'c3e46fe6-206e-4e57-bd00-8ac3b40e7c2e'),
  (gen_random_uuid(), '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '41099692-cd4a-4f25-b1c4-cec8b40623d9'),
  (gen_random_uuid(), '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', '9da1e75e-0037-4eb9-9b65-f3750a096782'),
  (gen_random_uuid(), '5ad6abd3-df84-4550-acc8-cf40b0b3af2c', 'f323ccd5-b7df-464e-97cd-d1f4650fc93d'),
  (gen_random_uuid(), 'b221b389-a53f-4c2d-92e9-109668fe34c1', '06d1b82f-51e0-4cee-91c0-29e804f3daf8'),
  (gen_random_uuid(), 'b221b389-a53f-4c2d-92e9-109668fe34c1', 'c476e8ce-a672-429d-9bae-6ad0737b036f'),
  (gen_random_uuid(), 'b221b389-a53f-4c2d-92e9-109668fe34c1', 'c30d9839-a0b6-41d4-8991-e5abd0d6a429'),
  (gen_random_uuid(), '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', 'bacef16b-534f-497b-a506-40788cec0220'),
  (gen_random_uuid(), '82ec1ff4-acc5-4a8f-b396-32d40b4bbec2', '811e6356-a40f-4336-81f2-4c4aa48a674a')
ON CONFLICT DO NOTHING;
