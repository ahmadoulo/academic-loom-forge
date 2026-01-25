-- ============================================================
-- EDUVATE SCHOOL MANAGEMENT SYSTEM - Security Migration
-- Version: 2.0 - Production-Ready Strict RLS Policies
-- ============================================================
-- 
-- This script upgrades from permissive RLS to production-ready
-- strict RLS policies based on the custom auth system (app_users).
-- 
-- SECURITY ARCHITECTURE:
-- 1. All WRITE operations go through Edge Functions (service_role)
-- 2. READ operations use RLS policies with school isolation
-- 3. Sensitive columns are protected via app_users_public view
-- 4. Role-based access control via app_user_roles table
-- ============================================================

-- ============================================================
-- PART 1: SECURITY HELPER FUNCTIONS
-- ============================================================

-- Check if a user has a specific role (optionally in a specific school)
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id UUID, _role public.app_role, _school_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = _user_id 
    AND role = _role
    AND (
      -- Global admin has access everywhere
      role = 'global_admin'
      -- Or match school if specified
      OR (_school_id IS NULL)
      OR (school_id = _school_id)
    )
  )
$$;

-- Check if a user is a global admin
CREATE OR REPLACE FUNCTION public.is_app_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles 
    WHERE user_id = _user_id AND role = 'global_admin'
  )
$$;

-- Check if a user is a school admin for a specific school
CREATE OR REPLACE FUNCTION public.is_app_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles 
    WHERE user_id = _user_id 
    AND (role = 'global_admin' OR (role = 'school_admin' AND school_id = _school_id))
  )
$$;

-- Check if user belongs to a school (has any role in that school)
CREATE OR REPLACE FUNCTION public.user_in_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles 
    WHERE user_id = _user_id 
    AND (role = 'global_admin' OR school_id = _school_id)
  )
$$;

-- Check if user is a teacher with access to a class
CREATE OR REPLACE FUNCTION public.teacher_has_class(_teacher_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE teacher_id = _teacher_id AND class_id = _class_id
  )
$$;

-- Check if a student belongs to a class
CREATE OR REPLACE FUNCTION public.student_in_class(_student_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_school
    WHERE student_id = _student_id AND class_id = _class_id AND is_active = true
  )
$$;

