-- Migrer les données existantes de student_accounts vers app_users
INSERT INTO app_users (
  email, password_hash, first_name, last_name,
  school_id, student_id, is_active, 
  invitation_token, invitation_expires_at,
  created_at, updated_at
)
SELECT 
  sa.email,
  sa.password_hash,
  COALESCE(s.firstname, 'Prénom'),
  COALESCE(s.lastname, 'Nom'),
  sa.school_id,
  sa.student_id,
  sa.is_active,
  sa.invitation_token,
  sa.invitation_expires_at,
  sa.created_at,
  NOW()
FROM student_accounts sa
LEFT JOIN students s ON s.id = sa.student_id
WHERE NOT EXISTS (
  SELECT 1 FROM app_users au WHERE au.email = sa.email
);

-- Créer les rôles student pour les comptes migrés
INSERT INTO app_user_roles (user_id, role, school_id)
SELECT au.id, 'student'::app_role, au.school_id
FROM app_users au
WHERE au.student_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM app_user_roles aur 
  WHERE aur.user_id = au.id AND aur.role = 'student'
);

-- Créer un compte Global Admin (admin SaaS)
INSERT INTO app_users (
  email, password_hash, first_name, last_name,
  school_id, is_active, email_verified
)
VALUES (
  'admin@eduvate.io',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'Admin',
  'EduVate',
  NULL,
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  email_verified = true;

-- Créer le rôle global_admin
INSERT INTO app_user_roles (user_id, role, school_id)
SELECT id, 'global_admin'::app_role, NULL
FROM app_users WHERE email = 'admin@eduvate.io'
ON CONFLICT (user_id, role, school_id) DO NOTHING;

-- Créer un compte School Admin pour Rayane School
INSERT INTO app_users (
  email, password_hash, first_name, last_name,
  school_id, is_active, email_verified
)
VALUES (
  'school@rayane.io',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'Admin',
  'Rayane School',
  '5acf580d-c00c-4d94-9656-8d630046b6a1',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  school_id = EXCLUDED.school_id,
  is_active = true,
  email_verified = true;

-- Créer le rôle school_admin
INSERT INTO app_user_roles (user_id, role, school_id)
SELECT id, 'school_admin'::app_role, school_id
FROM app_users WHERE email = 'school@rayane.io'
ON CONFLICT (user_id, role, school_id) DO NOTHING;

-- Créer un compte enseignant (utiliser le premier enseignant)
INSERT INTO app_users (
  email, password_hash, first_name, last_name,
  school_id, teacher_id, is_active, email_verified
)
SELECT 
  t.email,
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  t.firstname,
  t.lastname,
  t.school_id,
  t.id,
  true,
  true
FROM teachers t
WHERE t.archived = false
LIMIT 1
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  teacher_id = EXCLUDED.teacher_id,
  is_active = true,
  email_verified = true;

-- Créer le rôle teacher
INSERT INTO app_user_roles (user_id, role, school_id)
SELECT au.id, 'teacher'::app_role, au.school_id
FROM app_users au
WHERE au.teacher_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM app_user_roles aur 
  WHERE aur.user_id = au.id AND aur.role = 'teacher'
);

-- Créer un compte étudiant (utiliser le premier étudiant)
INSERT INTO app_users (
  email, password_hash, first_name, last_name,
  school_id, student_id, is_active, email_verified
)
SELECT 
  s.email,
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  s.firstname,
  s.lastname,
  ss.school_id,
  s.id,
  true,
  true
FROM students s
JOIN student_school ss ON ss.student_id = s.id AND ss.is_active = true
WHERE s.archived = false AND s.email IS NOT NULL AND s.email != ''
LIMIT 1
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  student_id = EXCLUDED.student_id,
  is_active = true,
  email_verified = true;

-- Mettre à jour les rôles student
INSERT INTO app_user_roles (user_id, role, school_id)
SELECT au.id, 'student'::app_role, au.school_id
FROM app_users au
WHERE au.student_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM app_user_roles aur 
  WHERE aur.user_id = au.id AND aur.role = 'student'
);