-- Add assignment_id to attendance table to link attendance to specific sessions
ALTER TABLE public.attendance 
ADD COLUMN assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE;

-- Add subject_id to attendance for easier filtering by subject
ALTER TABLE public.attendance
ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_attendance_assignment ON public.attendance(assignment_id);
CREATE INDEX idx_attendance_subject ON public.attendance(subject_id);

-- Update the unique constraint to prevent duplicate attendance records per session
-- First, drop any existing constraint if it exists
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_date_class_key;

-- Add new constraint that includes assignment_id
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_student_assignment_unique 
UNIQUE (student_id, assignment_id);