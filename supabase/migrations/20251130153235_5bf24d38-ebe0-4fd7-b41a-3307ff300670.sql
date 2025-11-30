-- Create online exams table
CREATE TABLE IF NOT EXISTS public.online_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  allow_window_switch BOOLEAN NOT NULL DEFAULT false,
  max_warnings INTEGER NOT NULL DEFAULT 3,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create online exam questions table
CREATE TABLE IF NOT EXISTS public.online_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  points NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create online exam answers table
CREATE TABLE IF NOT EXISTS public.online_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student exam attempts table
CREATE TABLE IF NOT EXISTS public.student_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  warning_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student exam responses table
CREATE TABLE IF NOT EXISTS public.student_exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.online_exam_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES public.online_exam_answers(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for online_exams
CREATE POLICY "Teachers can manage their exams" ON public.online_exams
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Students can view published exams" ON public.online_exams
  FOR SELECT USING (is_published = true);

-- RLS Policies for online_exam_questions
CREATE POLICY "Anyone can view questions" ON public.online_exam_questions
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage questions" ON public.online_exam_questions
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for online_exam_answers
CREATE POLICY "Anyone can view answers" ON public.online_exam_answers
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage answers" ON public.online_exam_answers
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for student_exam_attempts
CREATE POLICY "Students can manage their attempts" ON public.student_exam_attempts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Teachers can view attempts" ON public.student_exam_attempts
  FOR SELECT USING (true);

-- RLS Policies for student_exam_responses
CREATE POLICY "Students can manage their responses" ON public.student_exam_responses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Teachers can view responses" ON public.student_exam_responses
  FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_online_exams_teacher ON public.online_exams(teacher_id);
CREATE INDEX idx_online_exams_class ON public.online_exams(class_id);
CREATE INDEX idx_online_exam_questions_exam ON public.online_exam_questions(exam_id);
CREATE INDEX idx_online_exam_answers_question ON public.online_exam_answers(question_id);
CREATE INDEX idx_student_exam_attempts_exam ON public.student_exam_attempts(exam_id);
CREATE INDEX idx_student_exam_attempts_student ON public.student_exam_attempts(student_id);
CREATE INDEX idx_student_exam_responses_attempt ON public.student_exam_responses(attempt_id);