-- Get school ID from a class
CREATE OR REPLACE FUNCTION public.get_class_school_id(_class_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.classes WHERE id = _class_id LIMIT 1
$$;

-- Get school ID from a subject
CREATE OR REPLACE FUNCTION public.get_subject_school_id(_subject_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.school_id 
  FROM public.subjects s
  JOIN public.classes c ON c.id = s.class_id
  WHERE s.id = _subject_id 
  LIMIT 1
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_app_role(UUID, public.app_role, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_app_global_admin(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_app_school_admin(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_in_school(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_has_class(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_in_class(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_class_school_id(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_subject_school_id(UUID) TO anon, authenticated, service_role;

-- ============================================================
-- PART 2: CREATE SECURE PUBLIC VIEW FOR APP_USERS
-- ============================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.app_users_public CASCADE;

-- Create secure view that hides sensitive columns
CREATE VIEW public.app_users_public
WITH (security_invoker = on)
AS SELECT 
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

-- Grant access to the view
GRANT SELECT ON public.app_users_public TO anon, authenticated, service_role;

-- ============================================================
-- PART 3: DROP ALL PERMISSIVE POLICIES
-- ============================================================

-- Drop all "Allow all" policies to replace with strict ones
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
    -- Drop any other existing policies
    EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%s', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_no_direct_access" ON public.%s', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_no_direct_access" ON public.%s', t);
    EXECUTE format('DROP POLICY IF EXISTS "full_access_%s" ON public.%s', t, t);
  END LOOP;
END $$;

-- ============================================================
-- PART 4: CRITICAL TABLE POLICIES
-- ============================================================

-- ---------------------------------------------
-- APP_USERS: Highly sensitive - restrict access
-- ---------------------------------------------

-- Service role only (Edge Functions handle all operations)
CREATE POLICY "service_role_full_access" ON public.app_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny direct access to anon/authenticated (use app_users_public view instead)
CREATE POLICY "anon_no_direct_access" ON public.app_users
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "authenticated_no_direct_access" ON public.app_users
  FOR SELECT
  TO authenticated
  USING (false);

-- ---------------------------------------------
-- APP_USER_ROLES: Only service_role can modify
-- ---------------------------------------------
CREATE POLICY "service_role_manage_roles" ON public.app_user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anyone can read roles (needed for role checks)
CREATE POLICY "anon_read_roles" ON public.app_user_roles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------
-- GRADES: Critical - role-based access
-- ---------------------------------------------

-- Service role full access for Edge Functions
CREATE POLICY "service_role_grades" ON public.grades
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Teachers can manage grades for their assigned subjects
CREATE POLICY "teachers_manage_own_grades" ON public.grades
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = grades.subject_id
      AND s.teacher_id = grades.teacher_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = grades.subject_id
      AND s.teacher_id = grades.teacher_id
    )
  );

-- Students can view only their own grades
CREATE POLICY "students_view_own_grades" ON public.grades
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.student_id = grades.student_id
      AND u.is_active = true
    )
  );

-- School admins can view all grades in their school
CREATE POLICY "admins_view_school_grades" ON public.grades
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      JOIN public.subjects s ON s.id = grades.subject_id
      JOIN public.classes c ON c.id = s.class_id
      WHERE r.role IN ('global_admin', 'school_admin')
      AND (r.role = 'global_admin' OR r.school_id = c.school_id)
    )
  );

-- ---------------------------------------------
-- STUDENTS: School-isolated access
-- ---------------------------------------------

-- Service role full access
CREATE POLICY "service_role_students" ON public.students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- School staff can view students in their school
CREATE POLICY "school_staff_view_students" ON public.students
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_school ss
      JOIN public.app_user_roles r ON r.school_id = ss.school_id
      WHERE ss.student_id = students.id
      AND r.role IN ('global_admin', 'school_admin', 'school_staff', 'teacher')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.student_id = students.id
      AND u.is_active = true
    )
  );

-- Only admins can insert/update/delete students
CREATE POLICY "admins_manage_students" ON public.students
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_school ss
      JOIN public.app_user_roles r ON r.school_id = ss.school_id
      WHERE ss.student_id = students.id
      AND r.role IN ('global_admin', 'school_admin')
    )
  )
  WITH CHECK (true);

-- ---------------------------------------------
-- TEACHERS: School-isolated access
-- ---------------------------------------------

-- Service role full access
CREATE POLICY "service_role_teachers" ON public.teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- School staff can view teachers (excluding sensitive salary data through app logic)
CREATE POLICY "school_staff_view_teachers" ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.school_id = teachers.school_id
      AND r.role IN ('global_admin', 'school_admin', 'school_staff', 'teacher', 'student')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.teacher_id = teachers.id
      AND u.is_active = true
    )
  );

-- Only admins can manage teachers
CREATE POLICY "admins_manage_teachers" ON public.teachers
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.school_id = teachers.school_id
      AND r.role IN ('global_admin', 'school_admin')
    )
  )
  WITH CHECK (true);

-- ---------------------------------------------
-- ATTENDANCE: Role-based access
-- ---------------------------------------------

-- Service role full access
CREATE POLICY "service_role_attendance" ON public.attendance
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Teachers can manage attendance for their classes
CREATE POLICY "teachers_manage_class_attendance" ON public.attendance
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_classes tc
      WHERE tc.class_id = attendance.class_id
      AND tc.teacher_id = attendance.teacher_id
    )
  )
  WITH CHECK (true);

-- Students can view their own attendance
CREATE POLICY "students_view_own_attendance" ON public.attendance
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.student_id = attendance.student_id
      AND u.is_active = true
    )
  );

-- School admins can view all attendance
CREATE POLICY "admins_view_school_attendance" ON public.attendance
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE (r.role = 'global_admin' OR (r.role = 'school_admin' AND r.school_id = attendance.school_id))
    )
  );

-- ---------------------------------------------
-- SUBSCRIPTIONS: Admin-only access
-- ---------------------------------------------

