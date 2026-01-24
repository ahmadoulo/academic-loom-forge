-- ============================================================
-- EDUVATE SCHOOL MANAGEMENT SYSTEM - Production Database Schema
-- Version: 3.0 - Permissive RLS (matching Lovable Cloud)
-- ============================================================
-- 
-- ARCHITECTURE:
-- - Custom authentication via app_users table (NOT Supabase Auth)
-- - Session tokens stored in app_users.session_token
-- - Roles stored in app_user_roles table
-- - All WRITE operations should go through Edge Functions (service_role)
-- - For initial deployment: permissive RLS to match Lovable Cloud behavior
-- 
-- NOTE: This version uses permissive RLS policies (USING true / WITH CHECK true)
-- to match the current Lovable Cloud configuration. For production security,
-- you should implement proper role-based RLS policies.
-- ============================================================

-- Clean slate
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE public.app_role AS ENUM (
  'global_admin',
  'school_admin', 
  'school_staff',
  'teacher',
  'student',
  'parent',
  'admission',
  'accountant',
  'secretary'
);

CREATE TYPE public.subscription_plan_type AS ENUM (
  'starter',
  'basic',
  'standard',
  'premium',
  'enterprise'
);

CREATE TYPE public.subscription_status_type AS ENUM (
  'trial',
  'active',
  'expired',
  'cancelled',
  'suspended'
);

CREATE TYPE public.subscription_duration_type AS ENUM (
  'monthly',
  'quarterly',
  'semi_annual',
  'annual'
);

CREATE TYPE public.payment_method_type AS ENUM (
  'bank_transfer',
  'cash',
  'check',
  'card',
  'other'
);

-- ============================================================
-- TABLES (56 tables)
-- ============================================================

-- 1. SCHOOLS (core entity)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  identifier TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Maroc',
  logo_url TEXT,
  website TEXT,
  academic_year TEXT DEFAULT '2024-2025',
  currency TEXT NOT NULL DEFAULT 'MAD',
  owner_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. APP_USERS (custom auth - NOT Supabase Auth)
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  teacher_id UUID,
  student_id UUID,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  session_token TEXT,
  session_expires_at TIMESTAMPTZ,
  invitation_token TEXT,
  invitation_expires_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IMPORTANT: PostgREST embedded joins in the app rely on the FK name below
-- (see src/hooks/useSchools.ts: owner:app_users!schools_owner_id_fkey(...))
ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_owner_id_fkey;
ALTER TABLE public.schools
  ADD CONSTRAINT schools_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 3. APP_USER_ROLES (role assignments)
CREATE TABLE public.app_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, school_id)
);

-- 4. SUBSCRIPTION_PLANS
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.subscription_plan_type NOT NULL,
  description TEXT,
  features TEXT[],
  student_limit INTEGER,
  teacher_limit INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_type public.subscription_plan_type NOT NULL,
  status public.subscription_status_type NOT NULL DEFAULT 'trial',
  duration public.subscription_duration_type NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'MAD',
  payment_method public.payment_method_type,
  transaction_id TEXT,
  notes TEXT,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_end_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  custom_student_limit INTEGER,
  custom_teacher_limit INTEGER,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- The frontend often does .eq('school_id', ...).single(); enforce 1 row per school.
  UNIQUE (school_id)
);

-- 6. SCHOOL_YEARS
CREATE TABLE public.school_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  is_next BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SCHOOL_SEMESTER
CREATE TABLE public.school_semester (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_actual BOOLEAN DEFAULT false,
  is_next BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CYCLES
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT,
  duration_years INTEGER,
  calculation_system TEXT NOT NULL DEFAULT 'coefficient',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cycles
  ADD CONSTRAINT cycles_calculation_system_check
  CHECK (calculation_system IN ('credit', 'coefficient'));

-- 9. OPTIONS
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  start_year INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. CLASSES
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  year_level INTEGER DEFAULT 1,
  is_specialization BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  capacity INTEGER DEFAULT 30,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. STUDENTS
-- Columns must match types.ts: id, firstname, lastname, email, cin_number, birth_date, parent_phone, student_phone, tutor_name, tutor_email, archived, archived_at, created_at, updated_at
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT,
  cin_number TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  parent_phone TEXT,
  student_phone TEXT,
  tutor_name TEXT,
  tutor_email TEXT,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. STUDENT_SCHOOL (student enrollment per year)
-- Columns must match types.ts: id, student_id, school_id, class_id, school_year_id, is_active, enrolled_at, created_at, updated_at
CREATE TABLE public.student_school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, school_id, school_year_id)
);

