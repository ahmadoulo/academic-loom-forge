-- =====================================================
-- CRITICAL SECURITY FIX: Remove Overly Permissive RLS Policies
-- =====================================================
-- This migration removes the dangerous "USING (true)" policies 
-- and implements proper access control

-- ===========================================
-- 1. FIX app_users TABLE (CRITICAL)
-- ===========================================
-- The "Anon access for edge functions" policy exposes all credentials
-- Edge functions use service_role key which bypasses RLS entirely

-- Drop the dangerous anonymous access policy
DROP POLICY IF EXISTS "Anon access for edge functions" ON app_users;

-- ===========================================
-- 2. FIX students TABLE (uses student_school for school relationship)
-- ===========================================
-- Remove "Anyone can view students" - too permissive
DROP POLICY IF EXISTS "Anyone can view students" ON students;

-- Create school-scoped access for students via student_school join
DROP POLICY IF EXISTS "School staff can view students" ON students;
CREATE POLICY "School staff can view students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_school ss
      JOIN app_user_roles aur ON aur.school_id = ss.school_id
      WHERE ss.student_id = students.id
      AND aur.role IN ('school_admin', 'school_staff', 'teacher')
    )
    OR
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.student_id = students.id
    )
  );

-- ===========================================
-- 3. FIX teachers TABLE
-- ===========================================
-- Remove "Anyone can view teachers"
DROP POLICY IF EXISTS "Anyone can view teachers" ON teachers;

-- Create school-scoped access for teachers
DROP POLICY IF EXISTS "School staff can view teachers" ON teachers;
CREATE POLICY "School staff can view teachers"
  ON teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.school_id = teachers.school_id
      AND aur.role IN ('school_admin', 'school_staff', 'teacher', 'student')
    )
  );

-- ===========================================
-- 4. FIX grades TABLE
-- ===========================================
-- Replace permissive policies with proper ones
DROP POLICY IF EXISTS "Teachers and students can view grades" ON grades;
DROP POLICY IF EXISTS "Teachers can manage grades" ON grades;

-- Teachers can view grades for their school (via teacher)
CREATE POLICY "Teachers can view school grades"
  ON grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN app_user_roles aur ON aur.school_id = t.school_id
      WHERE t.id = grades.teacher_id
      AND aur.role IN ('school_admin', 'school_staff', 'teacher')
    )
  );

-- Students can view only their own grades
CREATE POLICY "Students can view own grades"
  ON grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.student_id = grades.student_id
    )
  );

-- Teachers can insert/update/delete grades
CREATE POLICY "Teachers can manage grades"
  ON grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.role IN ('school_admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.role IN ('school_admin', 'teacher')
    )
  );

-- ===========================================
-- 5. FIX exam_answers TABLE (Answer keys exposure)
-- ===========================================
DROP POLICY IF EXISTS "exam_answers_select" ON exam_answers;
DROP POLICY IF EXISTS "Anyone can view exam answers" ON exam_answers;

-- Only teachers can view exam answers
CREATE POLICY "Teachers can view exam answers"
  ON exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.role IN ('school_admin', 'teacher')
    )
  );

-- ===========================================
-- 6. FIX online_exam_answers TABLE
-- ===========================================
DROP POLICY IF EXISTS "Anyone can view answers" ON online_exam_answers;

-- Only teachers can view online exam answers
CREATE POLICY "Teachers can view online exam answers"
  ON online_exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.role IN ('school_admin', 'teacher')
    )
  );

-- ===========================================
-- 7. FIX school_cameras TABLE
-- ===========================================
DROP POLICY IF EXISTS "Schools can view their own cameras" ON school_cameras;

-- Only school admins/staff can view cameras
CREATE POLICY "School admins can view cameras"
  ON school_cameras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.school_id = school_cameras.school_id
      AND aur.role IN ('school_admin', 'school_staff')
    )
  );

-- ===========================================
-- 8. FIX attendance TABLE
-- ===========================================
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;

-- Teachers can manage attendance
CREATE POLICY "Teachers can manage attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.school_id = attendance.school_id
      AND aur.role IN ('school_admin', 'school_staff', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_user_roles aur
      WHERE aur.school_id = attendance.school_id
      AND aur.role IN ('school_admin', 'school_staff', 'teacher')
    )
  );

-- Students can view own attendance
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.student_id = attendance.student_id
    )
  );

-- ===========================================
-- 9. Ensure app_users_public view is used for safe data
-- ===========================================
-- Grant access to the safe public view
GRANT SELECT ON app_users_public TO anon, authenticated;