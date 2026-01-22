-- ============================================================
-- EDUVATE SCHOOL MANAGEMENT SYSTEM - Production Database Schema
-- Version: 2.0 - Secure RLS with Custom Auth System
-- ============================================================
-- 
-- ARCHITECTURE:
-- - Custom authentication via app_users table (NOT Supabase Auth)
-- - Session tokens stored in app_users.session_token
-- - Roles stored in app_user_roles table
-- - All WRITE operations go through Edge Functions (service_role)
-- - Frontend (anon key) has READ access only
-- 
-- CREDENTIALS:
-- - Edge Functions: Use SUPABASE_SERVICE_ROLE_KEY (bypasses ALL RLS)
-- - Frontend: Uses anon key (subject to RLS policies below)
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
  is_active BOOLEAN NOT NULL DEFAULT true,
  session_token TEXT,
  session_expires_at TIMESTAMPTZ,
  invitation_token TEXT,
  invitation_expires_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. SCHOOL_YEARS
CREATE TABLE public.school_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
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
  duration_years INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. OPTIONS
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
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
  level TEXT,
  capacity INTEGER DEFAULT 30,
  year_level INTEGER DEFAULT 1,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. STUDENTS
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT,
  birth_date DATE,
  address TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  status TEXT DEFAULT 'active',
  enrollment_date DATE DEFAULT CURRENT_DATE,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. STUDENT_SCHOOL (multi-school enrollment)
CREATE TABLE public.student_school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, school_id)
);

-- 13. TEACHERS
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  gender TEXT,
  birth_date DATE,
  address TEXT,
  qualification TEXT,
  salary NUMERIC,
  join_date DATE,
  status TEXT DEFAULT 'active',
  assigned_classes_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. SUBJECTS
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  coefficient NUMERIC DEFAULT 1,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. CLASS_SUBJECTS (linking classes to subjects with teacher)
CREATE TABLE public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  hours_per_week NUMERIC DEFAULT 2,
  coefficient NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- 16. CLASSROOMS
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

-- 17. ASSIGNMENTS (timetable sessions)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
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
  rescheduled_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  rescheduled_at TIMESTAMPTZ,
  absence_notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. CLASSROOM_ASSIGNMENTS
CREATE TABLE public.classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, assignment_id)
);

-- 19. ATTENDANCE
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  check_in_time TIMESTAMPTZ,
  notes TEXT,
  justified BOOLEAN DEFAULT false,
  justification TEXT,
  justified_at TIMESTAMPTZ,
  justified_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. ATTENDANCE_SESSIONS (QR code sessions)
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

-- 21. GRADES
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
  bonus INTEGER DEFAULT 0,
  bonus_reason TEXT,
  bonus_given_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  bonus_given_at TIMESTAMPTZ,
  is_modified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL DEFAULT 'school',
  links TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  attendance_enabled BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. EVENT_ATTENDANCE_SESSIONS
CREATE TABLE public.event_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. EVENT_ATTENDANCE
CREATE TABLE public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.event_attendance_sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_in_method TEXT DEFAULT 'qr_scan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, student_id)
);

-- 25. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all',
  links TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. SCHOOL_NOTIFICATIONS
CREATE TABLE public.school_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. ABSENCE_NOTIFICATIONS_LOG
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

-- 28. DOCUMENT_TEMPLATES
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

-- 29. DOCUMENT_REQUESTS
CREATE TABLE public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 30. ADMINISTRATIVE_DOCUMENT_TYPES
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

-- 31. STUDENT_ADMINISTRATIVE_DOCUMENTS
CREATE TABLE public.student_administrative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.administrative_document_types(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, document_type_id, school_year_id)
);

-- 32. SCHOOL_ADMISSION
CREATE TABLE public.school_admission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  desired_cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  desired_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
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
  status TEXT NOT NULL DEFAULT 'nouveau',
  notes TEXT,
  converted_to_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 33. BULLETIN_SETTINGS
CREATE TABLE public.bulletin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  template_style TEXT DEFAULT 'classic',
  primary_color TEXT DEFAULT '#333333',
  secondary_color TEXT DEFAULT '#666666',
  accent_color TEXT DEFAULT '#0066cc',
  custom_footer_text TEXT,
  show_weighted_average BOOLEAN NOT NULL DEFAULT true,
  show_ranking BOOLEAN NOT NULL DEFAULT true,
  show_mention BOOLEAN NOT NULL DEFAULT true,
  show_decision BOOLEAN NOT NULL DEFAULT true,
  show_observations BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