CREATE INDEX IF NOT EXISTS idx_student_school_lookup
  ON public.student_school(student_id, school_year_id, school_id, is_active);

-- 13. TEACHERS
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  birth_date DATE,
  mobile TEXT,
  address TEXT,
  qualification TEXT,
  join_date DATE,
  salary NUMERIC,
  status TEXT DEFAULT 'active',
  assigned_classes_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. TEACHER_CLASSES (teacher-class assignments)
-- Columns must match types.ts: id, teacher_id, class_id, created_at, updated_at
CREATE TABLE public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- IMPORTANT: The app explicitly references these FK names in selects
-- (see src/hooks/useTeacherClasses.ts: classes!fk_teacher_classes_class_id(...))
ALTER TABLE public.teacher_classes
  DROP CONSTRAINT IF EXISTS fk_teacher_classes_teacher_id;
ALTER TABLE public.teacher_classes
  DROP CONSTRAINT IF EXISTS teacher_classes_teacher_id_fkey;
ALTER TABLE public.teacher_classes
  ADD CONSTRAINT fk_teacher_classes_teacher_id
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_classes
  DROP CONSTRAINT IF EXISTS fk_teacher_classes_class_id;
ALTER TABLE public.teacher_classes
  DROP CONSTRAINT IF EXISTS teacher_classes_class_id_fkey;
ALTER TABLE public.teacher_classes
  ADD CONSTRAINT fk_teacher_classes_class_id
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 15. SUBJECTS
-- Columns must match types.ts: id, class_id, name, coefficient, coefficient_type, archived, archived_at, school_id, teacher_id, created_at, updated_at
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  name TEXT NOT NULL,
  coefficient NUMERIC NOT NULL DEFAULT 1,
  coefficient_type TEXT NOT NULL DEFAULT 'coefficient',
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  school_id UUID,
  teacher_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK constraints with names expected by PostgREST (from types.ts)
ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS subjects_class_id_fkey;
ALTER TABLE public.subjects
  ADD CONSTRAINT subjects_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS fk_subjects_school_id;
ALTER TABLE public.subjects
  ADD CONSTRAINT fk_subjects_school_id
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS subjects_teacher_id_fkey;
ALTER TABLE public.subjects
  ADD CONSTRAINT subjects_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 16. CLASS_SUBJECTS (subjects assigned to classes)
-- Columns must match types.ts: id, class_id, subject_id, created_at
CREATE TABLE public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- 17. CLASSROOMS (physical rooms)
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  capacity INTEGER NOT NULL DEFAULT 30,
  equipment TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. ASSIGNMENTS (timetable sessions)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'course',
  session_date DATE,
  start_time TIME,
  end_time TIME,
  due_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  recurrence_day INTEGER,
  recurrence_end_date DATE,
  parent_assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  is_rescheduled BOOLEAN DEFAULT false,
  original_session_date DATE,
  proposed_new_date DATE,
  reschedule_reason TEXT,
  reschedule_status TEXT,
  rescheduled_by UUID,
  rescheduled_at TIMESTAMPTZ,
  absence_notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. CLASSROOM_ASSIGNMENTS (room bookings for sessions)
CREATE TABLE public.classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, assignment_id)
);

-- 20. ATTENDANCE
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  class_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  subject_id UUID,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL,
  assignment_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  marked_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  is_justified BOOLEAN DEFAULT false,
  justification_comment TEXT,
  justification_file_path TEXT,
  justification_submitted_at TIMESTAMPTZ,
  justification_status TEXT DEFAULT 'pending',
  justification_reviewed_at TIMESTAMPTZ,
  justification_reviewed_by UUID,
  justification_rejection_reason TEXT,

  -- Backward-compat columns (some older code/exports may still read these)
  justified BOOLEAN DEFAULT false,
  justification_reason TEXT,
  justified_at TIMESTAMPTZ,
  justified_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure allowed values for status/method are not enforced here (app is evolving)

