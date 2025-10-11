-- Nettoyer les données orphelines avant d'ajouter les contraintes
DELETE FROM public.attendance 
WHERE student_id NOT IN (SELECT id FROM public.students);

DELETE FROM public.attendance 
WHERE assignment_id IS NOT NULL AND assignment_id NOT IN (SELECT id FROM public.assignments);

DELETE FROM public.attendance 
WHERE subject_id IS NOT NULL AND subject_id NOT IN (SELECT id FROM public.subjects);

-- Ajouter uniquement la contrainte student_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'attendance_student_id_fkey'
    ) THEN
        ALTER TABLE public.attendance
        ADD CONSTRAINT attendance_student_id_fkey 
        FOREIGN KEY (student_id) 
        REFERENCES public.students(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);