-- Ajout des clés étrangères pour la table teacher_classes
ALTER TABLE public.teacher_classes 
ADD CONSTRAINT fk_teacher_classes_teacher_id 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_classes 
ADD CONSTRAINT fk_teacher_classes_class_id 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Ajout de la clé étrangère school_id pour subjects
ALTER TABLE public.subjects 
ADD CONSTRAINT fk_subjects_school_id 
FOREIGN KEY (school_id) REFERENCES public.schools(id);

-- Mise à jour des données existantes pour subjects.school_id
UPDATE public.subjects 
SET school_id = classes.school_id 
FROM public.classes 
WHERE subjects.class_id = classes.id;