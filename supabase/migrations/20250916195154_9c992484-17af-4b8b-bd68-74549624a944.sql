-- Create the schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  identifier TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  grade NUMERIC(4,2) NOT NULL CHECK (grade >= 0 AND grade <= 20),
  comment TEXT,
  exam_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (MVP: open access for now, will be refined later)
CREATE POLICY "Allow all operations on schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.schools (name, identifier) VALUES 
  ('Lycée Saint-Martin', 'LSM001'),
  ('Collège République', 'CR002');

INSERT INTO public.classes (name, school_id) VALUES 
  ('Terminale S1', (SELECT id FROM public.schools WHERE identifier = 'LSM001')),
  ('Première ES2', (SELECT id FROM public.schools WHERE identifier = 'LSM001')),
  ('3ème A', (SELECT id FROM public.schools WHERE identifier = 'CR002'));

INSERT INTO public.teachers (firstname, lastname, email, school_id) VALUES 
  ('Marie', 'Dupont', 'marie.dupont@lsm.edu', (SELECT id FROM public.schools WHERE identifier = 'LSM001')),
  ('Pierre', 'Martin', 'pierre.martin@lsm.edu', (SELECT id FROM public.schools WHERE identifier = 'LSM001')),
  ('Sophie', 'Bernard', 'sophie.bernard@cr.edu', (SELECT id FROM public.schools WHERE identifier = 'CR002'));

INSERT INTO public.subjects (name, class_id, teacher_id) VALUES 
  ('Mathématiques', (SELECT id FROM public.classes WHERE name = 'Terminale S1'), (SELECT id FROM public.teachers WHERE lastname = 'Dupont')),
  ('Physique-Chimie', (SELECT id FROM public.classes WHERE name = 'Terminale S1'), (SELECT id FROM public.teachers WHERE lastname = 'Martin')),
  ('Histoire-Géographie', (SELECT id FROM public.classes WHERE name = '3ème A'), (SELECT id FROM public.teachers WHERE lastname = 'Bernard'));

INSERT INTO public.students (firstname, lastname, email, class_id, school_id) VALUES 
  ('Lucas', 'Moreau', 'lucas.moreau@student.com', (SELECT id FROM public.classes WHERE name = 'Terminale S1'), (SELECT id FROM public.schools WHERE identifier = 'LSM001')),
  ('Emma', 'Leroy', 'emma.leroy@student.com', (SELECT id FROM public.classes WHERE name = 'Terminale S1'), (SELECT id FROM public.schools WHERE identifier = 'LSM001')),
  ('Tom', 'Garcia', 'tom.garcia@student.com', (SELECT id FROM public.classes WHERE name = '3ème A'), (SELECT id FROM public.schools WHERE identifier = 'CR002'));

INSERT INTO public.grades (student_id, subject_id, teacher_id, grade, comment, exam_date) VALUES 
  (
    (SELECT id FROM public.students WHERE lastname = 'Moreau'),
    (SELECT id FROM public.subjects WHERE name = 'Mathématiques'),
    (SELECT id FROM public.teachers WHERE lastname = 'Dupont'),
    15.5, 'Très bon travail', '2024-01-15'
  ),
  (
    (SELECT id FROM public.students WHERE lastname = 'Leroy'),
    (SELECT id FROM public.subjects WHERE name = 'Mathématiques'),
    (SELECT id FROM public.teachers WHERE lastname = 'Dupont'),
    12.0, 'Peut mieux faire', '2024-01-15'
  );