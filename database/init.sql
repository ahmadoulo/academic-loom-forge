-- =============================================================================
-- EDUVATE SCHOOL MANAGEMENT SYSTEM - Complete Database Schema
-- Version: 2.0.0 | Last Updated: 2026-01-19 | Tables: 56
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('global_admin','school_admin','teacher','student','parent','admission','accountant','secretary','school_staff'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_plan_type AS ENUM ('basic','standard','premium'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status_type AS ENUM ('trial','active','expired','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_duration_type AS ENUM ('1_month','3_months','6_months','1_year','2_years'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method_type AS ENUM ('cash','bank_transfer','check','card','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- BASE TABLES
CREATE TABLE IF NOT EXISTS public.school_years (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, is_current BOOLEAN DEFAULT false, is_next BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.schools (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, identifier TEXT NOT NULL UNIQUE, phone TEXT, address TEXT, logo_url TEXT, academic_year TEXT DEFAULT '2024-2025', city TEXT, country TEXT DEFAULT 'Maroc', website TEXT, currency TEXT DEFAULT 'MAD' NOT NULL, owner_id UUID, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.subscription_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, type subscription_plan_type NOT NULL, description TEXT, features TEXT[], student_limit INTEGER, teacher_limit INTEGER, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.cycles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL, name TEXT NOT NULL, description TEXT, level TEXT, duration_years INTEGER, calculation_system TEXT DEFAULT 'average' NOT NULL, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.options (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL, cycle_id UUID NOT NULL, name TEXT NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.teachers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL, firstname TEXT NOT NULL, lastname TEXT NOT NULL, email TEXT, gender TEXT, mobile TEXT, qualification TEXT, address TEXT, status TEXT DEFAULT 'active', birth_date DATE, salary NUMERIC, join_date DATE, assigned_classes_count INTEGER DEFAULT 0, archived BOOLEAN DEFAULT false, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL, firstname TEXT NOT NULL, lastname TEXT NOT NULL, email TEXT, gender TEXT, date_of_birth DATE, place_of_birth TEXT, nationality TEXT, address TEXT, city TEXT, phone TEXT, tutor1_name TEXT, tutor1_phone TEXT, tutor1_email TEXT, tutor2_name TEXT, tutor2_phone TEXT, tutor2_email TEXT, status TEXT DEFAULT 'active', archived BOOLEAN DEFAULT false, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.classrooms (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL, name TEXT NOT NULL, building TEXT, floor TEXT, capacity INTEGER DEFAULT 30 NOT NULL, equipment TEXT[], is_active BOOLEAN DEFAULT true NOT NULL, archived BOOLEAN DEFAULT false, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL, name TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.app_users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT, avatar_url TEXT, password_hash TEXT, school_id UUID, teacher_id UUID, student_id UUID, is_active BOOLEAN DEFAULT false NOT NULL, email_verified BOOLEAN DEFAULT false NOT NULL, invitation_token TEXT, invitation_expires_at TIMESTAMPTZ, session_token TEXT, session_expires_at TIMESTAMPTZ, last_login TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);

-- FK TABLES
CREATE TABLE IF NOT EXISTS public.subscriptions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, plan_type subscription_plan_type NOT NULL, status subscription_status_type DEFAULT 'trial' NOT NULL, duration subscription_duration_type NOT NULL, start_date DATE DEFAULT CURRENT_DATE NOT NULL, end_date DATE NOT NULL, amount NUMERIC, currency TEXT DEFAULT 'MAD' NOT NULL, payment_method payment_method_type, transaction_id TEXT, notes TEXT, is_trial BOOLEAN DEFAULT false NOT NULL, trial_end_date DATE, auto_renew BOOLEAN DEFAULT false NOT NULL, custom_student_limit INTEGER, custom_teacher_limit INTEGER, created_by UUID, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_semester (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, is_actual BOOLEAN DEFAULT false, is_next BOOLEAN DEFAULT false, archived BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.classes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, cycle_id UUID REFERENCES public.cycles(id), option_id UUID REFERENCES public.options(id), name TEXT NOT NULL, year_level INTEGER, is_specialization BOOLEAN DEFAULT false, archived BOOLEAN DEFAULT false, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.subjects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, teacher_id UUID REFERENCES public.teachers(id), class_id UUID REFERENCES public.classes(id), name TEXT NOT NULL, code TEXT, coefficient NUMERIC DEFAULT 1, description TEXT, color TEXT, archived BOOLEAN DEFAULT false, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.app_user_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE, role app_role NOT NULL, school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE, granted_by UUID REFERENCES public.app_users(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(user_id, role, school_id));
CREATE TABLE IF NOT EXISTS public.user_school_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, school_role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, school_id, school_role_id));
CREATE TABLE IF NOT EXISTS public.school_role_permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE, permission_key TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.teacher_classes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(teacher_id, class_id, school_year_id));
CREATE TABLE IF NOT EXISTS public.class_subjects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.student_school (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, class_id UUID REFERENCES public.classes(id), school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, enrollment_date DATE DEFAULT CURRENT_DATE, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(student_id, school_id, school_year_id));
CREATE TABLE IF NOT EXISTS public.assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, subject_id UUID REFERENCES public.subjects(id), parent_assignment_id UUID REFERENCES public.assignments(id), title TEXT NOT NULL, description TEXT, type TEXT DEFAULT 'course' NOT NULL, session_date DATE, start_time TIME, end_time TIME, due_date DATE, is_recurring BOOLEAN DEFAULT false, recurrence_pattern TEXT, recurrence_day INTEGER, recurrence_end_date DATE, is_rescheduled BOOLEAN DEFAULT false, original_session_date DATE, proposed_new_date DATE, reschedule_reason TEXT, reschedule_status TEXT, rescheduled_by UUID, rescheduled_at TIMESTAMPTZ, absence_notification_sent BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.classroom_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE, assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.attendance (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, subject_id UUID REFERENCES public.subjects(id), assignment_id UUID REFERENCES public.assignments(id), date DATE DEFAULT CURRENT_DATE NOT NULL, status TEXT DEFAULT 'present' NOT NULL, method TEXT DEFAULT 'manual' NOT NULL, marked_at TIMESTAMPTZ, is_justified BOOLEAN DEFAULT false, justification_status TEXT, justification_comment TEXT, justification_file_path TEXT, justification_submitted_at TIMESTAMPTZ, justification_reviewed_by UUID, justification_reviewed_at TIMESTAMPTZ, justification_rejection_reason TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.attendance_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, session_code TEXT NOT NULL UNIQUE, date DATE DEFAULT CURRENT_DATE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.grades (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, school_semester_id UUID REFERENCES public.school_semester(id), grade NUMERIC NOT NULL, grade_type TEXT DEFAULT 'controle' NOT NULL, comment TEXT, exam_date DATE, is_modified BOOLEAN DEFAULT false, bonus INTEGER DEFAULT 0, bonus_reason TEXT, bonus_given_by UUID, bonus_given_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.announcements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE, class_id UUID REFERENCES public.classes(id), created_by UUID, title TEXT NOT NULL, body TEXT NOT NULL, visibility TEXT DEFAULT 'all' NOT NULL, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, pinned BOOLEAN DEFAULT false NOT NULL, links TEXT[] DEFAULT '{}', attachments TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE, class_id UUID REFERENCES public.classes(id), subject_id UUID REFERENCES public.subjects(id), created_by UUID, title TEXT NOT NULL, description TEXT, location TEXT, scope TEXT DEFAULT 'school' NOT NULL, start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL, published BOOLEAN DEFAULT true NOT NULL, attendance_enabled BOOLEAN DEFAULT false NOT NULL, links TEXT[] DEFAULT '{}', attachments TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.event_attendance_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, session_code TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.event_attendance (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, session_id UUID NOT NULL REFERENCES public.event_attendance_sessions(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, student_id UUID REFERENCES public.students(id), participant_name TEXT NOT NULL, participant_email TEXT, participant_phone TEXT, method TEXT DEFAULT 'qr_scan' NOT NULL, marked_at TIMESTAMPTZ DEFAULT now() NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.absence_notifications_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE, student_id UUID REFERENCES public.students(id), school_id UUID REFERENCES public.schools(id), session_date DATE NOT NULL, sent_at TIMESTAMPTZ DEFAULT now() NOT NULL, sent_count INTEGER DEFAULT 0 NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(assignment_id, session_date, student_id));
CREATE TABLE IF NOT EXISTS public.school_notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, class_id UUID REFERENCES public.classes(id), sent_by UUID REFERENCES public.app_users(id), recipient_type TEXT NOT NULL, recipient_email TEXT NOT NULL, recipient_name TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT now() NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_admission (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, desired_cycle_id UUID NOT NULL REFERENCES public.cycles(id), desired_option_id UUID REFERENCES public.options(id), civility TEXT NOT NULL, firstname TEXT NOT NULL, lastname TEXT NOT NULL, nationality TEXT NOT NULL, city TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, education_level TEXT NOT NULL, last_institution TEXT NOT NULL, last_institution_type TEXT NOT NULL, status TEXT DEFAULT 'nouveau' NOT NULL, notes TEXT, converted_to_student_id UUID REFERENCES public.students(id), converted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.document_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, name TEXT NOT NULL, type TEXT NOT NULL, content TEXT NOT NULL, header_style TEXT DEFAULT 'modern', footer_color TEXT DEFAULT '#1e40af', footer_content TEXT, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.document_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, document_type TEXT NOT NULL, reason TEXT, status TEXT DEFAULT 'pending' NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.document_request_tracking (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), request_id UUID NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE, student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, status TEXT NOT NULL, comment TEXT, updated_by UUID, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.administrative_document_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, year_level INTEGER, is_required BOOLEAN DEFAULT true NOT NULL, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.student_administrative_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, document_type_id UUID NOT NULL REFERENCES public.administrative_document_types(id) ON DELETE CASCADE, status TEXT DEFAULT 'pending' NOT NULL, file_path TEXT, notes TEXT, submitted_at TIMESTAMPTZ, verified_at TIMESTAMPTZ, verified_by UUID, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(student_id, document_type_id));
CREATE TABLE IF NOT EXISTS public.bulletin_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE, template_style TEXT DEFAULT 'classic', primary_color TEXT DEFAULT '#333333', secondary_color TEXT DEFAULT '#666666', accent_color TEXT DEFAULT '#0066cc', custom_footer_text TEXT, show_weighted_average BOOLEAN DEFAULT true NOT NULL, show_ranking BOOLEAN DEFAULT true NOT NULL, show_mention BOOLEAN DEFAULT true NOT NULL, show_decision BOOLEAN DEFAULT true NOT NULL, show_observations BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_textbooks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_textbook_entries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, lesson_content TEXT NOT NULL, chapter_title TEXT, objectives_covered TEXT, session_date DATE NOT NULL, start_time TIME, end_time TIME, homework_given TEXT, homework_due_date DATE, next_session_plan TEXT, resources_links TEXT, observations TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_textbook_notes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE, created_by UUID REFERENCES public.app_users(id), target_teacher_id UUID REFERENCES public.teachers(id), note_content TEXT NOT NULL, is_visible_to_all BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_cameras (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, name TEXT NOT NULL, rtsp_url TEXT NOT NULL, description TEXT, location TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_fee_config (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, name TEXT NOT NULL, frequency TEXT NOT NULL, description TEXT, amount_default NUMERIC NOT NULL, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_fees (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, fee_config_id UUID NOT NULL REFERENCES public.school_fee_config(id) ON DELETE CASCADE, label TEXT NOT NULL, due_month TEXT NOT NULL, amount_due NUMERIC NOT NULL, amount_paid NUMERIC DEFAULT 0 NOT NULL, status TEXT DEFAULT 'pending' NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.school_payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, fee_id UUID NOT NULL REFERENCES public.school_fees(id) ON DELETE CASCADE, amount_paid NUMERIC NOT NULL, method TEXT NOT NULL, notes TEXT, payment_date TIMESTAMPTZ DEFAULT now() NOT NULL, recorded_by UUID REFERENCES public.app_users(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.year_preparations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, from_year_id UUID NOT NULL REFERENCES public.school_years(id), to_year_id UUID NOT NULL REFERENCES public.school_years(id), status TEXT DEFAULT 'draft' NOT NULL, created_by UUID REFERENCES public.app_users(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.class_transitions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE, from_class_id UUID NOT NULL REFERENCES public.classes(id), to_class_id UUID NOT NULL REFERENCES public.classes(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.student_transitions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE, student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, from_class_id UUID NOT NULL REFERENCES public.classes(id), to_class_id UUID REFERENCES public.classes(id), transition_type TEXT NOT NULL, notes TEXT, created_by UUID REFERENCES public.app_users(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.exam_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, school_semester_id UUID REFERENCES public.school_semester(id), exam_type TEXT NOT NULL, duration_minutes INTEGER NOT NULL, documents_allowed BOOLEAN DEFAULT false NOT NULL, answer_on_document BOOLEAN DEFAULT true, status TEXT DEFAULT 'draft' NOT NULL, submitted_at TIMESTAMPTZ, reviewed_by UUID REFERENCES public.app_users(id), reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.exam_questions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), exam_document_id UUID NOT NULL REFERENCES public.exam_documents(id) ON DELETE CASCADE, question_number INTEGER NOT NULL, question_text TEXT NOT NULL, points NUMERIC NOT NULL, has_choices BOOLEAN DEFAULT false NOT NULL, is_multiple_choice BOOLEAN DEFAULT false NOT NULL, table_data JSONB, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.exam_answers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE, answer_text TEXT NOT NULL, is_correct BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.online_exams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, duration_minutes INTEGER NOT NULL, start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL, allow_window_switch BOOLEAN DEFAULT false NOT NULL, max_warnings INTEGER DEFAULT 3 NOT NULL, is_published BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.online_exam_questions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE, question_text TEXT NOT NULL, question_order INTEGER NOT NULL, points NUMERIC DEFAULT 1 NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.online_exam_answers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE, answer_text TEXT NOT NULL, is_correct BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.student_exam_attempts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE, student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, status TEXT DEFAULT 'in_progress' NOT NULL, started_at TIMESTAMPTZ DEFAULT now() NOT NULL, submitted_at TIMESTAMPTZ, score NUMERIC, warning_count INTEGER DEFAULT 0 NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS public.student_exam_responses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id UUID NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE, question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE, selected_answer_id UUID REFERENCES public.online_exam_answers(id), is_correct BOOLEAN, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);

-- ADD BASE TABLE FK
ALTER TABLE public.cycles ADD CONSTRAINT cycles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.options ADD CONSTRAINT options_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.options ADD CONSTRAINT options_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE CASCADE;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.students ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.school_roles ADD CONSTRAINT school_roles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_school_id ON public.app_users(school_id);
CREATE INDEX IF NOT EXISTS idx_app_users_session_token ON public.app_users(session_token);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_user_id ON public.app_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_school_id ON public.app_user_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON public.assignments(school_id);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id uuid, _role app_role, _school_id uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT EXISTS (SELECT 1 FROM app_user_roles WHERE user_id = _user_id AND role = _role AND ((_school_id IS NULL AND school_id IS NULL) OR (school_id = _school_id) OR (_school_id IS NULL AND role = 'global_admin'))) $$;
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid) RETURNS TABLE(role app_role, school_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT role, school_id FROM app_user_roles WHERE user_id = _user_id $$;
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(check_school_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT EXISTS (SELECT 1 FROM app_user_roles WHERE school_id = check_school_id) $$;
CREATE OR REPLACE FUNCTION public.auto_transition_semesters() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ DECLARE v_semester RECORD; BEGIN FOR v_semester IN SELECT s.id, s.school_id FROM school_semester s WHERE s.is_actual = true AND s.end_date < CURRENT_DATE LOOP UPDATE school_semester SET is_actual = true, is_next = false WHERE school_id = v_semester.school_id AND start_date > (SELECT end_date FROM school_semester WHERE id = v_semester.id) AND id IN (SELECT id FROM school_semester WHERE school_id = v_semester.school_id AND start_date > (SELECT end_date FROM school_semester WHERE id = v_semester.id) ORDER BY start_date ASC LIMIT 1); UPDATE school_semester SET is_actual = false WHERE id = v_semester.id; END LOOP; END; $$;

-- RLS ENABLE
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_request_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_administrative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbook_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_semester ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Service role bypass for edge functions + public access where needed)
CREATE POLICY "schools_public_read" ON public.schools FOR SELECT USING (true);
CREATE POLICY "school_years_public_read" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "school_admission_public_insert" ON public.school_admission FOR INSERT WITH CHECK (true);
CREATE POLICY "app_users_anon_all" ON public.app_users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "app_user_roles_anon_all" ON public.app_user_roles FOR ALL TO anon USING (true) WITH CHECK (true);

-- Service role policies (all tables)
CREATE POLICY "schools_service_all" ON public.schools FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_years_service_all" ON public.school_years FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "subscription_plans_service_all" ON public.subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "subscriptions_service_all" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "cycles_service_all" ON public.cycles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "options_service_all" ON public.options FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "teachers_service_all" ON public.teachers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "students_service_all" ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "classes_service_all" ON public.classes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "subjects_service_all" ON public.subjects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "classrooms_service_all" ON public.classrooms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "app_users_service_all" ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "app_user_roles_service_all" ON public.app_user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_roles_service_all" ON public.school_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_role_permissions_service_all" ON public.school_role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_school_roles_service_all" ON public.user_school_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "teacher_classes_service_all" ON public.teacher_classes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "class_subjects_service_all" ON public.class_subjects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "student_school_service_all" ON public.student_school FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "assignments_service_all" ON public.assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "classroom_assignments_service_all" ON public.classroom_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "attendance_service_all" ON public.attendance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "attendance_sessions_service_all" ON public.attendance_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "grades_service_all" ON public.grades FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "announcements_service_all" ON public.announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "events_service_all" ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "event_attendance_sessions_service_all" ON public.event_attendance_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "event_attendance_service_all" ON public.event_attendance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "absence_notifications_log_service_all" ON public.absence_notifications_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_notifications_service_all" ON public.school_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_admission_service_all" ON public.school_admission FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "document_templates_service_all" ON public.document_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "document_requests_service_all" ON public.document_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "document_request_tracking_service_all" ON public.document_request_tracking FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "administrative_document_types_service_all" ON public.administrative_document_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "student_administrative_documents_service_all" ON public.student_administrative_documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "bulletin_settings_service_all" ON public.bulletin_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_textbooks_service_all" ON public.school_textbooks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_textbook_entries_service_all" ON public.school_textbook_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_textbook_notes_service_all" ON public.school_textbook_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_cameras_service_all" ON public.school_cameras FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_fee_config_service_all" ON public.school_fee_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_fees_service_all" ON public.school_fees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_payments_service_all" ON public.school_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "year_preparations_service_all" ON public.year_preparations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "class_transitions_service_all" ON public.class_transitions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "student_transitions_service_all" ON public.student_transitions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "exam_documents_service_all" ON public.exam_documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "exam_questions_service_all" ON public.exam_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "exam_answers_service_all" ON public.exam_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "online_exams_service_all" ON public.online_exams FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "online_exam_questions_service_all" ON public.online_exam_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "online_exam_answers_service_all" ON public.online_exam_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "student_exam_attempts_service_all" ON public.student_exam_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "student_exam_responses_service_all" ON public.student_exam_responses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "school_semester_service_all" ON public.school_semester FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PUBLIC VIEW (safe user data)
CREATE OR REPLACE VIEW public.app_users_public AS SELECT id, email, first_name, last_name, phone, avatar_url, school_id, teacher_id, student_id, is_active, created_at, updated_at FROM public.app_users;

-- END OF SCHEMA
