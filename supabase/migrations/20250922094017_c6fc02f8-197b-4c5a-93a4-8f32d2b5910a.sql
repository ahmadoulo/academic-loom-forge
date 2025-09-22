-- Add grade_type column to grades table
ALTER TABLE public.grades ADD COLUMN grade_type TEXT NOT NULL DEFAULT 'controle' CHECK (grade_type IN ('controle', 'examen'));

-- Add subjects to classes relationship (many-to-many)
CREATE TABLE public.class_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- Enable RLS on class_subjects
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for class_subjects
CREATE POLICY "Allow all operations on class_subjects" 
ON public.class_subjects 
FOR ALL 
USING (true) 
WITH CHECK (true);