-- Add foreign key constraints for assignments table
ALTER TABLE public.assignments 
ADD CONSTRAINT fk_assignments_school_id 
FOREIGN KEY (school_id) REFERENCES public.schools(id);

ALTER TABLE public.assignments 
ADD CONSTRAINT fk_assignments_teacher_id 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);

ALTER TABLE public.assignments 
ADD CONSTRAINT fk_assignments_class_id 
FOREIGN KEY (class_id) REFERENCES public.classes(id);