-- 34. SCHOOL_CAMERAS
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

-- 35. SCHOOL_TEXTBOOKS
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

-- 36. SCHOOL_TEXTBOOK_ENTRIES
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

-- 37. SCHOOL_TEXTBOOK_NOTES
CREATE TABLE public.school_textbook_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  target_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  note_content TEXT NOT NULL,
  is_visible_to_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 38. EXAM_DOCUMENTS
CREATE TABLE public.exam_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  school_semester_id UUID REFERENCES public.school_semester(id) ON DELETE SET NULL,
  exam_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  duration_minutes INTEGER NOT NULL,
  documents_allowed BOOLEAN NOT NULL DEFAULT false,
  answer_on_document BOOLEAN DEFAULT true,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 39. EXAM_QUESTIONS
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

-- 40. EXAM_QUESTION_CHOICES
CREATE TABLE public.exam_question_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  choice_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 41. ONLINE_EXAMS
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

-- 42. ONLINE_EXAM_QUESTIONS
CREATE TABLE public.online_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  points NUMERIC NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 43. ONLINE_EXAM_ANSWERS
CREATE TABLE public.online_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 44. STUDENT_EXAM_ATTEMPTS
CREATE TABLE public.student_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score NUMERIC,
  warning_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- 45. STUDENT_EXAM_RESPONSES
CREATE TABLE public.student_exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES public.online_exam_answers(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- 46. SCHOOL_ROLES (custom role definitions)
CREATE TABLE public.school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 47. SCHOOL_ROLE_PERMISSIONS
CREATE TABLE public.school_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- 48. USER_SCHOOL_ROLES (user-to-custom-role assignments)
CREATE TABLE public.user_school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- 49. YEAR_TRANSITION_PREPARATIONS
CREATE TABLE public.year_transition_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  from_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  to_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 50. CLASS_TRANSITIONS
CREATE TABLE public.class_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES public.year_transition_preparations(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  to_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 51. STUDENT_TRANSITIONS
CREATE TABLE public.student_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES public.year_transition_preparations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  transition_type TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 52. SCHOOL_FEE_CONFIG
CREATE TABLE public.school_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  description TEXT,
  amount_default NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 53. SCHOOL_FEES
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

-- 54. SCHOOL_PAYMENTS
CREATE TABLE public.school_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES public.school_fees(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 55. TEACHER_SCHOOL (multi-school teachers)
CREATE TABLE public.teacher_school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, school_id)
);

-- 56. NOTIFICATION_PREFERENCES
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  absence_notifications BOOLEAN DEFAULT true,
  grade_notifications BOOLEAN DEFAULT true,
  event_notifications BOOLEAN DEFAULT true,
  announcement_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_session_token ON public.app_users(session_token);
CREATE INDEX idx_app_users_school_id ON public.app_users(school_id);
CREATE INDEX idx_app_user_roles_user_id ON public.app_user_roles(user_id);
CREATE INDEX idx_app_user_roles_school_id ON public.app_user_roles(school_id);
CREATE INDEX idx_app_user_roles_role ON public.app_user_roles(role);
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX idx_teachers_email ON public.teachers(email);
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_classes_school_year_id ON public.classes(school_year_id);
CREATE INDEX idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX idx_assignments_school_id ON public.assignments(school_id);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignments_session_date ON public.assignments(session_date);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX idx_events_school_id ON public.events(school_id);
CREATE INDEX idx_subscriptions_school_id ON public.subscriptions(school_id);
CREATE INDEX idx_school_years_school_id ON public.school_years(school_id);
CREATE INDEX idx_school_semester_school_id ON public.school_semester(school_id);

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

-- Check if user has a specific role (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_user_role(
  _user_id UUID,
  _role public.app_role,
  _school_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        (_school_id IS NULL AND school_id IS NULL)
        OR (school_id = _school_id)
        OR (_school_id IS NULL AND role = 'global_admin')
      )
  )
$$;

-- Get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role public.app_role, school_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role, school_id FROM public.app_user_roles WHERE user_id = _user_id
$$;

-- Check if user belongs to a school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(
  _user_id UUID,
  _school_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = _user_id
      AND (school_id = _school_id OR role = 'global_admin')
  )
$$;

-- Check if user is global admin
CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = _user_id AND role = 'global_admin'
  )
