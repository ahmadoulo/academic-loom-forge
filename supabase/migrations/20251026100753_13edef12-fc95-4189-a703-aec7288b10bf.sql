-- Create student_school junction table for historical tracking
CREATE TABLE IF NOT EXISTS public.student_school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, school_id, school_year_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_school_student ON public.student_school(student_id);
CREATE INDEX IF NOT EXISTS idx_student_school_active ON public.student_school(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_student_school_year ON public.student_school(school_year_id);
CREATE INDEX IF NOT EXISTS idx_student_school_school ON public.student_school(school_id);

-- Add trigger for updated_at
CREATE TRIGGER update_student_school_updated_at
  BEFORE UPDATE ON public.student_school
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.student_school ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view student_school"
  ON public.student_school FOR SELECT
  USING (true);

CREATE POLICY "Schools can insert student_school"
  ON public.student_school FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update student_school"
  ON public.student_school FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete student_school"
  ON public.student_school FOR DELETE
  USING (true);

-- Populate with existing student enrollments
INSERT INTO public.student_school (student_id, school_id, school_year_id, class_id, is_active, enrolled_at)
SELECT 
  s.id as student_id,
  s.school_id,
  s.school_year_id,
  s.class_id,
  true as is_active,
  s.created_at as enrolled_at
FROM public.students s
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_school ss 
  WHERE ss.student_id = s.id 
  AND ss.school_id = s.school_id 
  AND ss.school_year_id = s.school_year_id
);