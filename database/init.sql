-- =====================================================
-- ACADEMIC MANAGEMENT SYSTEM - Database Schema
-- Version: 2.0
-- Generated: 2026-01-08
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- App role enum for user roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM (
        'global_admin',
        'school_admin', 
        'teacher',
        'student',
        'parent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription plan type enum
DO $$ BEGIN
    CREATE TYPE public.subscription_plan_type AS ENUM (
        'starter',
        'basic',
        'premium',
        'enterprise'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription status type enum
DO $$ BEGIN
    CREATE TYPE public.subscription_status_type AS ENUM (
        'trial',
        'active',
        'expired',
        'cancelled',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription duration type enum
DO $$ BEGIN
    CREATE TYPE public.subscription_duration_type AS ENUM (
        'monthly',
        'quarterly',
        'semi_annual',
        'annual'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment method type enum
DO $$ BEGIN
    CREATE TYPE public.payment_method_type AS ENUM (
        'cash',
        'bank_transfer',
        'check',
        'card',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    identifier TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Maroc',
    website TEXT,
    logo_url TEXT,
    academic_year TEXT DEFAULT '2024-2025',
    currency TEXT DEFAULT 'MAD' NOT NULL,
    owner_id UUID,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School years table
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_next BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- App users table (custom auth system)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    school_id UUID REFERENCES public.schools(id),
    teacher_id UUID,
    student_id UUID,
    is_active BOOLEAN DEFAULT false NOT NULL,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    invitation_token TEXT,
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    session_token TEXT,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- App user roles table
CREATE TABLE IF NOT EXISTS public.app_user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    school_id UUID REFERENCES public.schools(id),
    granted_by UUID REFERENCES public.app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Cycles table
CREATE TABLE IF NOT EXISTS public.cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    description TEXT,
    level TEXT,
    duration_years INTEGER DEFAULT 3,
    calculation_system TEXT DEFAULT 'coefficient' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Options table
CREATE TABLE IF NOT EXISTS public.options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    cycle_id UUID REFERENCES public.cycles(id),
    option_id UUID REFERENCES public.options(id),
    year_level INTEGER,
    is_specialization BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    school_id UUID NOT NULL REFERENCES public.schools(id),
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT,
    cin_number TEXT,
    birth_date DATE,
    birth_place TEXT,
    gender TEXT,
    student_phone TEXT,
    parent_phone TEXT,
    address TEXT,
    tutor_name TEXT,
    tutor_email TEXT,
    tutor_phone TEXT,
    class_id UUID REFERENCES public.classes(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    matricule TEXT,
    nationality TEXT,
    photo_url TEXT,
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Update foreign keys for app_users
ALTER TABLE public.app_users 
    ADD CONSTRAINT app_users_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
    
ALTER TABLE public.app_users 
    ADD CONSTRAINT app_users_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    coefficient NUMERIC DEFAULT 1,
    class_id UUID REFERENCES public.classes(id),
    teacher_id UUID REFERENCES public.teachers(id),
    school_id UUID REFERENCES public.schools(id),
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School semester table
CREATE TABLE IF NOT EXISTS public.school_semester (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_actual BOOLEAN DEFAULT false,
    is_next BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- RELATIONAL TABLES
-- =====================================================

-- Teacher classes table
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(teacher_id, class_id)
);

-- Class subjects table
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(class_id, subject_id)
);

-- Student school enrollment table
CREATE TABLE IF NOT EXISTS public.student_school (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    is_active BOOLEAN DEFAULT true NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- ACADEMIC MANAGEMENT TABLES
-- =====================================================

-- Grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    school_semester_id UUID REFERENCES public.school_semester(id),
    grade NUMERIC NOT NULL,
    grade_type TEXT DEFAULT 'controle' NOT NULL,
    comment TEXT,
    exam_date DATE,
    is_modified BOOLEAN DEFAULT false,
    bonus INTEGER DEFAULT 0,
    bonus_reason TEXT,
    bonus_given_by UUID REFERENCES public.app_users(id),
    bonus_given_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    subject_id UUID REFERENCES public.subjects(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'course' NOT NULL,
    due_date DATE,
    session_date DATE,
    start_time TIME,
    end_time TIME,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    recurrence_day INTEGER,
    recurrence_end_date DATE,
    parent_assignment_id UUID REFERENCES public.assignments(id),
    is_rescheduled BOOLEAN DEFAULT false,
    original_session_date DATE,
    proposed_new_date DATE,
    reschedule_reason TEXT,
    reschedule_status TEXT,
    rescheduled_by UUID,
    rescheduled_at TIMESTAMP WITH TIME ZONE,
    absence_notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    teacher_id UUID NOT NULL,
    subject_id UUID REFERENCES public.subjects(id),
    assignment_id UUID REFERENCES public.assignments(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    status TEXT DEFAULT 'absent' NOT NULL,
    method TEXT DEFAULT 'manual' NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_justified BOOLEAN DEFAULT false,
    justification_comment TEXT,
    justification_file_path TEXT,
    justification_status TEXT,
    justification_submitted_at TIMESTAMP WITH TIME ZONE,
    justification_reviewed_at TIMESTAMP WITH TIME ZONE,
    justification_reviewed_by UUID,
    justification_rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Attendance sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    session_code TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Absence notifications log table
CREATE TABLE IF NOT EXISTS public.absence_notifications_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id),
    student_id UUID REFERENCES public.students(id),
    school_id UUID REFERENCES public.schools(id),
    session_date DATE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    sent_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- CLASSROOMS & SCHEDULING
-- =====================================================

-- Classrooms table
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    building TEXT,
    floor TEXT,
    capacity INTEGER DEFAULT 30,
    equipment TEXT[],
    is_active BOOLEAN DEFAULT true,
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Classroom assignments table
CREATE TABLE IF NOT EXISTS public.classroom_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- EXAMS & ONLINE EXAMS
-- =====================================================

-- Exam documents table
CREATE TABLE IF NOT EXISTS public.exam_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    school_semester_id UUID REFERENCES public.school_semester(id),
    exam_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    documents_allowed BOOLEAN DEFAULT false,
    answer_on_document BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Exam questions table
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_document_id UUID NOT NULL REFERENCES public.exam_documents(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    points NUMERIC NOT NULL,
    has_choices BOOLEAN DEFAULT false,
    is_multiple_choice BOOLEAN DEFAULT false,
    table_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Exam answers table
CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Online exams table
CREATE TABLE IF NOT EXISTS public.online_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    allow_window_switch BOOLEAN DEFAULT false,
    max_warnings INTEGER DEFAULT 3,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Online exam questions table
CREATE TABLE IF NOT EXISTS public.online_exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    points NUMERIC DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Online exam answers table
CREATE TABLE IF NOT EXISTS public.online_exam_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Student exam attempts table
CREATE TABLE IF NOT EXISTS public.student_exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES public.online_exams(id),
    student_id UUID NOT NULL REFERENCES public.students(id),
    status TEXT DEFAULT 'in_progress' NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score NUMERIC,
    warning_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Student exam responses table
CREATE TABLE IF NOT EXISTS public.student_exam_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.online_exam_questions(id),
    selected_answer_id UUID REFERENCES public.online_exam_answers(id),
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id),
    class_id UUID REFERENCES public.classes(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    visibility TEXT DEFAULT 'all',
    pinned BOOLEAN DEFAULT false,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    attachments TEXT[],
    links TEXT[],
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id),
    class_id UUID REFERENCES public.classes(id),
    subject_id UUID REFERENCES public.subjects(id),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    scope TEXT DEFAULT 'school',
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published BOOLEAN DEFAULT false,
    attendance_enabled BOOLEAN DEFAULT false,
    attachments TEXT[],
    links TEXT[],
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Event attendance sessions table
CREATE TABLE IF NOT EXISTS public.event_attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    session_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Event attendance table
CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.event_attendance_sessions(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    student_id UUID REFERENCES public.students(id),
    participant_name TEXT NOT NULL,
    participant_email TEXT,
    participant_phone TEXT,
    method TEXT DEFAULT 'qr',
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School notifications table
CREATE TABLE IF NOT EXISTS public.school_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    class_id UUID REFERENCES public.classes(id),
    recipient_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by UUID,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- DOCUMENTS TABLES
-- =====================================================

-- Document templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    header_style TEXT DEFAULT 'modern',
    footer_content TEXT,
    footer_color TEXT DEFAULT '#1e40af',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Document requests table
CREATE TABLE IF NOT EXISTS public.document_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    document_type TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Document request tracking table
CREATE TABLE IF NOT EXISTS public.document_request_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    status TEXT NOT NULL,
    comment TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- TEXTBOOKS TABLES
-- =====================================================

-- School textbooks table
CREATE TABLE IF NOT EXISTS public.school_textbooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    school_year_id UUID NOT NULL REFERENCES public.school_years(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(school_id, class_id, school_year_id)
);

-- School textbook entries table
CREATE TABLE IF NOT EXISTS public.school_textbook_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    lesson_content TEXT NOT NULL,
    chapter_title TEXT,
    objectives_covered TEXT,
    homework_given TEXT,
    homework_due_date DATE,
    next_session_plan TEXT,
    resources_links TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School textbook notes table
CREATE TABLE IF NOT EXISTS public.school_textbook_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
    created_by UUID,
    target_teacher_id UUID REFERENCES public.teachers(id),
    note_content TEXT NOT NULL,
    is_visible_to_all BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- FINANCE TABLES
-- =====================================================

-- School fee config table
CREATE TABLE IF NOT EXISTS public.school_fee_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL,
    amount_default NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School fees table
CREATE TABLE IF NOT EXISTS public.school_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    fee_config_id UUID NOT NULL REFERENCES public.school_fee_config(id),
    label TEXT NOT NULL,
    due_month TEXT NOT NULL,
    amount_due NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School payments table
CREATE TABLE IF NOT EXISTS public.school_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fee_id UUID NOT NULL REFERENCES public.school_fees(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    reference TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SUBSCRIPTIONS TABLES
-- =====================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    plan_type public.subscription_plan_type NOT NULL,
    max_students INTEGER,
    max_teachers INTEGER,
    price_monthly NUMERIC,
    price_quarterly NUMERIC,
    price_semi_annual NUMERIC,
    price_annual NUMERIC,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    plan_type public.subscription_plan_type NOT NULL,
    status public.subscription_status_type DEFAULT 'trial' NOT NULL,
    duration public.subscription_duration_type NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE NOT NULL,
    end_date DATE NOT NULL,
    amount NUMERIC,
    currency TEXT DEFAULT 'MAD' NOT NULL,
    payment_method public.payment_method_type,
    transaction_id TEXT,
    is_trial BOOLEAN DEFAULT false NOT NULL,
    trial_end_date DATE,
    auto_renew BOOLEAN DEFAULT false NOT NULL,
    custom_student_limit INTEGER,
    custom_teacher_limit INTEGER,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- ADMISSIONS TABLES
-- =====================================================

-- School admission table
CREATE TABLE IF NOT EXISTS public.school_admission (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
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
    desired_cycle_id UUID NOT NULL REFERENCES public.cycles(id),
    desired_option_id UUID REFERENCES public.options(id),
    status TEXT DEFAULT 'nouveau' NOT NULL,
    notes TEXT,
    converted_to_student_id UUID REFERENCES public.students(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- YEAR TRANSITION TABLES
-- =====================================================

-- Year preparations table
CREATE TABLE IF NOT EXISTS public.year_preparations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    from_year_id UUID NOT NULL REFERENCES public.school_years(id),
    to_year_id UUID NOT NULL REFERENCES public.school_years(id),
    status TEXT DEFAULT 'draft' NOT NULL,
    classes_created_at TIMESTAMP WITH TIME ZONE,
    mapping_completed_at TIMESTAMP WITH TIME ZONE,
    students_promoted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Class transitions table
CREATE TABLE IF NOT EXISTS public.class_transitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE,
    from_class_id UUID NOT NULL REFERENCES public.classes(id),
    to_class_id UUID NOT NULL REFERENCES public.classes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Student transitions table
CREATE TABLE IF NOT EXISTS public.student_transitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preparation_id UUID NOT NULL REFERENCES public.year_preparations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id),
    from_class_id UUID NOT NULL REFERENCES public.classes(id),
    to_class_id UUID REFERENCES public.classes(id),
    transition_type TEXT NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- MISC TABLES
-- =====================================================

-- School cameras table
CREATE TABLE IF NOT EXISTS public.school_cameras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    rtsp_url TEXT NOT NULL,
    description TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Bulletin settings table
CREATE TABLE IF NOT EXISTS public.bulletin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) UNIQUE,
    show_weighted_average BOOLEAN DEFAULT true NOT NULL,
    show_ranking BOOLEAN DEFAULT true NOT NULL,
    show_mention BOOLEAN DEFAULT true NOT NULL,
    show_decision BOOLEAN DEFAULT true NOT NULL,
    show_observations BOOLEAN DEFAULT false NOT NULL,
    template_style TEXT DEFAULT 'classic',
    primary_color TEXT DEFAULT '#333333',
    secondary_color TEXT DEFAULT '#666666',
    accent_color TEXT DEFAULT '#0066cc',
    custom_footer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SCHOOL ROLES TABLES
-- =====================================================

-- School roles table
CREATE TABLE IF NOT EXISTS public.school_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'blue',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- School role permissions table
CREATE TABLE IF NOT EXISTS public.school_role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(role_id, permission_key)
);

-- User school roles table
CREATE TABLE IF NOT EXISTS public.user_school_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    school_role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    granted_by UUID REFERENCES public.app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, school_role_id)
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers to all relevant tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('spatial_ref_sys')
    LOOP
        BEGIN
            EXECUTE format('
                CREATE TRIGGER update_%I_updated_at
                    BEFORE UPDATE ON public.%I
                    FOR EACH ROW
                    EXECUTE FUNCTION public.update_updated_at_column();
            ', t, t);
        EXCEPTION WHEN others THEN
            -- Trigger might already exist
            NULL;
        END;
    END LOOP;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- Create permissive policies for development/basic access
-- Note: In production, these should be replaced with proper RLS policies

CREATE POLICY IF NOT EXISTS "Allow all operations on schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on school_years" ON public.school_years FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on app_user_roles" ON public.app_user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function for automatic semester transition
CREATE OR REPLACE FUNCTION public.auto_transition_semesters()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Find semesters that should become current
    FOR rec IN 
        SELECT id, school_id, name
        FROM public.school_semester
        WHERE is_actual = false
        AND is_next = true
        AND start_date <= CURRENT_DATE
        AND archived = false
    LOOP
        -- Deactivate current semester for this school
        UPDATE public.school_semester 
        SET is_actual = false, is_next = false
        WHERE school_id = rec.school_id AND is_actual = true;
        
        -- Activate the new current semester
        UPDATE public.school_semester 
        SET is_actual = true, is_next = false
        WHERE id = rec.id;
        
        RAISE NOTICE 'Activated semester % for school %', rec.name, rec.school_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_school_year_id ON public.grades(school_year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON public.assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_session_date ON public.assignments(session_date);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_school_id ON public.app_users(school_id);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