-- IMPORTANT: PostgREST embedded joins rely on FK names matching types.ts
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS fk_attendance_class_id;
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT fk_attendance_class_id
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_assignment_id_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_assignment_id_fkey
  FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE SET NULL;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_school_year_id_fkey
  FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Optional (not used by embedded joins but keeps referential integrity)
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_justification_reviewed_by_fkey;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_justification_reviewed_by_fkey
  FOREIGN KEY (justification_reviewed_by) REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 21. ATTENDANCE_SESSIONS (QR code sessions)
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. GRADES
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  school_semester_id UUID REFERENCES public.school_semester(id) ON DELETE SET NULL,
  grade NUMERIC NOT NULL,
  grade_type TEXT NOT NULL DEFAULT 'controle',
  comment TEXT,
  exam_date DATE,
  is_modified BOOLEAN DEFAULT false,
  bonus INTEGER DEFAULT 0,
  bonus_reason TEXT,
  bonus_given_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  bonus_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  scope TEXT NOT NULL DEFAULT 'school',
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  links TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT true,
  attendance_enabled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. EVENT_ATTENDANCE_SESSIONS
-- Columns must match types.ts: id, event_id, school_id, session_code, expires_at, is_active, created_at, updated_at
CREATE TABLE public.event_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK names expected by PostgREST
ALTER TABLE public.event_attendance_sessions
  DROP CONSTRAINT IF EXISTS event_attendance_sessions_event_id_fkey;
ALTER TABLE public.event_attendance_sessions
  ADD CONSTRAINT event_attendance_sessions_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendance_sessions
  DROP CONSTRAINT IF EXISTS event_attendance_sessions_school_id_fkey;
ALTER TABLE public.event_attendance_sessions
  ADD CONSTRAINT event_attendance_sessions_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

-- 25. EVENT_ATTENDANCE
-- Columns must match types.ts: id, event_id, session_id, school_id, participant_name, participant_email, participant_phone, student_id, marked_at, method, created_at
CREATE TABLE public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.event_attendance_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_phone TEXT,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'qr_scan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK names expected by PostgREST
ALTER TABLE public.event_attendance
  DROP CONSTRAINT IF EXISTS event_attendance_event_id_fkey;
ALTER TABLE public.event_attendance
  ADD CONSTRAINT event_attendance_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendance
  DROP CONSTRAINT IF EXISTS event_attendance_session_id_fkey;
ALTER TABLE public.event_attendance
  ADD CONSTRAINT event_attendance_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.event_attendance_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendance
  DROP CONSTRAINT IF EXISTS event_attendance_school_id_fkey;
ALTER TABLE public.event_attendance
  ADD CONSTRAINT event_attendance_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendance
  DROP CONSTRAINT IF EXISTS event_attendance_student_id_fkey;
ALTER TABLE public.event_attendance
  ADD CONSTRAINT event_attendance_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- 26. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all',
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT false,
  links TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. SCHOOL_NOTIFICATIONS
CREATE TABLE public.school_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 28. ABSENCE_NOTIFICATIONS_LOG
CREATE TABLE public.absence_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 29. DOCUMENT_TEMPLATES
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  header_style TEXT DEFAULT 'modern',
  footer_color TEXT DEFAULT '#1e40af',
  footer_content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 30. DOCUMENT_REQUESTS
CREATE TABLE public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_reason TEXT,
  notes TEXT,
  processed_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 30b. DOCUMENT_REQUEST_TRACKING
-- Columns must match types.ts: id, request_id, school_id, student_id, status, comment, updated_by, created_at
CREATE TABLE public.document_request_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.administrative_document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  year_level INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 32. STUDENT_ADMINISTRATIVE_DOCUMENTS
-- Columns must match types.ts: id, student_id, document_type_id, school_id, status, acquired_at, file_path, notes, verified_by, created_at, updated_at
CREATE TABLE public.student_administrative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.administrative_document_types(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'missing',
  acquired_at TIMESTAMPTZ,
  file_path TEXT,
  notes TEXT,
  verified_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, document_type_id)
);