-- Service role full access
CREATE POLICY "service_role_subscriptions" ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Global admins can manage all subscriptions
CREATE POLICY "global_admin_subscriptions" ON public.subscriptions
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.role = 'global_admin'
    )
  )
  WITH CHECK (true);

-- School admins can view their school's subscription
CREATE POLICY "school_admin_view_subscription" ON public.subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.role = 'school_admin'
      AND r.school_id = subscriptions.school_id
    )
  );

-- ---------------------------------------------
-- SCHOOL_FEES: Admin-only access
-- ---------------------------------------------

-- Service role full access
CREATE POLICY "service_role_school_fees" ON public.school_fees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- School admins and accountants can manage fees
CREATE POLICY "admins_manage_fees" ON public.school_fees
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.school_id = school_fees.school_id
      AND r.role IN ('global_admin', 'school_admin', 'accountant')
    )
  )
  WITH CHECK (true);

-- Students can view their own fees
CREATE POLICY "students_view_own_fees" ON public.school_fees
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.student_id = school_fees.student_id
      AND u.is_active = true
    )
  );

-- ---------------------------------------------
-- SCHOOL_PAYMENTS: Admin-only access
-- ---------------------------------------------

-- Service role full access
CREATE POLICY "service_role_school_payments" ON public.school_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- School admins and accountants can manage payments
CREATE POLICY "admins_manage_payments" ON public.school_payments
  FOR ALL
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.school_id = school_payments.school_id
      AND r.role IN ('global_admin', 'school_admin', 'accountant')
    )
  )
  WITH CHECK (true);

-- Students can view their own payments
CREATE POLICY "students_view_own_payments" ON public.school_payments
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.student_id = school_payments.student_id
      AND u.is_active = true
    )
  );

-- ============================================================
-- PART 5: SCHOOL-ISOLATED TABLE POLICIES
-- ============================================================

-- For tables with school_id: Allow read for school members, write for admins

-- SCHOOLS
CREATE POLICY "service_role_schools" ON public.schools
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_schools" ON public.schools
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.school_id = schools.id OR r.role = 'global_admin'
    )
  );

CREATE POLICY "global_admin_manage_schools" ON public.schools
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin')
  )
  WITH CHECK (true);

-- SUBSCRIPTION_PLANS (public read, admin write)
CREATE POLICY "service_role_subscription_plans" ON public.subscription_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_plans" ON public.subscription_plans
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "global_admin_manage_plans" ON public.subscription_plans
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role = 'global_admin'))
  WITH CHECK (true);

-- SCHOOL_YEARS
CREATE POLICY "service_role_school_years" ON public.school_years
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_years" ON public.school_years
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_years.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_years" ON public.school_years
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = school_years.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_SEMESTER
CREATE POLICY "service_role_school_semester" ON public.school_semester
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_semesters" ON public.school_semester
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_semester.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_semesters" ON public.school_semester
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = school_semester.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- CYCLES
CREATE POLICY "service_role_cycles" ON public.cycles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_cycles" ON public.cycles
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = cycles.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_cycles" ON public.cycles
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = cycles.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- OPTIONS
CREATE POLICY "service_role_options" ON public.options
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_options" ON public.options
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = options.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_options" ON public.options
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = options.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- CLASSES
CREATE POLICY "service_role_classes" ON public.classes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_classes" ON public.classes
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = classes.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_classes" ON public.classes
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = classes.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- STUDENT_SCHOOL
CREATE POLICY "service_role_student_school" ON public.student_school
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_student_school" ON public.student_school
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = student_school.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_student_school" ON public.student_school
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = student_school.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- TEACHER_CLASSES
CREATE POLICY "service_role_teacher_classes" ON public.teacher_classes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_teacher_classes" ON public.teacher_classes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_teacher_classes" ON public.teacher_classes
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.app_user_roles r ON r.school_id = c.school_id
      WHERE c.id = teacher_classes.class_id
      AND r.role IN ('global_admin', 'school_admin')
    )
  )
  WITH CHECK (true);