$$;

-- Check if user is school admin for a specific school
CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = _user_id
      AND (
        role = 'global_admin'
        OR (role = 'school_admin' AND school_id = _school_id)
      )
  )
$$;

-- Auto transition semesters
CREATE OR REPLACE FUNCTION public.auto_transition_semesters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_semester RECORD;
BEGIN
  FOR v_semester IN
    SELECT s.id, s.school_id
    FROM public.school_semester s
    WHERE s.is_actual = true AND s.end_date < CURRENT_DATE
  LOOP
    UPDATE public.school_semester
    SET is_actual = true, is_next = false
    WHERE school_id = v_semester.school_id
      AND start_date > (SELECT end_date FROM public.school_semester WHERE id = v_semester.id)
      AND id IN (
        SELECT id FROM public.school_semester
        WHERE school_id = v_semester.school_id
          AND start_date > (SELECT end_date FROM public.school_semester WHERE id = v_semester.id)
        ORDER BY start_date ASC LIMIT 1
      );

    UPDATE public.school_semester SET is_actual = false WHERE id = v_semester.id;
  END LOOP;
END;
$$;

-- Generate random password
CREATE OR REPLACE FUNCTION public.generate_random_password(length INTEGER DEFAULT 12)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ============================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_years_updated_at BEFORE UPDATE ON public.school_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_semester_updated_at BEFORE UPDATE ON public.school_semester FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cycles_updated_at BEFORE UPDATE ON public.cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON public.options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
CREATE TRIGGER update_year_transition_preparations_updated_at BEFORE UPDATE ON public.year_transition_preparations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
ALTER TABLE public.exam_question_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_transition_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- 
-- Strategy:
-- 1. service_role (Edge Functions) has FULL access - bypasses RLS automatically
-- 2. anon (Frontend) has READ access to most tables
-- 3. All WRITES must go through Edge Functions
-- 4. Public tables (schools, subscription_plans) are readable by anyone
-- 5. School admission allows public INSERT
-- ============================================================