-- 33. SCHOOL_ADMISSION
CREATE TABLE public.school_admission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  civility TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  nationality TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  education_level TEXT NOT NULL,
  last_institution TEXT NOT NULL,
  last_institution_type TEXT NOT NULL,
  desired_cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  desired_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'nouveau',
  notes TEXT,
  converted_to_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 34. BULLETIN_SETTINGS
CREATE TABLE public.bulletin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  template_style TEXT DEFAULT 'classic',
  primary_color TEXT DEFAULT '#333333',
  secondary_color TEXT DEFAULT '#666666',
  accent_color TEXT DEFAULT '#0066cc',
  show_weighted_average BOOLEAN NOT NULL DEFAULT true,
  show_ranking BOOLEAN NOT NULL DEFAULT true,
  show_mention BOOLEAN NOT NULL DEFAULT true,
  show_decision BOOLEAN NOT NULL DEFAULT true,
  show_observations BOOLEAN NOT NULL DEFAULT false,
  custom_footer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

-- 35. SCHOOL_CAMERAS
CREATE TABLE public.school_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rtsp_url TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 36. SCHOOL_TEXTBOOKS
CREATE TABLE public.school_textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 37. SCHOOL_TEXTBOOK_ENTRIES
CREATE TABLE public.school_textbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  chapter_title TEXT,
  lesson_content TEXT NOT NULL,
  objectives_covered TEXT,
  homework_given TEXT,
  homework_due_date DATE,
  next_session_plan TEXT,
  resources_links TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 38. SCHOOL_TEXTBOOK_NOTES
CREATE TABLE public.school_textbook_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  target_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  is_visible_to_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 39. EXAM_DOCUMENTS
CREATE TABLE public.exam_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  school_semester_id UUID REFERENCES public.school_semester(id) ON DELETE SET NULL,
  exam_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  documents_allowed BOOLEAN NOT NULL DEFAULT false,
  answer_on_document BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 40. EXAM_QUESTIONS
CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_document_id UUID NOT NULL REFERENCES public.exam_documents(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  points NUMERIC NOT NULL,
  has_choices BOOLEAN NOT NULL DEFAULT false,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  table_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 41. EXAM_ANSWERS
-- Columns must match types.ts: id, question_id, answer_text, is_correct, created_at
CREATE TABLE public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 42. EXAM_QUESTION_CHOICES (keep for backward compatibility)
CREATE TABLE public.exam_question_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 42. ONLINE_EXAMS
CREATE TABLE public.online_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  allow_window_switch BOOLEAN NOT NULL DEFAULT false,
  max_warnings INTEGER NOT NULL DEFAULT 3,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 43. ONLINE_EXAM_QUESTIONS
-- Columns must match types.ts: id, exam_id, question_text, points, question_order, created_at
CREATE TABLE public.online_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  points NUMERIC NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 44. ONLINE_EXAM_ANSWERS
CREATE TABLE public.online_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 45. STUDENT_EXAM_ATTEMPTS
CREATE TABLE public.student_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score NUMERIC,
  warning_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 46. STUDENT_EXAM_RESPONSES
CREATE TABLE public.student_exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES public.online_exam_answers(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 47. SCHOOL_ROLES (custom roles per school)
CREATE TABLE public.school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'blue',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- 48. SCHOOL_ROLE_PERMISSIONS
CREATE TABLE public.school_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- 49. USER_SCHOOL_ROLES
CREATE TABLE public.user_school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  school_role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_role_id)
);

-- 50. YEAR_PREPARATIONS
-- Columns must match types.ts: id, school_id, from_year_id, to_year_id, status, classes_created_at, mapping_completed_at, students_promoted_at, created_at, updated_at
CREATE TABLE public.year_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  from_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  to_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  classes_created_at TIMESTAMPTZ,
  mapping_completed_at TIMESTAMPTZ,
  students_promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 51. CLASS_TRANSITIONS
CREATE TABLE public.class_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  to_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 52. STUDENT_TRANSITIONS
CREATE TABLE public.student_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  transition_type TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 53. SCHOOL_FEE_CONFIG
CREATE TABLE public.school_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  amount_default NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 54. SCHOOL_FEES
CREATE TABLE public.school_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_config_id UUID NOT NULL REFERENCES public.school_fee_config(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  due_month TEXT NOT NULL,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 55. SCHOOL_PAYMENTS
CREATE TABLE public.school_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES public.school_fees(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  method TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  recorded_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 56. TEACHER_SCHOOL (multi-school teachers)
CREATE TABLE public.teacher_school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, school_id)
);

