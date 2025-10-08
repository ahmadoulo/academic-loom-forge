-- Ajouter des colonnes pour les séances de cours dans la table assignments
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS start_time time,
ADD COLUMN IF NOT EXISTS end_time time,
ADD COLUMN IF NOT EXISTS session_date date;

-- Mettre à jour le type pour inclure 'course' (séance de cours)
ALTER TABLE public.assignments 
ALTER COLUMN type SET DEFAULT 'course';

-- Commentaires pour clarifier l'usage
COMMENT ON COLUMN public.assignments.type IS 'Type: course (séance), exam (examen), assignment (devoir)';
COMMENT ON COLUMN public.assignments.session_date IS 'Date de la séance de cours';
COMMENT ON COLUMN public.assignments.start_time IS 'Heure de début de la séance';
COMMENT ON COLUMN public.assignments.end_time IS 'Heure de fin de la séance';