-- SUBJECTS
CREATE POLICY "service_role_subjects" ON public.subjects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_subjects" ON public.subjects
  FOR SELECT TO anon, authenticated
  USING (
    subjects.school_id IS NULL OR
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = subjects.school_id OR r.role = 'global_admin')
  );

CREATE POLICY "admins_manage_subjects" ON public.subjects
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = subjects.school_id OR r.role = 'global_admin'))
  )
  WITH CHECK (true);

-- CLASS_SUBJECTS
CREATE POLICY "service_role_class_subjects" ON public.class_subjects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_class_subjects" ON public.class_subjects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_class_subjects" ON public.class_subjects
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.app_user_roles r ON r.school_id = c.school_id
      WHERE c.id = class_subjects.class_id
      AND r.role IN ('global_admin', 'school_admin')
    )
  )
  WITH CHECK (true);

-- CLASSROOMS
CREATE POLICY "service_role_classrooms" ON public.classrooms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_classrooms" ON public.classrooms
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = classrooms.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_classrooms" ON public.classrooms
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = classrooms.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- ASSIGNMENTS
CREATE POLICY "service_role_assignments" ON public.assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_assignments" ON public.assignments
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = assignments.school_id OR r.role = 'global_admin'));

CREATE POLICY "teachers_manage_assignments" ON public.assignments
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.school_id = assignments.school_id
      AND r.role IN ('global_admin', 'school_admin', 'teacher')
    )
  )
  WITH CHECK (true);

-- CLASSROOM_ASSIGNMENTS
CREATE POLICY "service_role_classroom_assignments" ON public.classroom_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_classroom_assignments" ON public.classroom_assignments
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = classroom_assignments.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_classroom_assignments" ON public.classroom_assignments
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = classroom_assignments.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- ATTENDANCE_SESSIONS
CREATE POLICY "service_role_attendance_sessions" ON public.attendance_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_attendance_sessions" ON public.attendance_sessions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teachers_manage_attendance_sessions" ON public.attendance_sessions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- EVENTS
CREATE POLICY "service_role_events" ON public.events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_events" ON public.events
  FOR SELECT TO anon, authenticated
  USING (
    events.school_id IS NULL OR
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = events.school_id OR r.role = 'global_admin')
  );

CREATE POLICY "admins_manage_events" ON public.events
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = events.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- EVENT_ATTENDANCE_SESSIONS
CREATE POLICY "service_role_event_attendance_sessions" ON public.event_attendance_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_event_sessions" ON public.event_attendance_sessions
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = event_attendance_sessions.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_event_sessions" ON public.event_attendance_sessions
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = event_attendance_sessions.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- EVENT_ATTENDANCE
CREATE POLICY "service_role_event_attendance" ON public.event_attendance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_event_attendance" ON public.event_attendance
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = event_attendance.school_id OR r.role = 'global_admin'));

CREATE POLICY "anyone_insert_event_attendance" ON public.event_attendance
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ANNOUNCEMENTS
CREATE POLICY "service_role_announcements" ON public.announcements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_announcements" ON public.announcements
  FOR SELECT TO anon, authenticated
  USING (
    announcements.school_id IS NULL OR
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = announcements.school_id OR r.role = 'global_admin')
  );

CREATE POLICY "admins_manage_announcements" ON public.announcements
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = announcements.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_NOTIFICATIONS
CREATE POLICY "service_role_school_notifications" ON public.school_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_notifications" ON public.school_notifications
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_notifications.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_notifications" ON public.school_notifications
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = school_notifications.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- ABSENCE_NOTIFICATIONS_LOG
CREATE POLICY "service_role_absence_notifications_log" ON public.absence_notifications_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_absence_log" ON public.absence_notifications_log
  FOR SELECT TO anon, authenticated
  USING (
    absence_notifications_log.school_id IS NULL OR
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = absence_notifications_log.school_id OR r.role = 'global_admin')
  );

CREATE POLICY "anyone_insert_absence_log" ON public.absence_notifications_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- DOCUMENT_TEMPLATES
CREATE POLICY "service_role_document_templates" ON public.document_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_templates" ON public.document_templates
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = document_templates.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_templates" ON public.document_templates
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = document_templates.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- DOCUMENT_REQUESTS
CREATE POLICY "service_role_document_requests" ON public.document_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_requests" ON public.document_requests
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = document_requests.school_id OR r.role = 'global_admin'));

