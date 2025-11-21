-- Relax RLS on exam_documents to match rest of app model
DROP POLICY IF EXISTS "Teachers can insert exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can view their exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can update their exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can delete draft exam documents" ON exam_documents;
DROP POLICY IF EXISTS "School admins can view all exam documents" ON exam_documents;

CREATE POLICY "Allow all operations on exam_documents"
ON exam_documents
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Relax RLS on exam_questions
DROP POLICY IF EXISTS "Anyone can insert exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can view exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can update exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can delete exam questions" ON exam_questions;

CREATE POLICY "Allow all operations on exam_questions"
ON exam_questions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Relax RLS on exam_answers
DROP POLICY IF EXISTS "Anyone can insert exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can view exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can update exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can delete exam answers" ON exam_answers;

CREATE POLICY "Allow all operations on exam_answers"
ON exam_answers
FOR ALL
TO public
USING (true)
WITH CHECK (true);