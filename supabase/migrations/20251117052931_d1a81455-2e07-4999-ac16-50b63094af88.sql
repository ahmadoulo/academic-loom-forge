-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Teachers can view their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can create their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can update their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can delete their own exam documents" ON exam_documents;
DROP POLICY IF EXISTS "Teachers can view their exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can create exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can view their exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Teachers can create exam answers" ON exam_answers;

-- Recréer les politiques pour les professeurs
CREATE POLICY "Teachers can create their own exam documents"
ON exam_documents
FOR INSERT
WITH CHECK (
  teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Teachers can view their own exam documents"
ON exam_documents
FOR SELECT
USING (
  teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Teachers can update their own exam documents"
ON exam_documents
FOR UPDATE
USING (
  teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Teachers can delete their own exam documents"
ON exam_documents
FOR DELETE
USING (
  status = 'draft' AND
  teacher_id IN (
    SELECT id FROM teachers 
    WHERE email IN (
      SELECT email FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Teachers can create exam questions"
ON exam_questions
FOR INSERT
WITH CHECK (
  exam_document_id IN (
    SELECT id FROM exam_documents
    WHERE teacher_id IN (
      SELECT id FROM teachers 
      WHERE email IN (
        SELECT email FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Teachers can view their exam questions"
ON exam_questions
FOR SELECT
USING (
  exam_document_id IN (
    SELECT id FROM exam_documents
    WHERE teacher_id IN (
      SELECT id FROM teachers 
      WHERE email IN (
        SELECT email FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Teachers can create exam answers"
ON exam_answers
FOR INSERT
WITH CHECK (
  question_id IN (
    SELECT eq.id FROM exam_questions eq
    JOIN exam_documents ed ON ed.id = eq.exam_document_id
    WHERE ed.teacher_id IN (
      SELECT id FROM teachers 
      WHERE email IN (
        SELECT email FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Teachers can view their exam answers"
ON exam_answers
FOR SELECT
USING (
  question_id IN (
    SELECT eq.id FROM exam_questions eq
    JOIN exam_documents ed ON ed.id = eq.exam_document_id
    WHERE ed.teacher_id IN (
      SELECT id FROM teachers 
      WHERE email IN (
        SELECT email FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
);