-- ============================================================
-- EDUVATE SCHOOL MANAGEMENT SYSTEM - Incremental Update Script
-- Version: 4.0 - Secure RLS with Role-Based Access Control
-- ============================================================
-- 
-- This script can be run SAFELY on an existing database.
-- It will:
-- - Create missing tables (IF NOT EXISTS)
-- - Add missing columns (ADD COLUMN IF NOT EXISTS)
-- - Create/update enum types safely
-- - Create/update functions, triggers, views
-- - Apply STRICT RLS policies (DROP IF EXISTS + CREATE)
-- 
-- Run this script to update an existing database without losing data.
-- ============================================================

-- ============================================================
-- ENUM TYPES (safe creation)
-- ============================================================

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_plan_type AS ENUM (
    'starter',
    'basic',
    'standard',
    'premium',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status_type AS ENUM (
    'trial',
    'active',
    'expired',
    'cancelled',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_duration_type AS ENUM (
    '1_month',
    '3_months',
    '6_months',
    '1_year',
    '2_years'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add missing enum values if they don't exist
DO $$ BEGIN
  ALTER TYPE public.subscription_duration_type ADD VALUE IF NOT EXISTS '1_month';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.subscription_duration_type ADD VALUE IF NOT EXISTS '3_months';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.subscription_duration_type ADD VALUE IF NOT EXISTS '6_months';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.subscription_duration_type ADD VALUE IF NOT EXISTS '1_year';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.subscription_duration_type ADD VALUE IF NOT EXISTS '2_years';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method_type AS ENUM (
    'bank_transfer',
    'cash',
    'check',
    'card',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES (CREATE IF NOT EXISTS)
-- ============================================================

-- 1. SCHOOLS
CREATE TABLE IF NOT EXISTS public.schools (
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

-- 2. APP_USERS
CREATE TABLE IF NOT EXISTS public.app_users (
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

-- Add FK for schools.owner_id
ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_owner_id_fkey;
ALTER TABLE public.schools ADD CONSTRAINT schools_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 3. APP_USER_ROLES
CREATE TABLE IF NOT EXISTS public.app_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, school_id)
);

-- 4. SUBSCRIPTION_PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
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
CREATE TABLE IF NOT EXISTS public.subscriptions (
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
  UNIQUE (school_id)
);

-- Add missing columns to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_student_limit INTEGER;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_teacher_limit INTEGER;

-- 6. SCHOOL_YEARS
CREATE TABLE IF NOT EXISTS public.school_years (
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
CREATE TABLE IF NOT EXISTS public.school_semester (
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
CREATE TABLE IF NOT EXISTS public.cycles (
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
ALTER TABLE public.cycles ADD COLUMN IF NOT EXISTS calculation_system TEXT NOT NULL DEFAULT 'coefficient';

-- 9. OPTIONS
CREATE TABLE IF NOT EXISTS public.options (
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
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS code TEXT;

-- 10. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
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
CREATE TABLE IF NOT EXISTS public.students (
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
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tutor_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tutor_email TEXT;

-- 12. STUDENT_SCHOOL
CREATE TABLE IF NOT EXISTS public.student_school (
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
ALTER TABLE public.student_school ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ;

-- 13. TEACHERS
CREATE TABLE IF NOT EXISTS public.teachers (
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

-- 14. TEACHER_CLASSES
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);
ALTER TABLE public.teacher_classes DROP CONSTRAINT IF EXISTS fk_teacher_classes_teacher_id;
ALTER TABLE public.teacher_classes ADD CONSTRAINT fk_teacher_classes_teacher_id
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_classes DROP CONSTRAINT IF EXISTS fk_teacher_classes_class_id;
ALTER TABLE public.teacher_classes ADD CONSTRAINT fk_teacher_classes_class_id
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 15. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
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
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_class_id_fkey;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS fk_subjects_school_id;
ALTER TABLE public.subjects ADD CONSTRAINT fk_subjects_school_id
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_teacher_id_fkey;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 16. CLASS_SUBJECTS
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- 17. CLASSROOMS
CREATE TABLE IF NOT EXISTS public.classrooms (
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

-- 18. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
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

-- 19. CLASSROOM_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, assignment_id)
);

-- 20. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
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
  marked_by UUID,
  is_justified BOOLEAN DEFAULT false,
  justification_comment TEXT,
  justification_file_path TEXT,
  justification_submitted_at TIMESTAMPTZ,
  justification_status TEXT DEFAULT 'pending',
  justification_reviewed_at TIMESTAMPTZ,
  justification_reviewed_by UUID,
  justification_rejection_reason TEXT,
  justified BOOLEAN DEFAULT false,
  justification_reason TEXT,
  justified_at TIMESTAMPTZ,
  justified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_justified BOOLEAN DEFAULT false;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_comment TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_file_path TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_submitted_at TIMESTAMPTZ;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_status TEXT DEFAULT 'pending';
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_reviewed_at TIMESTAMPTZ;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_reviewed_by UUID;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS justification_rejection_reason TEXT;

-- Add FK constraints for attendance
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS fk_attendance_class_id;
ALTER TABLE public.attendance ADD CONSTRAINT fk_attendance_class_id
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_assignment_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_assignment_id_fkey
  FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey
  FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Add FK constraint for school_id
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

-- Update existing attendance records to set school_id from classes
UPDATE public.attendance a
SET school_id = c.school_id
FROM public.classes c
WHERE a.class_id = c.id AND a.school_id IS NULL;

-- Create trigger function to auto-fill school_id from class
CREATE OR REPLACE FUNCTION public.set_attendance_school_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.school_id IS NULL AND NEW.class_id IS NOT NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.classes WHERE id = NEW.class_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-fill school_id
DROP TRIGGER IF EXISTS trigger_set_attendance_school_id ON public.attendance;
CREATE TRIGGER trigger_set_attendance_school_id
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_school_id();

-- 21. ATTENDANCE_SESSIONS
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
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
CREATE TABLE IF NOT EXISTS public.grades (
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
  bonus_given_by UUID,
  bonus_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
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
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT false;

-- 24. EVENT_ATTENDANCE_SESSIONS
CREATE TABLE IF NOT EXISTS public.event_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_attendance_sessions ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE public.event_attendance_sessions DROP CONSTRAINT IF EXISTS event_attendance_sessions_event_id_fkey;
ALTER TABLE public.event_attendance_sessions ADD CONSTRAINT event_attendance_sessions_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.event_attendance_sessions DROP CONSTRAINT IF EXISTS event_attendance_sessions_school_id_fkey;
ALTER TABLE public.event_attendance_sessions ADD CONSTRAINT event_attendance_sessions_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

-- 25. EVENT_ATTENDANCE
CREATE TABLE IF NOT EXISTS public.event_attendance (
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
ALTER TABLE public.event_attendance ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE public.event_attendance ADD COLUMN IF NOT EXISTS marked_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.event_attendance ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'qr_scan';
ALTER TABLE public.event_attendance ADD COLUMN IF NOT EXISTS participant_name TEXT;
ALTER TABLE public.event_attendance DROP CONSTRAINT IF EXISTS event_attendance_event_id_fkey;
ALTER TABLE public.event_attendance ADD CONSTRAINT event_attendance_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.event_attendance DROP CONSTRAINT IF EXISTS event_attendance_session_id_fkey;
ALTER TABLE public.event_attendance ADD CONSTRAINT event_attendance_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.event_attendance_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.event_attendance DROP CONSTRAINT IF EXISTS event_attendance_school_id_fkey;
ALTER TABLE public.event_attendance ADD CONSTRAINT event_attendance_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.event_attendance DROP CONSTRAINT IF EXISTS event_attendance_student_id_fkey;
ALTER TABLE public.event_attendance ADD CONSTRAINT event_attendance_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- 26. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
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
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. SCHOOL_NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.school_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 28. ABSENCE_NOTIFICATIONS_LOG
CREATE TABLE IF NOT EXISTS public.absence_notifications_log (
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
CREATE TABLE IF NOT EXISTS public.document_templates (
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
CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_reason TEXT,
  notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 30b. DOCUMENT_REQUEST_TRACKING
CREATE TABLE IF NOT EXISTS public.document_request_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 31. ADMINISTRATIVE_DOCUMENT_TYPES
CREATE TABLE IF NOT EXISTS public.administrative_document_types (
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
CREATE TABLE IF NOT EXISTS public.student_administrative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.administrative_document_types(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, document_type_id, school_year_id)
);

-- 33. SCHOOL_ADMISSION
CREATE TABLE IF NOT EXISTS public.school_admission (
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
CREATE TABLE IF NOT EXISTS public.bulletin_settings (
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
CREATE TABLE IF NOT EXISTS public.school_cameras (
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
CREATE TABLE IF NOT EXISTS public.school_textbooks (
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
CREATE TABLE IF NOT EXISTS public.school_textbook_entries (
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
CREATE TABLE IF NOT EXISTS public.school_textbook_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by UUID,
  target_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  is_visible_to_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 39. EXAM_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.exam_documents (
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
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 40. EXAM_QUESTIONS
CREATE TABLE IF NOT EXISTS public.exam_questions (
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
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 42. EXAM_QUESTION_CHOICES
CREATE TABLE IF NOT EXISTS public.exam_question_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 43. ONLINE_EXAMS
CREATE TABLE IF NOT EXISTS public.online_exams (
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

-- 44. ONLINE_EXAM_QUESTIONS
CREATE TABLE IF NOT EXISTS public.online_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  points NUMERIC NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Add/rename column for question_order
ALTER TABLE public.online_exam_questions ADD COLUMN IF NOT EXISTS question_order INTEGER NOT NULL DEFAULT 0;

-- 45. ONLINE_EXAM_ANSWERS
CREATE TABLE IF NOT EXISTS public.online_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 46. STUDENT_EXAM_ATTEMPTS
CREATE TABLE IF NOT EXISTS public.student_exam_attempts (
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

-- 47. STUDENT_EXAM_RESPONSES
CREATE TABLE IF NOT EXISTS public.student_exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES public.online_exam_answers(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 48. SCHOOL_ROLES
CREATE TABLE IF NOT EXISTS public.school_roles (
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
ALTER TABLE public.school_roles ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'blue';
ALTER TABLE public.school_roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- 49. SCHOOL_ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.school_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- 50. USER_SCHOOL_ROLES
CREATE TABLE IF NOT EXISTS public.user_school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  school_role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_role_id)
);

-- 51. YEAR_PREPARATIONS
CREATE TABLE IF NOT EXISTS public.year_preparations (
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

-- 52. CLASS_TRANSITIONS
CREATE TABLE IF NOT EXISTS public.class_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  to_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 53. STUDENT_TRANSITIONS
CREATE TABLE IF NOT EXISTS public.student_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  transition_type TEXT NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 54. SCHOOL_FEE_CONFIG
CREATE TABLE IF NOT EXISTS public.school_fee_config (
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

-- 55. SCHOOL_FEES
CREATE TABLE IF NOT EXISTS public.school_fees (
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

-- 56. SCHOOL_PAYMENTS
CREATE TABLE IF NOT EXISTS public.school_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES public.school_fees(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  method TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 57. TEACHER_SCHOOL
CREATE TABLE IF NOT EXISTS public.teacher_school (
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

-- 58. NOTIFICATION_PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (
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

-- NOTE: app_users_public is (re)created later in this file as a secure, non-PII view.
-- Keeping only one definition avoids Postgres errors when OR REPLACE would imply renaming columns.

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_session_token ON public.app_users(session_token);
CREATE INDEX IF NOT EXISTS idx_app_users_school_id ON public.app_users(school_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_user_id ON public.app_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_role ON public.app_user_roles(role);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_school_id ON public.app_user_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON public.assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_session_date ON public.assignments(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_school_year_id ON public.grades(school_year_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_id ON public.subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_years_school_id ON public.school_years(school_id);
CREATE INDEX IF NOT EXISTS idx_school_semester_school_id ON public.school_semester(school_id);
CREATE INDEX IF NOT EXISTS idx_student_school_lookup ON public.student_school(student_id, school_year_id, school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_sessions_event_id ON public.event_attendance_sessions(event_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role public.app_role, school_id UUID) AS $$
  SELECT role, school_id FROM app_user_roles WHERE user_id = _user_id
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_belongs_to_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = _user_id AND school_id = _school_id
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = _user_id AND role = 'global_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = _user_id AND school_id = _school_id AND role = 'school_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

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

  UPDATE school_semester
  SET is_actual = false,
      is_next = false
  WHERE school_id = v_school_id;

  UPDATE school_semester
  SET is_actual = true,
      is_next = false
  WHERE id = semester_id;
END;
$$;

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
    'basic',
    'trial',
    '1_month',
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '30 days')::date,
    true,
    (CURRENT_DATE + INTERVAL '30 days')::date
  )
  ON CONFLICT (school_id) DO NOTHING;

  RETURN NEW;
END;
$$;

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

-- Grant execute on RPC functions
GRANT EXECUTE ON FUNCTION public.set_current_semester(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_transition_semesters() TO anon, authenticated;

-- ============================================================
-- TRIGGERS (DROP IF EXISTS + CREATE)
-- ============================================================

DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS create_default_subscription_after_school_insert ON public.schools;
CREATE TRIGGER create_default_subscription_after_school_insert
AFTER INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.create_default_subscription_for_school();

DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_years_updated_at ON public.school_years;
CREATE TRIGGER update_school_years_updated_at BEFORE UPDATE ON public.school_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_semester_updated_at ON public.school_semester;
CREATE TRIGGER update_school_semester_updated_at BEFORE UPDATE ON public.school_semester FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cycles_updated_at ON public.cycles;
CREATE TRIGGER update_cycles_updated_at BEFORE UPDATE ON public.cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_options_updated_at ON public.options;
CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON public.options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_school_updated_at ON public.student_school;
CREATE TRIGGER update_student_school_updated_at BEFORE UPDATE ON public.student_school FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classrooms_updated_at ON public.classrooms;
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classroom_assignments_updated_at ON public.classroom_assignments;
CREATE TRIGGER update_classroom_assignments_updated_at BEFORE UPDATE ON public.classroom_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_sessions_updated_at ON public.attendance_sessions;
CREATE TRIGGER update_attendance_sessions_updated_at BEFORE UPDATE ON public.attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_attendance_sessions_updated_at ON public.event_attendance_sessions;
CREATE TRIGGER update_event_attendance_sessions_updated_at BEFORE UPDATE ON public.event_attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_requests_updated_at ON public.document_requests;
CREATE TRIGGER update_document_requests_updated_at BEFORE UPDATE ON public.document_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_administrative_document_types_updated_at ON public.administrative_document_types;
CREATE TRIGGER update_administrative_document_types_updated_at BEFORE UPDATE ON public.administrative_document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_administrative_documents_updated_at ON public.student_administrative_documents;
CREATE TRIGGER update_student_administrative_documents_updated_at BEFORE UPDATE ON public.student_administrative_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_admission_updated_at ON public.school_admission;
CREATE TRIGGER update_school_admission_updated_at BEFORE UPDATE ON public.school_admission FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bulletin_settings_updated_at ON public.bulletin_settings;
CREATE TRIGGER update_bulletin_settings_updated_at BEFORE UPDATE ON public.bulletin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_cameras_updated_at ON public.school_cameras;
CREATE TRIGGER update_school_cameras_updated_at BEFORE UPDATE ON public.school_cameras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_textbooks_updated_at ON public.school_textbooks;
CREATE TRIGGER update_school_textbooks_updated_at BEFORE UPDATE ON public.school_textbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_textbook_entries_updated_at ON public.school_textbook_entries;
CREATE TRIGGER update_school_textbook_entries_updated_at BEFORE UPDATE ON public.school_textbook_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_textbook_notes_updated_at ON public.school_textbook_notes;
CREATE TRIGGER update_school_textbook_notes_updated_at BEFORE UPDATE ON public.school_textbook_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_documents_updated_at ON public.exam_documents;
CREATE TRIGGER update_exam_documents_updated_at BEFORE UPDATE ON public.exam_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_questions_updated_at ON public.exam_questions;
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON public.exam_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_online_exams_updated_at ON public.online_exams;
CREATE TRIGGER update_online_exams_updated_at BEFORE UPDATE ON public.online_exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_roles_updated_at ON public.school_roles;
CREATE TRIGGER update_school_roles_updated_at BEFORE UPDATE ON public.school_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_year_preparations_updated_at ON public.year_preparations;
CREATE TRIGGER update_year_preparations_updated_at BEFORE UPDATE ON public.year_preparations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_fee_config_updated_at ON public.school_fee_config;
CREATE TRIGGER update_school_fee_config_updated_at BEFORE UPDATE ON public.school_fee_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_fees_updated_at ON public.school_fees;
CREATE TRIGGER update_school_fees_updated_at BEFORE UPDATE ON public.school_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
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
-- RLS POLICIES - STRICT SECURITY (Production-Ready)
-- ============================================================

-- Drop all existing permissive policies
DO $$ 
DECLARE
  tables TEXT[] := ARRAY[
    'schools', 'app_users', 'app_user_roles', 'subscription_plans', 'subscriptions',
    'school_years', 'school_semester', 'cycles', 'options', 'classes', 'students',
    'student_school', 'teachers', 'teacher_classes', 'subjects', 'class_subjects',
    'classrooms', 'assignments', 'classroom_assignments', 'attendance', 'attendance_sessions',
    'grades', 'events', 'event_attendance_sessions', 'event_attendance', 'announcements',
    'school_notifications', 'absence_notifications_log', 'document_templates', 'document_requests',
    'document_request_tracking', 'administrative_document_types', 'student_administrative_documents',
    'school_admission', 'bulletin_settings', 'school_cameras', 'school_textbooks',
    'school_textbook_entries', 'school_textbook_notes', 'exam_documents', 'exam_questions',
    'exam_question_choices', 'exam_answers', 'online_exams', 'online_exam_questions',
    'online_exam_answers', 'student_exam_attempts', 'student_exam_responses', 'school_roles',
    'school_role_permissions', 'user_school_roles', 'year_preparations', 'class_transitions',
    'student_transitions', 'school_fee_config', 'school_fees', 'school_payments',
    'teacher_school', 'notification_preferences'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all on %s" ON public.%s', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%s', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_no_direct_access" ON public.%s', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_no_direct_access" ON public.%s', t);
  END LOOP;
END $$;

-- ============================================================
-- SECURITY HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_app_role(_user_id UUID, _role public.app_role, _school_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = _user_id AND role = _role
    AND (role = 'global_admin' OR _school_id IS NULL OR school_id = _school_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_app_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_user_roles WHERE user_id = _user_id AND role = 'global_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_app_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles 
    WHERE user_id = _user_id AND (role = 'global_admin' OR (role = 'school_admin' AND school_id = _school_id))
  )
$$;

CREATE OR REPLACE FUNCTION public.user_in_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles WHERE user_id = _user_id AND (role = 'global_admin' OR school_id = _school_id)
  )
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_app_role(UUID, public.app_role, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_app_global_admin(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_app_school_admin(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_in_school(UUID, UUID) TO anon, authenticated, service_role;

-- ============================================================
-- SECURE PUBLIC VIEW
-- ============================================================
-- This view hides sensitive PII (email, phone, password_hash, tokens)
-- Only authenticated users can access it

DROP VIEW IF EXISTS public.app_users_public CASCADE;

CREATE VIEW public.app_users_public 
WITH (security_invoker = on) AS 
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  school_id,
  is_active,
  teacher_id,
  student_id,
  created_at
FROM public.app_users;

-- IMPORTANT: No anon access to prevent PII exposure
REVOKE ALL ON public.app_users_public FROM anon, authenticated;
GRANT SELECT ON public.app_users_public TO authenticated, service_role;

-- ============================================================
-- APPLY STRICT RLS POLICIES
-- ============================================================

-- APP_USERS (protect password hashes - drop all permissive policies first)
DROP POLICY IF EXISTS "Anon access for edge functions" ON public.app_users;
DROP POLICY IF EXISTS "Allow all" ON public.app_users;
DROP POLICY IF EXISTS "Allow all access" ON public.app_users;
DROP POLICY IF EXISTS "Public read access" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own" ON public.app_users;

DROP POLICY IF EXISTS "service_role_full_access" ON public.app_users;
CREATE POLICY "service_role_full_access" ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_no_direct_access" ON public.app_users;
CREATE POLICY "anon_no_direct_access" ON public.app_users FOR SELECT TO anon USING (false);
DROP POLICY IF EXISTS "authenticated_no_direct_access" ON public.app_users;
CREATE POLICY "authenticated_no_direct_access" ON public.app_users FOR SELECT TO authenticated USING (false);

-- APP_USER_ROLES
DROP POLICY IF EXISTS "service_role_manage_roles" ON public.app_user_roles;
CREATE POLICY "service_role_manage_roles" ON public.app_user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_read_roles" ON public.app_user_roles;
CREATE POLICY "anon_read_roles" ON public.app_user_roles FOR SELECT TO anon, authenticated USING (true);

-- GRADES (role-based)
DROP POLICY IF EXISTS "service_role_grades" ON public.grades;
CREATE POLICY "service_role_grades" ON public.grades FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "teachers_manage_own_grades" ON public.grades;
CREATE POLICY "teachers_manage_own_grades" ON public.grades FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = grades.subject_id AND s.teacher_id = grades.teacher_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = grades.subject_id AND s.teacher_id = grades.teacher_id));
DROP POLICY IF EXISTS "students_view_own_grades" ON public.grades;
CREATE POLICY "students_view_own_grades" ON public.grades FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users u WHERE u.student_id = grades.student_id AND u.is_active = true));
DROP POLICY IF EXISTS "admins_view_school_grades" ON public.grades;
CREATE POLICY "admins_view_school_grades" ON public.grades FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.app_user_roles r JOIN public.subjects s ON s.id = grades.subject_id JOIN public.classes c ON c.id = s.class_id
    WHERE r.role IN ('global_admin', 'school_admin') AND (r.role = 'global_admin' OR r.school_id = c.school_id)
  ));

-- STUDENTS (school-isolated)
DROP POLICY IF EXISTS "service_role_students" ON public.students;
CREATE POLICY "service_role_students" ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "school_staff_view_students" ON public.students;
CREATE POLICY "school_staff_view_students" ON public.students FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.student_school ss JOIN public.app_user_roles r ON r.school_id = ss.school_id WHERE ss.student_id = students.id AND r.role IN ('global_admin', 'school_admin', 'school_staff', 'teacher'))
    OR EXISTS (SELECT 1 FROM public.app_users u WHERE u.student_id = students.id AND u.is_active = true)
  );
DROP POLICY IF EXISTS "admins_manage_students" ON public.students;
CREATE POLICY "admins_manage_students" ON public.students FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.student_school ss JOIN public.app_user_roles r ON r.school_id = ss.school_id WHERE ss.student_id = students.id AND r.role IN ('global_admin', 'school_admin')))
  WITH CHECK (true);

-- TEACHERS (school-isolated)
DROP POLICY IF EXISTS "service_role_teachers" ON public.teachers;
CREATE POLICY "service_role_teachers" ON public.teachers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "school_staff_view_teachers" ON public.teachers;
CREATE POLICY "school_staff_view_teachers" ON public.teachers FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = teachers.school_id AND r.role IN ('global_admin', 'school_admin', 'school_staff', 'teacher', 'student'))
    OR EXISTS (SELECT 1 FROM public.app_users u WHERE u.teacher_id = teachers.id AND u.is_active = true)
  );
DROP POLICY IF EXISTS "admins_manage_teachers" ON public.teachers;
CREATE POLICY "admins_manage_teachers" ON public.teachers FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = teachers.school_id AND r.role IN ('global_admin', 'school_admin')))
  WITH CHECK (true);

-- EXAM_ANSWERS (teachers only - protect correct answers)
DROP POLICY IF EXISTS "service_role_exam_answers" ON public.exam_answers;
CREATE POLICY "service_role_exam_answers" ON public.exam_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "teachers_only_exam_answers" ON public.exam_answers;
CREATE POLICY "teachers_only_exam_answers" ON public.exam_answers FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher')))
  WITH CHECK (true);

-- ONLINE_EXAM_ANSWERS (teachers only)
DROP POLICY IF EXISTS "service_role_online_exam_answers" ON public.online_exam_answers;
CREATE POLICY "service_role_online_exam_answers" ON public.online_exam_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "teachers_only_online_answers" ON public.online_exam_answers;
CREATE POLICY "teachers_only_online_answers" ON public.online_exam_answers FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher')))
  WITH CHECK (true);

-- SCHOOL_CAMERAS (admin-only for security)
DROP POLICY IF EXISTS "service_role_school_cameras" ON public.school_cameras;
CREATE POLICY "service_role_school_cameras" ON public.school_cameras FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admins_only_cameras" ON public.school_cameras;
CREATE POLICY "admins_only_cameras" ON public.school_cameras FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = school_cameras.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "service_role_subscriptions" ON public.subscriptions;
CREATE POLICY "service_role_subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "global_admin_subscriptions" ON public.subscriptions;
CREATE POLICY "global_admin_subscriptions" ON public.subscriptions FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin'))
  WITH CHECK (true);
DROP POLICY IF EXISTS "school_admin_view_subscription" ON public.subscriptions;
CREATE POLICY "school_admin_view_subscription" ON public.subscriptions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'school_admin' AND r.school_id = subscriptions.school_id));

-- SCHOOL_FEES
DROP POLICY IF EXISTS "service_role_school_fees" ON public.school_fees;
CREATE POLICY "service_role_school_fees" ON public.school_fees FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admins_manage_fees" ON public.school_fees;
CREATE POLICY "admins_manage_fees" ON public.school_fees FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_fees.school_id AND r.role IN ('global_admin', 'school_admin', 'accountant')))
  WITH CHECK (true);
DROP POLICY IF EXISTS "students_view_own_fees" ON public.school_fees;
CREATE POLICY "students_view_own_fees" ON public.school_fees FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users u WHERE u.student_id = school_fees.student_id AND u.is_active = true));

-- SCHOOL_ADMISSION (SECURE: public insert, admin-only read - no data harvesting)
DROP POLICY IF EXISTS "service_role_school_admission" ON public.school_admission;
CREATE POLICY "service_role_school_admission" ON public.school_admission FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Drop old permissive policies
DROP POLICY IF EXISTS "school_members_view_admissions" ON public.school_admission;
DROP POLICY IF EXISTS "public_insert_admissions" ON public.school_admission;
DROP POLICY IF EXISTS "admins_manage_admissions" ON public.school_admission;
DROP POLICY IF EXISTS "Allow all" ON public.school_admission;
DROP POLICY IF EXISTS "Allow all access" ON public.school_admission;
DROP POLICY IF EXISTS "Public read access" ON public.school_admission;

-- Allow public INSERT for admission form submissions
DROP POLICY IF EXISTS "public_can_submit_admission" ON public.school_admission;
CREATE POLICY "public_can_submit_admission" ON public.school_admission
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only school admins and global admins can SELECT (no anon read!)
DROP POLICY IF EXISTS "admins_can_read_admissions" ON public.school_admission;
CREATE POLICY "admins_can_read_admissions" ON public.school_admission
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin')
    OR EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('school_admin', 'admission') AND r.school_id = school_admission.school_id)
  );

-- Only admins can UPDATE
DROP POLICY IF EXISTS "admins_can_update_admissions" ON public.school_admission;
CREATE POLICY "admins_can_update_admissions" ON public.school_admission
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin')
    OR EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('school_admin', 'admission') AND r.school_id = school_admission.school_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin')
    OR EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('school_admin', 'admission') AND r.school_id = school_admission.school_id)
  );

-- Only admins can DELETE
DROP POLICY IF EXISTS "admins_can_delete_admissions" ON public.school_admission;
CREATE POLICY "admins_can_delete_admissions" ON public.school_admission
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin')
    OR EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('school_admin', 'admission') AND r.school_id = school_admission.school_id)
  );

-- ============================================================
-- School-isolated tables: Apply standard pattern
-- ============================================================

-- Helper function to apply school-isolated policies
DO $$
DECLARE
  school_tables TEXT[] := ARRAY[
    'schools', 'subscription_plans', 'school_years', 'school_semester', 'cycles', 
    'options', 'classes', 'student_school', 'teacher_classes', 'subjects', 'class_subjects',
    'classrooms', 'assignments', 'classroom_assignments', 'attendance_sessions', 'attendance',
    'events', 'event_attendance_sessions', 'event_attendance', 'announcements', 'school_notifications',
    'absence_notifications_log', 'document_templates', 'document_requests', 'document_request_tracking',
    'administrative_document_types', 'student_administrative_documents',
    'bulletin_settings', 'school_textbooks', 'school_textbook_entries', 'school_textbook_notes',
    'exam_documents', 'exam_questions', 'exam_question_choices', 'online_exams', 'online_exam_questions',
    'student_exam_attempts', 'student_exam_responses', 'school_roles', 'school_role_permissions',
    'user_school_roles', 'year_preparations', 'class_transitions', 'student_transitions',
    'school_fee_config', 'school_payments', 'teacher_school', 'notification_preferences'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY school_tables LOOP
    -- Service role full access
    EXECUTE format('DROP POLICY IF EXISTS "service_role_%s" ON public.%s', t, t);
    EXECUTE format('CREATE POLICY "service_role_%s" ON public.%s FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================
-- END OF UPDATE.SQL
-- ============================================================
