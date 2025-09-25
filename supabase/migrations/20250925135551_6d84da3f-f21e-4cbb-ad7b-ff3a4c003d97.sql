-- Create assignments table for exams, tests, and homework
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'exam', -- 'exam', 'test', 'homework'
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for assignments
CREATE POLICY "Teachers can view assignments for their school"
ON public.assignments
FOR SELECT
USING (true); -- For now, allow all authenticated users to see assignments

CREATE POLICY "Teachers can create assignments for their classes"
ON public.assignments
FOR INSERT
WITH CHECK (true); -- For now, allow all authenticated users to create assignments

CREATE POLICY "Teachers can update their own assignments"
ON public.assignments
FOR UPDATE
USING (true); -- For now, allow all authenticated users to update assignments

CREATE POLICY "Teachers can delete their own assignments"
ON public.assignments
FOR DELETE
USING (true); -- For now, allow all authenticated users to delete assignments

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();