-- Create exam_documents table
CREATE TABLE IF NOT EXISTS public.exam_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  school_semester_id UUID REFERENCES public.school_semester(id) ON DELETE SET NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('devoir_surveille', 'controle', 'examen')),
  duration_minutes INTEGER NOT NULL,
  documents_allowed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(user_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_questions table
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_document_id UUID NOT NULL REFERENCES public.exam_documents(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  points NUMERIC NOT NULL,
  has_choices BOOLEAN NOT NULL DEFAULT false,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_answers table (for questions with choices)
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for exam_documents
ALTER TABLE public.exam_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own exam documents"
  ON public.exam_documents FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create exam documents"
  ON public.exam_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update their own exam documents"
  ON public.exam_documents FOR UPDATE
  USING (true);

CREATE POLICY "Teachers can delete their own exam documents"
  ON public.exam_documents FOR DELETE
  USING (true);

-- Add RLS policies for exam_questions
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam questions"
  ON public.exam_questions FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage exam questions"
  ON public.exam_questions FOR ALL
  USING (true);

-- Add RLS policies for exam_answers
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam answers"
  ON public.exam_answers FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage exam answers"
  ON public.exam_answers FOR ALL
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_exam_documents_teacher_id ON public.exam_documents(teacher_id);
CREATE INDEX idx_exam_documents_subject_id ON public.exam_documents(subject_id);
CREATE INDEX idx_exam_documents_school_id ON public.exam_documents(school_id);
CREATE INDEX idx_exam_questions_exam_document_id ON public.exam_questions(exam_document_id);
CREATE INDEX idx_exam_answers_question_id ON public.exam_answers(question_id);

-- Add trigger for updated_at
CREATE TRIGGER update_exam_documents_updated_at
  BEFORE UPDATE ON public.exam_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_questions_updated_at
  BEFORE UPDATE ON public.exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();