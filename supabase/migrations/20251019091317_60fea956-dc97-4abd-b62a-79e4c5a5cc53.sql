-- Créer la table des salles de cours
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  building TEXT,
  floor TEXT,
  equipment TEXT[], -- Tableau pour stocker les équipements disponibles
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Créer la table d'assignation des salles aux séances
CREATE TABLE public.classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, assignment_id)
);

-- Activer RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour classrooms
CREATE POLICY "Schools can view their classrooms"
ON public.classrooms FOR SELECT
USING (true);

CREATE POLICY "Schools can create classrooms"
ON public.classrooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can update their classrooms"
ON public.classrooms FOR UPDATE
USING (true);

CREATE POLICY "Schools can delete their classrooms"
ON public.classrooms FOR DELETE
USING (true);

-- Politiques RLS pour classroom_assignments
CREATE POLICY "Schools can view their classroom assignments"
ON public.classroom_assignments FOR SELECT
USING (true);

CREATE POLICY "Schools can create classroom assignments"
ON public.classroom_assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can update their classroom assignments"
ON public.classroom_assignments FOR UPDATE
USING (true);

CREATE POLICY "Schools can delete their classroom assignments"
ON public.classroom_assignments FOR DELETE
USING (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_classrooms_updated_at
BEFORE UPDATE ON public.classrooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classroom_assignments_updated_at
BEFORE UPDATE ON public.classroom_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour vérifier les conflits d'horaires
CREATE OR REPLACE FUNCTION public.check_classroom_availability(
  p_classroom_id UUID,
  p_assignment_id UUID,
  p_school_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_conflict_count INTEGER;
BEGIN
  -- Récupérer les informations de la séance
  SELECT session_date, start_time, end_time
  INTO v_session_date, v_start_time, v_end_time
  FROM assignments
  WHERE id = p_assignment_id;
  
  -- Vérifier s'il y a des conflits
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM classroom_assignments ca
  JOIN assignments a ON ca.assignment_id = a.id
  WHERE ca.classroom_id = p_classroom_id
    AND ca.school_id = p_school_id
    AND a.session_date = v_session_date
    AND a.id != p_assignment_id
    AND (
      -- Vérifier les chevauchements d'horaires
      (a.start_time < v_end_time AND a.end_time > v_start_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;