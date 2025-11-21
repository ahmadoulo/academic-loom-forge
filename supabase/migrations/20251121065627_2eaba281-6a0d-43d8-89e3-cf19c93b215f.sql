-- Temporarily disable RLS on exam-related tables so they work without authentication
ALTER TABLE exam_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers DISABLE ROW LEVEL SECURITY;