-- 57. NOTIFICATION_PREFERENCES
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  absence_alerts BOOLEAN DEFAULT true,
  grade_alerts BOOLEAN DEFAULT true,
  event_reminders BOOLEAN DEFAULT true,
  announcement_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- ============================================================
-- VIEWS
-- ============================================================

-- app_users_public view (used for embedded joins from various tables)
-- This view exposes non-sensitive user information for PostgREST joins
CREATE OR REPLACE VIEW public.app_users_public AS
SELECT
  id,
  email,
  first_name,
  last_name,
  phone,
  avatar_url,
  school_id,
  teacher_id,
  student_id,
  is_active,
  created_at,
  updated_at
FROM public.app_users;

-- ============================================================
-- INDEXES (performance)
-- ============================================================

CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_session_token ON public.app_users(session_token);
CREATE INDEX idx_app_users_school_id ON public.app_users(school_id);
CREATE INDEX idx_app_user_roles_user_id ON public.app_user_roles(user_id);
CREATE INDEX idx_app_user_roles_role ON public.app_user_roles(role);
CREATE INDEX idx_app_user_roles_school_id ON public.app_user_roles(school_id);
CREATE INDEX idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX idx_assignments_school_id ON public.assignments(school_id);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignments_session_date ON public.assignments(session_date);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_grades_school_year_id ON public.grades(school_year_id);
CREATE INDEX idx_subscriptions_school_id ON public.subscriptions(school_id);
CREATE INDEX idx_school_years_school_id ON public.school_years(school_id);
CREATE INDEX idx_school_semester_school_id ON public.school_semester(school_id);
CREATE INDEX idx_student_school_lookup ON public.student_school(student_id, school_year_id, school_id, is_active);
CREATE INDEX idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX idx_event_attendance_sessions_event_id ON public.event_attendance_sessions(event_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Check user role
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id UUID, _role public.app_role, _school_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles
    WHERE user_id = _user_id 
    AND role = _role
    AND (
      (_school_id IS NULL AND school_id IS NULL)
      OR (school_id = _school_id)
      OR (_school_id IS NULL AND role = 'global_admin')
    )
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role public.app_role, school_id UUID) AS $$
  SELECT role, school_id FROM app_user_roles WHERE user_id = _user_id
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- User belongs to school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = _user_id AND school_id = _school_id
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Is global admin
CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = _user_id AND role = 'global_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Is school admin
CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = _user_id AND school_id = _school_id AND role = 'school_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Auto transition semesters
CREATE OR REPLACE FUNCTION public.auto_transition_semesters()
RETURNS VOID AS $$
DECLARE
  v_semester RECORD;
BEGIN
  FOR v_semester IN 
    SELECT s.id, s.school_id
    FROM school_semester s
    WHERE s.is_actual = true 
    AND s.end_date < CURRENT_DATE
  LOOP
    UPDATE school_semester
    SET is_actual = true, is_next = false
    WHERE school_id = v_semester.school_id
    AND start_date > (SELECT end_date FROM school_semester WHERE id = v_semester.id)
    AND id IN (
      SELECT id FROM school_semester
      WHERE school_id = v_semester.school_id
      AND start_date > (SELECT end_date FROM school_semester WHERE id = v_semester.id)
      ORDER BY start_date ASC
      LIMIT 1
    );
    
    UPDATE school_semester
    SET is_actual = false
    WHERE id = v_semester.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Set current semester (only one actual per school)
