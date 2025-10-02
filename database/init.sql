-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    identifier TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT,
    cin_number TEXT,
    birth_date DATE,
    student_phone TEXT,
    parent_phone TEXT,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    school_id UUID REFERENCES public.schools(id),
    teacher_id UUID REFERENCES public.teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create teacher_classes table
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(teacher_id, class_id)
);

-- Create class_subjects table
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    grade NUMERIC NOT NULL,
    grade_type TEXT DEFAULT 'controle'::text NOT NULL,
    comment TEXT,
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    status TEXT DEFAULT 'absent'::text NOT NULL,
    method TEXT DEFAULT 'manual'::text NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(student_id, class_id, date)
);

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    session_code TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_classes_updated_at
    BEFORE UPDATE ON public.teacher_classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON public.grades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_sessions_updated_at
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'exam',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create document_requests table
CREATE TABLE IF NOT EXISTS public.document_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    document_type TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create document_request_tracking table
CREATE TABLE IF NOT EXISTS public.document_request_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.document_requests(id),
    student_id UUID NOT NULL REFERENCES public.students(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    status TEXT NOT NULL,
    comment TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add triggers for new tables
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_requests_updated_at
    BEFORE UPDATE ON public.document_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_request_tracking ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (for development)
CREATE POLICY "Allow all operations on schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on teacher_classes" ON public.teacher_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on class_subjects" ON public.class_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Teachers can manage attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Teachers can manage attendance sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on document_requests" ON public.document_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on document_request_tracking" ON public.document_request_tracking FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO public.schools (name, identifier) VALUES 
    ('École Primaire Victor Hugo', 'EPV001'),
    ('Collège Jean Monnet', 'CJM002'),
    ('Lycée Marie Curie', 'LMC003')
ON CONFLICT (identifier) DO NOTHING;

-- Insert sample teachers
INSERT INTO public.teachers (firstname, lastname, email, school_id) 
SELECT 'Jean', 'Dupont', 'jean.dupont@ecole.fr', s.id FROM public.schools s WHERE s.identifier = 'EPV001'
UNION ALL
SELECT 'Marie', 'Martin', 'marie.martin@ecole.fr', s.id FROM public.schools s WHERE s.identifier = 'EPV001'
UNION ALL
SELECT 'Pierre', 'Durand', 'pierre.durand@college.fr', s.id FROM public.schools s WHERE s.identifier = 'CJM002';

-- Insert sample classes
INSERT INTO public.classes (name, school_id)
SELECT 'CM1-A', s.id FROM public.schools s WHERE s.identifier = 'EPV001'
UNION ALL
SELECT 'CM2-B', s.id FROM public.schools s WHERE s.identifier = 'EPV001'
UNION ALL
SELECT '6ème-1', s.id FROM public.schools s WHERE s.identifier = 'CJM002';

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM (
    'global_admin',
    'school_admin', 
    'teacher',
    'student',
    'parent'
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role public.app_role NOT NULL DEFAULT 'student',
    school_id UUID REFERENCES public.schools(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL,
    school_id UUID REFERENCES public.schools(id),
    granted_by UUID REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Create user_credentials table (for custom auth system)
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    school_id UUID REFERENCES public.schools(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Add triggers for new tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON public.user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create permissive policies for new tables (for development)
CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_credentials" ON public.user_credentials FOR ALL USING (true) WITH CHECK (true);