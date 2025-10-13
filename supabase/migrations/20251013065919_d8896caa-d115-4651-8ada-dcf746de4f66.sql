-- Supprimer l'ancienne contrainte unique qui ne prend pas en compte la matière
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_student_id_class_id_date_key;

-- Ajouter une nouvelle contrainte unique incluant subject_id
-- Cela permet à plusieurs professeurs de marquer la présence pour différentes matières
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_student_class_date_subject_unique 
UNIQUE (student_id, class_id, date, subject_id);

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_attendance_subject_date 
ON public.attendance(subject_id, date, class_id);