-- Needed by src/hooks/useSchoolSemesters.ts -> supabase.rpc('set_current_semester', { semester_id })
CREATE OR REPLACE FUNCTION public.set_current_semester(semester_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM school_semester
  WHERE id = semester_id;

  -- Reset all semesters for that school
  UPDATE school_semester
  SET is_actual = false,
      is_next = false
  WHERE school_id = v_school_id;

  -- Set requested semester as current
  UPDATE school_semester
  SET is_actual = true,
      is_next = false
  WHERE id = semester_id;
END;
$$;

-- Create default subscription for each new school
-- Prevents PGRST116 when frontend expects a single subscription row per school.
CREATE OR REPLACE FUNCTION public.create_default_subscription_for_school()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    school_id,
    plan_type,
    status,
    duration,
    start_date,
    end_date,
    is_trial,
    trial_end_date
  ) VALUES (
    NEW.id,
    'starter',
    'trial',
    'monthly',
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '30 days')::date,
    true,
    (CURRENT_DATE + INTERVAL '30 days')::date
  )
  ON CONFLICT (school_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- RPC/function permissions for PostgREST
GRANT EXECUTE ON FUNCTION public.set_current_semester(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_transition_semesters() TO anon, authenticated;

-- Generate random password
CREATE OR REPLACE FUNCTION public.generate_random_password(length INTEGER DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result text := '';
    i int := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User has school permission
CREATE OR REPLACE FUNCTION public.user_has_school_permission(_user_id UUID, _school_id UUID, _permission_key TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_school_roles usr
        JOIN school_role_permissions srp ON srp.role_id = usr.school_role_id
        WHERE usr.user_id = _user_id
        AND usr.school_id = _school_id
        AND srp.permission_key = _permission_key
    )
    OR EXISTS (
        SELECT 1
        FROM app_user_roles aur
        WHERE aur.user_id = _user_id
        AND aur.school_id = _school_id
        AND aur.role = 'school_admin'
    )
    OR EXISTS (
        SELECT 1
        FROM app_user_roles aur
        WHERE aur.user_id = _user_id
        AND aur.role = 'global_admin'
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Get user school permissions
CREATE OR REPLACE FUNCTION public.get_user_school_permissions(_user_id UUID, _school_id UUID)
RETURNS TEXT[] AS $$
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT srp.permission_key),
        ARRAY[]::TEXT[]
    )
    FROM user_school_roles usr
    JOIN school_role_permissions srp ON srp.role_id = usr.school_role_id
    WHERE usr.user_id = _user_id
    AND usr.school_id = _school_id
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure each school has a subscription row for frontend .single() queries
DROP TRIGGER IF EXISTS create_default_subscription_after_school_insert ON public.schools;
CREATE TRIGGER create_default_subscription_after_school_insert
AFTER INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.create_default_subscription_for_school();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_years_updated_at BEFORE UPDATE ON public.school_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_semester_updated_at BEFORE UPDATE ON public.school_semester FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cycles_updated_at BEFORE UPDATE ON public.cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON public.options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_school_updated_at BEFORE UPDATE ON public.student_school FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_subjects_updated_at BEFORE UPDATE ON public.class_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classroom_assignments_updated_at BEFORE UPDATE ON public.classroom_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_sessions_updated_at BEFORE UPDATE ON public.attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_attendance_sessions_updated_at BEFORE UPDATE ON public.event_attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_requests_updated_at BEFORE UPDATE ON public.document_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_administrative_document_types_updated_at BEFORE UPDATE ON public.administrative_document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_administrative_documents_updated_at BEFORE UPDATE ON public.student_administrative_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_admission_updated_at BEFORE UPDATE ON public.school_admission FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bulletin_settings_updated_at BEFORE UPDATE ON public.bulletin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_cameras_updated_at BEFORE UPDATE ON public.school_cameras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_textbooks_updated_at BEFORE UPDATE ON public.school_textbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_textbook_entries_updated_at BEFORE UPDATE ON public.school_textbook_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_textbook_notes_updated_at BEFORE UPDATE ON public.school_textbook_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_documents_updated_at BEFORE UPDATE ON public.exam_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON public.exam_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_online_exams_updated_at BEFORE UPDATE ON public.online_exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_roles_updated_at BEFORE UPDATE ON public.school_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_year_preparations_updated_at BEFORE UPDATE ON public.year_preparations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_fee_config_updated_at BEFORE UPDATE ON public.school_fee_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_fees_updated_at BEFORE UPDATE ON public.school_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_administrative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbook_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_question_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_request_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - PERMISSIVE (matching Lovable Cloud)
-- ============================================================
-- 
-- All policies use "FOR ALL ... USING (true) WITH CHECK (true)"
-- This matches the current Lovable Cloud behavior where everything is allowed.
-- For production security, implement proper role-based policies.
-- ============================================================

-- SCHOOLS
CREATE POLICY "Allow all on schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);

-- APP_USERS
CREATE POLICY "Allow all on app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

-- APP_USER_ROLES
CREATE POLICY "Allow all on app_user_roles" ON public.app_user_roles FOR ALL USING (true) WITH CHECK (true);

-- SUBSCRIPTION_PLANS
CREATE POLICY "Allow all on subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);

-- SUBSCRIPTIONS
CREATE POLICY "Allow all on subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_YEARS
CREATE POLICY "Allow all on school_years" ON public.school_years FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_SEMESTER
CREATE POLICY "Allow all on school_semester" ON public.school_semester FOR ALL USING (true) WITH CHECK (true);

-- CYCLES
CREATE POLICY "Allow all on cycles" ON public.cycles FOR ALL USING (true) WITH CHECK (true);

-- OPTIONS
CREATE POLICY "Allow all on options" ON public.options FOR ALL USING (true) WITH CHECK (true);

-- CLASSES
CREATE POLICY "Allow all on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

-- STUDENTS
CREATE POLICY "Allow all on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- STUDENT_SCHOOL
CREATE POLICY "Allow all on student_school" ON public.student_school FOR ALL USING (true) WITH CHECK (true);

-- TEACHERS
CREATE POLICY "Allow all on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

-- TEACHER_CLASSES
CREATE POLICY "Allow all on teacher_classes" ON public.teacher_classes FOR ALL USING (true) WITH CHECK (true);

-- SUBJECTS
CREATE POLICY "Allow all on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- CLASS_SUBJECTS
CREATE POLICY "Allow all on class_subjects" ON public.class_subjects FOR ALL USING (true) WITH CHECK (true);

-- CLASSROOMS
CREATE POLICY "Allow all on classrooms" ON public.classrooms FOR ALL USING (true) WITH CHECK (true);

-- ASSIGNMENTS
CREATE POLICY "Allow all on assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

-- CLASSROOM_ASSIGNMENTS
CREATE POLICY "Allow all on classroom_assignments" ON public.classroom_assignments FOR ALL USING (true) WITH CHECK (true);

-- ATTENDANCE
CREATE POLICY "Allow all on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- ATTENDANCE_SESSIONS
CREATE POLICY "Allow all on attendance_sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);

-- GRADES
CREATE POLICY "Allow all on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- EVENTS
CREATE POLICY "Allow all on events" ON public.events FOR ALL USING (true) WITH CHECK (true);

-- EVENT_ATTENDANCE_SESSIONS
CREATE POLICY "Allow all on event_attendance_sessions" ON public.event_attendance_sessions FOR ALL USING (true) WITH CHECK (true);

-- EVENT_ATTENDANCE
CREATE POLICY "Allow all on event_attendance" ON public.event_attendance FOR ALL USING (true) WITH CHECK (true);

-- ANNOUNCEMENTS
CREATE POLICY "Allow all on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_NOTIFICATIONS
CREATE POLICY "Allow all on school_notifications" ON public.school_notifications FOR ALL USING (true) WITH CHECK (true);

-- ABSENCE_NOTIFICATIONS_LOG
CREATE POLICY "Allow all on absence_notifications_log" ON public.absence_notifications_log FOR ALL USING (true) WITH CHECK (true);

-- DOCUMENT_TEMPLATES
CREATE POLICY "Allow all on document_templates" ON public.document_templates FOR ALL USING (true) WITH CHECK (true);

-- DOCUMENT_REQUESTS
CREATE POLICY "Allow all on document_requests" ON public.document_requests FOR ALL USING (true) WITH CHECK (true);

-- DOCUMENT_REQUEST_TRACKING
CREATE POLICY "Allow all on document_request_tracking" ON public.document_request_tracking FOR ALL USING (true) WITH CHECK (true);

-- ADMINISTRATIVE_DOCUMENT_TYPES
CREATE POLICY "Allow all on administrative_document_types" ON public.administrative_document_types FOR ALL USING (true) WITH CHECK (true);

-- STUDENT_ADMINISTRATIVE_DOCUMENTS
CREATE POLICY "Allow all on student_administrative_documents" ON public.student_administrative_documents FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_ADMISSION
CREATE POLICY "Allow all on school_admission" ON public.school_admission FOR ALL USING (true) WITH CHECK (true);

-- BULLETIN_SETTINGS
CREATE POLICY "Allow all on bulletin_settings" ON public.bulletin_settings FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_CAMERAS
CREATE POLICY "Allow all on school_cameras" ON public.school_cameras FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_TEXTBOOKS
CREATE POLICY "Allow all on school_textbooks" ON public.school_textbooks FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_TEXTBOOK_ENTRIES
CREATE POLICY "Allow all on school_textbook_entries" ON public.school_textbook_entries FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_TEXTBOOK_NOTES
CREATE POLICY "Allow all on school_textbook_notes" ON public.school_textbook_notes FOR ALL USING (true) WITH CHECK (true);

-- EXAM_DOCUMENTS
CREATE POLICY "Allow all on exam_documents" ON public.exam_documents FOR ALL USING (true) WITH CHECK (true);

-- EXAM_QUESTIONS
CREATE POLICY "Allow all on exam_questions" ON public.exam_questions FOR ALL USING (true) WITH CHECK (true);

-- EXAM_QUESTION_CHOICES
CREATE POLICY "Allow all on exam_question_choices" ON public.exam_question_choices FOR ALL USING (true) WITH CHECK (true);

-- EXAM_ANSWERS
CREATE POLICY "Allow all on exam_answers" ON public.exam_answers FOR ALL USING (true) WITH CHECK (true);

-- ONLINE_EXAMS
CREATE POLICY "Allow all on online_exams" ON public.online_exams FOR ALL USING (true) WITH CHECK (true);

-- ONLINE_EXAM_QUESTIONS
CREATE POLICY "Allow all on online_exam_questions" ON public.online_exam_questions FOR ALL USING (true) WITH CHECK (true);

-- ONLINE_EXAM_ANSWERS
CREATE POLICY "Allow all on online_exam_answers" ON public.online_exam_answers FOR ALL USING (true) WITH CHECK (true);

-- STUDENT_EXAM_ATTEMPTS
CREATE POLICY "Allow all on student_exam_attempts" ON public.student_exam_attempts FOR ALL USING (true) WITH CHECK (true);

-- STUDENT_EXAM_RESPONSES
CREATE POLICY "Allow all on student_exam_responses" ON public.student_exam_responses FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_ROLES
CREATE POLICY "Allow all on school_roles" ON public.school_roles FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_ROLE_PERMISSIONS
CREATE POLICY "Allow all on school_role_permissions" ON public.school_role_permissions FOR ALL USING (true) WITH CHECK (true);

-- USER_SCHOOL_ROLES
CREATE POLICY "Allow all on user_school_roles" ON public.user_school_roles FOR ALL USING (true) WITH CHECK (true);

-- YEAR_PREPARATIONS
CREATE POLICY "Allow all on year_preparations" ON public.year_preparations FOR ALL USING (true) WITH CHECK (true);

-- CLASS_TRANSITIONS
CREATE POLICY "Allow all on class_transitions" ON public.class_transitions FOR ALL USING (true) WITH CHECK (true);

-- STUDENT_TRANSITIONS
CREATE POLICY "Allow all on student_transitions" ON public.student_transitions FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_FEE_CONFIG
CREATE POLICY "Allow all on school_fee_config" ON public.school_fee_config FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_FEES
CREATE POLICY "Allow all on school_fees" ON public.school_fees FOR ALL USING (true) WITH CHECK (true);

-- SCHOOL_PAYMENTS
CREATE POLICY "Allow all on school_payments" ON public.school_payments FOR ALL USING (true) WITH CHECK (true);

-- TEACHER_SCHOOL
CREATE POLICY "Allow all on teacher_school" ON public.teacher_school FOR ALL USING (true) WITH CHECK (true);

-- NOTIFICATION_PREFERENCES
CREATE POLICY "Allow all on notification_preferences" ON public.notification_preferences FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Full access for all roles (matching Lovable Cloud permissive behavior)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure future tables keep the same privilege model
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO service_role;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================
-- END OF INIT.SQL
-- ============================================================
