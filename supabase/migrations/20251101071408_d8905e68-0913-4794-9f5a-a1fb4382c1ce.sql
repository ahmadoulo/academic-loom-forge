-- Add foreign key constraint from attendance to classes
ALTER TABLE public.attendance
ADD CONSTRAINT fk_attendance_class_id
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);