-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can create exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can create their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can view their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can update their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can delete their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Admins can view submitted exam documents" ON exam_documents;

-- Create simplified and working policies for exam_documents
CREATE POLICY "Teachers can insert exam documents"
ON exam_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Teachers can view their exam documents"
ON exam_documents
FOR SELECT
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "School admins can view all exam documents"
ON exam_documents
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('school_admin', 'global_admin')
  )
);

CREATE POLICY "Teachers can update their exam documents"
ON exam_documents
FOR UPDATE
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Teachers can delete draft exam documents"
ON exam_documents
FOR DELETE
TO authenticated
USING (
  status = 'draft' 
  AND teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Policies for exam_questions
DROP POLICY IF EXISTS "Teachers can create exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can view their exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can manage exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Anyone can view exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Admins can view exam questions" ON exam_questions;

CREATE POLICY "Anyone can insert exam questions"
ON exam_questions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view exam questions"
ON exam_questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update exam questions"
ON exam_questions
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete exam questions"
ON exam_questions
FOR DELETE
TO authenticated
USING (true);

-- Policies for exam_answers
DROP POLICY IF EXISTS "Teachers can create exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Teachers can view their exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Teachers can manage exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Anyone can view exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Admins can view exam answers" ON exam_answers;

CREATE POLICY "Anyone can insert exam answers"
ON exam_answers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view exam answers"
ON exam_answers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update exam answers"
ON exam_answers
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete exam answers"
ON exam_answers
FOR DELETE
TO authenticated
USING (true);