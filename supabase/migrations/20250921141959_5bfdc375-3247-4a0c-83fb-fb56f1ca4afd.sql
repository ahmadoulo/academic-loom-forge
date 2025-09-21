-- Ensure subjects table has school_id column and proper relationships
-- First, check if school_id exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'school_id') THEN
        ALTER TABLE public.subjects ADD COLUMN school_id uuid;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'subjects' AND constraint_name = 'fk_subjects_school_id'
    ) THEN
        ALTER TABLE public.subjects 
        ADD CONSTRAINT fk_subjects_school_id 
        FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing subjects to have school_id based on their class's school_id
UPDATE public.subjects 
SET school_id = classes.school_id 
FROM public.classes 
WHERE subjects.class_id = classes.id 
AND subjects.school_id IS NULL;