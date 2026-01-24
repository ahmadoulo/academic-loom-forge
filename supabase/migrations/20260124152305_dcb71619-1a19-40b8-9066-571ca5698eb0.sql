-- Add school_id column to attendance table if it doesn't exist
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS school_id uuid;

-- Add foreign key constraint for school_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_school_id_fkey' 
        AND table_name = 'attendance'
    ) THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT attendance_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for school_id if not exists
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance(school_id);

-- Update existing attendance records to set school_id from classes
UPDATE public.attendance a
SET school_id = c.school_id
FROM public.classes c
WHERE a.class_id = c.id AND a.school_id IS NULL;