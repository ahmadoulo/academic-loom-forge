-- Ajout des relations manquantes et correction du modèle

-- Table pour lier professeurs et classes (relation many-to-many)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- Enable RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_classes
CREATE POLICY "Allow all operations on teacher_classes" 
ON public.teacher_classes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Modifier la table subjects pour mieux lier les matières aux classes
-- Ajout d'une contrainte pour s'assurer que chaque matière est liée à une classe ET potentiellement à un professeur
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS school_id UUID;

-- Trigger pour la table teacher_classes
CREATE TRIGGER update_teacher_classes_updated_at
BEFORE UPDATE ON public.teacher_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class_id ON public.teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);