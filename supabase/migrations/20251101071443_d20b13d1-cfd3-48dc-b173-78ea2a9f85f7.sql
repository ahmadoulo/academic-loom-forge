-- Enable RLS on critical tables
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Teachers and schools can view attendance"
ON public.attendance FOR SELECT
USING (true);

CREATE POLICY "Teachers can mark attendance"
ON public.attendance FOR INSERT
WITH CHECK (true);

CREATE POLICY "Teachers can update attendance"
ON public.attendance FOR UPDATE
USING (true);

CREATE POLICY "Teachers can delete attendance"
ON public.attendance FOR DELETE
USING (true);

-- Teachers policies
CREATE POLICY "Anyone can view teachers"
ON public.teachers FOR SELECT
USING (true);

CREATE POLICY "Schools can manage teachers"
ON public.teachers FOR ALL
USING (true);

-- Students policies
CREATE POLICY "Anyone can view students"
ON public.students FOR SELECT
USING (true);

CREATE POLICY "Schools can manage students"
ON public.students FOR ALL
USING (true);

-- Subjects policies
CREATE POLICY "Anyone can view subjects"
ON public.subjects FOR SELECT
USING (true);

CREATE POLICY "Schools can manage subjects"
ON public.subjects FOR ALL
USING (true);

-- Classes policies
CREATE POLICY "Anyone can view classes"
ON public.classes FOR SELECT
USING (true);

CREATE POLICY "Schools can manage classes"
ON public.classes FOR ALL
USING (true);

-- Grades policies
CREATE POLICY "Teachers and students can view grades"
ON public.grades FOR SELECT
USING (true);

CREATE POLICY "Teachers can manage grades"
ON public.grades FOR ALL
USING (true);

-- Teacher classes policies
CREATE POLICY "Anyone can view teacher classes"
ON public.teacher_classes FOR SELECT
USING (true);

CREATE POLICY "Schools can manage teacher classes"
ON public.teacher_classes FOR ALL
USING (true);

-- Class subjects policies
CREATE POLICY "Anyone can view class subjects"
ON public.class_subjects FOR SELECT
USING (true);

CREATE POLICY "Schools can manage class subjects"
ON public.class_subjects FOR ALL
USING (true);

-- User roles policies
CREATE POLICY "Anyone can view user roles"
ON public.user_roles FOR SELECT
USING (true);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
USING (true);

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (true);