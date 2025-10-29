-- Create school_semester table
CREATE TABLE IF NOT EXISTS public.school_semester (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_actual BOOLEAN DEFAULT false,
  is_next BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create unique partial index to ensure only one actual semester per school
CREATE UNIQUE INDEX IF NOT EXISTS unique_actual_semester_per_school 
  ON public.school_semester(school_id) 
  WHERE is_actual = true;

-- Add school_semester_id to grades table
ALTER TABLE public.grades 
ADD COLUMN IF NOT EXISTS school_semester_id UUID REFERENCES public.school_semester(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_semester_school_year ON public.school_semester(school_id, school_year_id);
CREATE INDEX IF NOT EXISTS idx_school_semester_actual ON public.school_semester(school_id, is_actual) WHERE is_actual = true;
CREATE INDEX IF NOT EXISTS idx_grades_semester ON public.grades(school_semester_id);

-- Enable RLS
ALTER TABLE public.school_semester ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_semester
CREATE POLICY "Anyone can view semesters"
  ON public.school_semester
  FOR SELECT
  USING (true);

CREATE POLICY "Schools can insert semesters"
  ON public.school_semester
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update semesters"
  ON public.school_semester
  FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete semesters"
  ON public.school_semester
  FOR DELETE
  USING (true);

-- Function to set current semester (only one actual per school)
CREATE OR REPLACE FUNCTION public.set_current_semester(semester_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id UUID;
BEGIN
  -- Get school_id from the semester
  SELECT school_id INTO v_school_id
  FROM school_semester
  WHERE id = semester_id;
  
  -- Reset all is_actual to false for this school
  UPDATE school_semester 
  SET is_actual = false, is_next = false
  WHERE school_id = v_school_id;
  
  -- Set the specified semester as actual
  UPDATE school_semester 
  SET is_actual = true, is_next = false
  WHERE id = semester_id;
END;
$$;

-- Function to automatically transition semesters based on dates
CREATE OR REPLACE FUNCTION public.auto_transition_semesters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_semester RECORD;
BEGIN
  -- Loop through all active semesters that have ended
  FOR v_semester IN 
    SELECT s.id, s.school_id
    FROM school_semester s
    WHERE s.is_actual = true 
    AND s.end_date < CURRENT_DATE
  LOOP
    -- Find the next semester for this school
    UPDATE school_semester
    SET is_actual = true, is_next = false
    WHERE school_id = v_semester.school_id
    AND start_date > (SELECT end_date FROM school_semester WHERE id = v_semester.id)
    AND id IN (
      SELECT id FROM school_semester
      WHERE school_id = v_semester.school_id
      AND start_date > (SELECT end_date FROM school_semester WHERE id = v_semester.id)
      ORDER BY start_date ASC
      LIMIT 1
    );
    
    -- Set old semester as not actual
    UPDATE school_semester
    SET is_actual = false
    WHERE id = v_semester.id;
  END LOOP;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_school_semester_updated_at
  BEFORE UPDATE ON public.school_semester
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();