-- === SCHOOLS ===
CREATE POLICY "schools_anon_read" ON public.schools FOR SELECT TO anon USING (true);
CREATE POLICY "schools_service_all" ON public.schools FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === APP_USERS ===
-- NOTE: We allow SELECT from anon/authenticated on app_users so PostgREST joins work
-- (e.g. schools.owner_id -> app_users). We will protect sensitive fields via
-- column-level privileges (see GRANTS section).
CREATE POLICY "app_users_anon_read" ON public.app_users FOR SELECT TO anon USING (true);
CREATE POLICY "app_users_auth_read" ON public.app_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_users_service_all" ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === APP_USER_ROLES ===
-- NOTE: Some screens may need to read roles. We keep it read-only for anon/authenticated.
CREATE POLICY "app_user_roles_anon_read" ON public.app_user_roles FOR SELECT TO anon USING (true);
CREATE POLICY "app_user_roles_auth_read" ON public.app_user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_user_roles_service_all" ON public.app_user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SUBSCRIPTION_PLANS ===
CREATE POLICY "subscription_plans_anon_read" ON public.subscription_plans FOR SELECT TO anon USING (true);
CREATE POLICY "subscription_plans_service_all" ON public.subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SUBSCRIPTIONS ===
CREATE POLICY "subscriptions_anon_read" ON public.subscriptions FOR SELECT TO anon USING (true);
CREATE POLICY "subscriptions_service_all" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_YEARS ===
CREATE POLICY "school_years_anon_read" ON public.school_years FOR SELECT TO anon USING (true);
CREATE POLICY "school_years_service_all" ON public.school_years FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_SEMESTER ===
CREATE POLICY "school_semester_anon_read" ON public.school_semester FOR SELECT TO anon USING (true);
CREATE POLICY "school_semester_service_all" ON public.school_semester FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === CYCLES ===
CREATE POLICY "cycles_anon_read" ON public.cycles FOR SELECT TO anon USING (true);
CREATE POLICY "cycles_service_all" ON public.cycles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === OPTIONS ===
CREATE POLICY "options_anon_read" ON public.options FOR SELECT TO anon USING (true);
CREATE POLICY "options_service_all" ON public.options FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === CLASSES ===
CREATE POLICY "classes_anon_read" ON public.classes FOR SELECT TO anon USING (true);
CREATE POLICY "classes_service_all" ON public.classes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === STUDENTS ===
CREATE POLICY "students_anon_read" ON public.students FOR SELECT TO anon USING (true);
CREATE POLICY "students_service_all" ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === STUDENT_SCHOOL ===
CREATE POLICY "student_school_anon_read" ON public.student_school FOR SELECT TO anon USING (true);
CREATE POLICY "student_school_service_all" ON public.student_school FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === TEACHERS ===
CREATE POLICY "teachers_anon_read" ON public.teachers FOR SELECT TO anon USING (true);
CREATE POLICY "teachers_service_all" ON public.teachers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SUBJECTS ===
CREATE POLICY "subjects_anon_read" ON public.subjects FOR SELECT TO anon USING (true);
CREATE POLICY "subjects_service_all" ON public.subjects FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === CLASS_SUBJECTS ===
CREATE POLICY "class_subjects_anon_read" ON public.class_subjects FOR SELECT TO anon USING (true);
CREATE POLICY "class_subjects_service_all" ON public.class_subjects FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === CLASSROOMS ===
CREATE POLICY "classrooms_anon_read" ON public.classrooms FOR SELECT TO anon USING (true);
CREATE POLICY "classrooms_service_all" ON public.classrooms FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ASSIGNMENTS ===
CREATE POLICY "assignments_anon_read" ON public.assignments FOR SELECT TO anon USING (true);
CREATE POLICY "assignments_service_all" ON public.assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === CLASSROOM_ASSIGNMENTS ===
CREATE POLICY "classroom_assignments_anon_read" ON public.classroom_assignments FOR SELECT TO anon USING (true);
CREATE POLICY "classroom_assignments_service_all" ON public.classroom_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ATTENDANCE ===
CREATE POLICY "attendance_anon_read" ON public.attendance FOR SELECT TO anon USING (true);
CREATE POLICY "attendance_service_all" ON public.attendance FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ATTENDANCE_SESSIONS ===
CREATE POLICY "attendance_sessions_anon_read" ON public.attendance_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "attendance_sessions_service_all" ON public.attendance_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === GRADES ===
CREATE POLICY "grades_anon_read" ON public.grades FOR SELECT TO anon USING (true);
CREATE POLICY "grades_service_all" ON public.grades FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EVENTS ===
CREATE POLICY "events_anon_read" ON public.events FOR SELECT TO anon USING (true);
CREATE POLICY "events_service_all" ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EVENT_ATTENDANCE_SESSIONS ===
CREATE POLICY "event_attendance_sessions_anon_read" ON public.event_attendance_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "event_attendance_sessions_service_all" ON public.event_attendance_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EVENT_ATTENDANCE ===
CREATE POLICY "event_attendance_anon_read" ON public.event_attendance FOR SELECT TO anon USING (true);
CREATE POLICY "event_attendance_service_all" ON public.event_attendance FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ANNOUNCEMENTS ===
CREATE POLICY "announcements_anon_read" ON public.announcements FOR SELECT TO anon USING (true);
CREATE POLICY "announcements_service_all" ON public.announcements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_NOTIFICATIONS ===
CREATE POLICY "school_notifications_anon_read" ON public.school_notifications FOR SELECT TO anon USING (true);
CREATE POLICY "school_notifications_service_all" ON public.school_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ABSENCE_NOTIFICATIONS_LOG ===
CREATE POLICY "absence_notifications_log_anon_read" ON public.absence_notifications_log FOR SELECT TO anon USING (true);
CREATE POLICY "absence_notifications_log_service_all" ON public.absence_notifications_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === DOCUMENT_TEMPLATES ===
CREATE POLICY "document_templates_anon_read" ON public.document_templates FOR SELECT TO anon USING (true);
CREATE POLICY "document_templates_service_all" ON public.document_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === DOCUMENT_REQUESTS ===
CREATE POLICY "document_requests_anon_read" ON public.document_requests FOR SELECT TO anon USING (true);
CREATE POLICY "document_requests_service_all" ON public.document_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ADMINISTRATIVE_DOCUMENT_TYPES ===
CREATE POLICY "administrative_document_types_anon_read" ON public.administrative_document_types FOR SELECT TO anon USING (true);
CREATE POLICY "administrative_document_types_service_all" ON public.administrative_document_types FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === STUDENT_ADMINISTRATIVE_DOCUMENTS ===
CREATE POLICY "student_administrative_documents_anon_read" ON public.student_administrative_documents FOR SELECT TO anon USING (true);
CREATE POLICY "student_administrative_documents_service_all" ON public.student_administrative_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_ADMISSION (Public can INSERT for admission requests) ===
CREATE POLICY "school_admission_anon_read" ON public.school_admission FOR SELECT TO anon USING (true);
CREATE POLICY "school_admission_anon_insert" ON public.school_admission FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "school_admission_service_all" ON public.school_admission FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === BULLETIN_SETTINGS ===
CREATE POLICY "bulletin_settings_anon_read" ON public.bulletin_settings FOR SELECT TO anon USING (true);
CREATE POLICY "bulletin_settings_service_all" ON public.bulletin_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_CAMERAS ===
CREATE POLICY "school_cameras_anon_read" ON public.school_cameras FOR SELECT TO anon USING (true);
CREATE POLICY "school_cameras_service_all" ON public.school_cameras FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_TEXTBOOKS ===
CREATE POLICY "school_textbooks_anon_read" ON public.school_textbooks FOR SELECT TO anon USING (true);
CREATE POLICY "school_textbooks_service_all" ON public.school_textbooks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_TEXTBOOK_ENTRIES ===
CREATE POLICY "school_textbook_entries_anon_read" ON public.school_textbook_entries FOR SELECT TO anon USING (true);
CREATE POLICY "school_textbook_entries_service_all" ON public.school_textbook_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_TEXTBOOK_NOTES ===
CREATE POLICY "school_textbook_notes_anon_read" ON public.school_textbook_notes FOR SELECT TO anon USING (true);
CREATE POLICY "school_textbook_notes_service_all" ON public.school_textbook_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EXAM_DOCUMENTS ===
CREATE POLICY "exam_documents_anon_read" ON public.exam_documents FOR SELECT TO anon USING (true);
CREATE POLICY "exam_documents_service_all" ON public.exam_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EXAM_QUESTIONS ===
CREATE POLICY "exam_questions_anon_read" ON public.exam_questions FOR SELECT TO anon USING (true);
CREATE POLICY "exam_questions_service_all" ON public.exam_questions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EXAM_QUESTION_CHOICES ===
CREATE POLICY "exam_question_choices_anon_read" ON public.exam_question_choices FOR SELECT TO anon USING (true);
CREATE POLICY "exam_question_choices_service_all" ON public.exam_question_choices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ONLINE_EXAMS ===
CREATE POLICY "online_exams_anon_read" ON public.online_exams FOR SELECT TO anon USING (true);
CREATE POLICY "online_exams_service_all" ON public.online_exams FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ONLINE_EXAM_QUESTIONS ===
CREATE POLICY "online_exam_questions_anon_read" ON public.online_exam_questions FOR SELECT TO anon USING (true);
CREATE POLICY "online_exam_questions_service_all" ON public.online_exam_questions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ONLINE_EXAM_ANSWERS ===
CREATE POLICY "online_exam_answers_anon_read" ON public.online_exam_answers FOR SELECT TO anon USING (true);
CREATE POLICY "online_exam_answers_service_all" ON public.online_exam_answers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === STUDENT_EXAM_ATTEMPTS ===
CREATE POLICY "student_exam_attempts_anon_read" ON public.student_exam_attempts FOR SELECT TO anon USING (true);
CREATE POLICY "student_exam_attempts_service_all" ON public.student_exam_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === STUDENT_EXAM_RESPONSES ===
CREATE POLICY "student_exam_responses_anon_read" ON public.student_exam_responses FOR SELECT TO anon USING (true);
CREATE POLICY "student_exam_responses_service_all" ON public.student_exam_responses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_ROLES ===
CREATE POLICY "school_roles_anon_read" ON public.school_roles FOR SELECT TO anon USING (true);
CREATE POLICY "school_roles_service_all" ON public.school_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_ROLE_PERMISSIONS ===
CREATE POLICY "school_role_permissions_anon_read" ON public.school_role_permissions FOR SELECT TO anon USING (true);
CREATE POLICY "school_role_permissions_service_all" ON public.school_role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === USER_SCHOOL_ROLES ===
CREATE POLICY "user_school_roles_anon_read" ON public.user_school_roles FOR SELECT TO anon USING (true);
CREATE POLICY "user_school_roles_service_all" ON public.user_school_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === YEAR_TRANSITION_PREPARATIONS ===
CREATE POLICY "year_transition_preparations_anon_read" ON public.year_transition_preparations FOR SELECT TO anon USING (true);
CREATE POLICY "year_transition_preparations_service_all" ON public.year_transition_preparations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === CLASS_TRANSITIONS ===
CREATE POLICY "class_transitions_anon_read" ON public.class_transitions FOR SELECT TO anon USING (true);
CREATE POLICY "class_transitions_service_all" ON public.class_transitions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === STUDENT_TRANSITIONS ===
CREATE POLICY "student_transitions_anon_read" ON public.student_transitions FOR SELECT TO anon USING (true);
CREATE POLICY "student_transitions_service_all" ON public.student_transitions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_FEE_CONFIG ===
CREATE POLICY "school_fee_config_anon_read" ON public.school_fee_config FOR SELECT TO anon USING (true);
CREATE POLICY "school_fee_config_service_all" ON public.school_fee_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_FEES ===
CREATE POLICY "school_fees_anon_read" ON public.school_fees FOR SELECT TO anon USING (true);
CREATE POLICY "school_fees_service_all" ON public.school_fees FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SCHOOL_PAYMENTS ===
CREATE POLICY "school_payments_anon_read" ON public.school_payments FOR SELECT TO anon USING (true);
CREATE POLICY "school_payments_service_all" ON public.school_payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === TEACHER_SCHOOL ===
CREATE POLICY "teacher_school_anon_read" ON public.teacher_school FOR SELECT TO anon USING (true);
CREATE POLICY "teacher_school_service_all" ON public.teacher_school FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === NOTIFICATION_PREFERENCES ===
CREATE POLICY "notification_preferences_anon_read" ON public.notification_preferences FOR SELECT TO anon USING (true);
CREATE POLICY "notification_preferences_service_all" ON public.notification_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- PUBLIC VIEW FOR APP_USERS (safe fields only)
-- ============================================================

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

