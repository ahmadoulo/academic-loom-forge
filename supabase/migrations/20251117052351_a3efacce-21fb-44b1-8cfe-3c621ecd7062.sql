-- Add policy for admins to view submitted exam documents
CREATE POLICY "Admins can view submitted exam documents"
ON exam_documents
FOR SELECT
USING (
  status = 'submitted' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('global_admin', 'school_admin')
  )
);

-- Add policy for admins to view all exam questions
CREATE POLICY "Admins can view exam questions"
ON exam_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('global_admin', 'school_admin')
  )
);

-- Add policy for admins to view all exam answers
CREATE POLICY "Admins can view exam answers"
ON exam_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('global_admin', 'school_admin')
  )
);