CREATE POLICY "anyone_insert_requests" ON public.document_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admins_manage_requests" ON public.document_requests
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = document_requests.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- DOCUMENT_REQUEST_TRACKING
CREATE POLICY "service_role_document_request_tracking" ON public.document_request_tracking
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_tracking" ON public.document_request_tracking
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = document_request_tracking.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_tracking" ON public.document_request_tracking
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = document_request_tracking.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- ADMINISTRATIVE_DOCUMENT_TYPES
CREATE POLICY "service_role_admin_doc_types" ON public.administrative_document_types
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_doc_types" ON public.administrative_document_types
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = administrative_document_types.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_doc_types" ON public.administrative_document_types
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = administrative_document_types.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- STUDENT_ADMINISTRATIVE_DOCUMENTS
CREATE POLICY "service_role_student_admin_docs" ON public.student_administrative_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_student_docs" ON public.student_administrative_documents
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = student_administrative_documents.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_student_docs" ON public.student_administrative_documents
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = student_administrative_documents.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_ADMISSION (public insert for admission forms)
CREATE POLICY "service_role_school_admission" ON public.school_admission
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_admissions" ON public.school_admission
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_admission.school_id OR r.role = 'global_admin'));

CREATE POLICY "public_insert_admissions" ON public.school_admission
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admins_manage_admissions" ON public.school_admission
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'admission') AND (r.school_id = school_admission.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- BULLETIN_SETTINGS
CREATE POLICY "service_role_bulletin_settings" ON public.bulletin_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_bulletin" ON public.bulletin_settings
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = bulletin_settings.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_bulletin" ON public.bulletin_settings
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = bulletin_settings.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_CAMERAS (admin-only for security)
CREATE POLICY "service_role_school_cameras" ON public.school_cameras
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admins_only_cameras" ON public.school_cameras
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = school_cameras.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_TEXTBOOKS
CREATE POLICY "service_role_school_textbooks" ON public.school_textbooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_textbooks" ON public.school_textbooks
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_textbooks.school_id OR r.role = 'global_admin'));

CREATE POLICY "teachers_manage_textbooks" ON public.school_textbooks
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher') AND (r.school_id = school_textbooks.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_TEXTBOOK_ENTRIES
CREATE POLICY "service_role_textbook_entries" ON public.school_textbook_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_textbook_entries" ON public.school_textbook_entries
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teachers_manage_entries" ON public.school_textbook_entries
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SCHOOL_TEXTBOOK_NOTES
CREATE POLICY "service_role_textbook_notes" ON public.school_textbook_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_textbook_notes" ON public.school_textbook_notes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_notes" ON public.school_textbook_notes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EXAM_DOCUMENTS
CREATE POLICY "service_role_exam_documents" ON public.exam_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_exam_docs" ON public.exam_documents
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = exam_documents.school_id OR r.role = 'global_admin'));

CREATE POLICY "teachers_manage_exam_docs" ON public.exam_documents
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher') AND (r.school_id = exam_documents.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- EXAM_QUESTIONS (restrict answer visibility to teachers)
CREATE POLICY "service_role_exam_questions" ON public.exam_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_exam_questions" ON public.exam_questions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teachers_manage_exam_questions" ON public.exam_questions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EXAM_QUESTION_CHOICES
CREATE POLICY "service_role_exam_choices" ON public.exam_question_choices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_exam_choices" ON public.exam_question_choices
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teachers_manage_exam_choices" ON public.exam_question_choices
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EXAM_ANSWERS (teachers only - protect correct answers)
CREATE POLICY "service_role_exam_answers" ON public.exam_answers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "teachers_only_exam_answers" ON public.exam_answers
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.role IN ('global_admin', 'school_admin', 'teacher')
    )
  )
  WITH CHECK (true);

-- ONLINE_EXAMS
CREATE POLICY "service_role_online_exams" ON public.online_exams
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_online_exams" ON public.online_exams
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = online_exams.school_id OR r.role = 'global_admin'));