GRANT SELECT ON public.app_users_public TO anon;
GRANT SELECT ON public.app_users_public TO authenticated;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- ============================================================
-- IMPORTANT ABOUT 42501 (permission denied)
-- ============================================================
-- RLS is evaluated *after* standard GRANT privileges.
-- When we DROP/CREATE schema, previous grants are lost.
-- These GRANTs are required so PostgREST can read tables.
-- Write operations are intentionally NOT granted to anon/authenticated
-- because this project uses custom auth and mutations must go through
-- Edge Functions (service_role).

-- Frontend read access (PostgREST)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Backend functions (service_role) full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure future tables keep the same privilege model
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- ============================================================
-- COLUMN-LEVEL SECURITY (prevent leaking sensitive auth fields)
-- ============================================================
-- Even if RLS allows a row, the browser would be able to read every column it has
-- SELECT privilege on. We therefore restrict app_users and other auth-adjacent tables.

-- app_users: remove blanket privileges then allow only safe columns
REVOKE ALL ON TABLE public.app_users FROM anon;
REVOKE ALL ON TABLE public.app_users FROM authenticated;

GRANT SELECT (
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
  last_login,
  created_at,
  updated_at
) ON public.app_users TO anon;

GRANT SELECT (
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
  last_login,
  created_at,
  updated_at
) ON public.app_users TO authenticated;

-- app_user_roles: allow read-only access (no grants for write)
-- If you want to fully hide roles from the browser later, switch UI to rely only
-- on backend functions for role/permission checks and REVOKE this too.
REVOKE ALL ON TABLE public.app_user_roles FROM anon;
REVOKE ALL ON TABLE public.app_user_roles FROM authenticated;

GRANT SELECT (
  id,
  user_id,
  role,
  school_id,
  granted_by,
  created_at
) ON public.app_user_roles TO anon;

GRANT SELECT (
  id,
  user_id,
  role,
  school_id,
  granted_by,
  created_at
) ON public.app_user_roles TO authenticated;

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
