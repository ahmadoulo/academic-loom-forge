-- Ajouter la colonne subject_id à la table assignments
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);

-- Mettre à jour les enregistrements existants pour lier les assignments aux subjects via les classes
-- Cette mise à jour est facultative et dépend de la logique métier
UPDATE public.assignments a
SET subject_id = (
  SELECT s.id 
  FROM public.subjects s 
  WHERE s.class_id = a.class_id 
  AND s.teacher_id = a.teacher_id 
  LIMIT 1
)
WHERE a.subject_id IS NULL;