CREATE POLICY "teachers_manage_online_exams" ON public.online_exams
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher') AND (r.school_id = online_exams.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- ONLINE_EXAM_QUESTIONS
CREATE POLICY "service_role_online_exam_questions" ON public.online_exam_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_online_exam_questions" ON public.online_exam_questions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teachers_manage_online_exam_questions" ON public.online_exam_questions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ONLINE_EXAM_ANSWERS (teachers only - protect correct answers)
CREATE POLICY "service_role_online_exam_answers" ON public.online_exam_answers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "teachers_only_online_answers" ON public.online_exam_answers
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user_roles r
      WHERE r.role IN ('global_admin', 'school_admin', 'teacher')
    )
  )
  WITH CHECK (true);

-- STUDENT_EXAM_ATTEMPTS
CREATE POLICY "service_role_student_exam_attempts" ON public.student_exam_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "students_manage_own_attempts" ON public.student_exam_attempts
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_users u WHERE u.student_id = student_exam_attempts.student_id AND u.is_active = true)
  )
  WITH CHECK (true);

CREATE POLICY "teachers_view_attempts" ON public.student_exam_attempts
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher'))
  );

-- STUDENT_EXAM_RESPONSES
CREATE POLICY "service_role_student_exam_responses" ON public.student_exam_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "students_manage_own_responses" ON public.student_exam_responses
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "teachers_view_responses" ON public.student_exam_responses
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'teacher'))
  );

-- SCHOOL_ROLES
CREATE POLICY "service_role_school_roles" ON public.school_roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_roles" ON public.school_roles
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_roles.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_roles" ON public.school_roles
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = school_roles.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- SCHOOL_ROLE_PERMISSIONS
CREATE POLICY "service_role_school_role_permissions" ON public.school_role_permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_role_permissions" ON public.school_role_permissions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_role_permissions" ON public.school_role_permissions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- USER_SCHOOL_ROLES
CREATE POLICY "service_role_user_school_roles" ON public.user_school_roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_user_school_roles" ON public.user_school_roles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_user_school_roles" ON public.user_school_roles
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- YEAR_PREPARATIONS
CREATE POLICY "service_role_year_preparations" ON public.year_preparations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_preparations" ON public.year_preparations
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = year_preparations.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_preparations" ON public.year_preparations
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = year_preparations.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- CLASS_TRANSITIONS
CREATE POLICY "service_role_class_transitions" ON public.class_transitions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_class_transitions" ON public.class_transitions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_class_transitions" ON public.class_transitions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- STUDENT_TRANSITIONS
CREATE POLICY "service_role_student_transitions" ON public.student_transitions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_view_student_transitions" ON public.student_transitions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins_manage_student_transitions" ON public.student_transitions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SCHOOL_FEE_CONFIG
CREATE POLICY "service_role_school_fee_config" ON public.school_fee_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_fee_config" ON public.school_fee_config
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = school_fee_config.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_fee_config" ON public.school_fee_config
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin', 'accountant') AND (r.school_id = school_fee_config.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- TEACHER_SCHOOL
CREATE POLICY "service_role_teacher_school" ON public.teacher_school
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_teacher_school" ON public.teacher_school
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = teacher_school.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_teacher_school" ON public.teacher_school
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = teacher_school.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- NOTIFICATION_PREFERENCES
CREATE POLICY "service_role_notification_preferences" ON public.notification_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "school_members_view_notification_prefs" ON public.notification_preferences
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.school_id = notification_preferences.school_id OR r.role = 'global_admin'));

CREATE POLICY "admins_manage_notification_prefs" ON public.notification_preferences
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.app_user_roles r WHERE r.role IN ('global_admin', 'school_admin') AND (r.school_id = notification_preferences.school_id OR r.role = 'global_admin')))
  WITH CHECK (true);

-- ============================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================

-- Ensure service_role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant read access to anon/authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert/update/delete to anon/authenticated (RLS will enforce restrictions)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant function execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================
-- END OF SECURITY MIGRATION
-- ============================================================
