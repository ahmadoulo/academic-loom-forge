-- Supprimer toutes les politiques RLS des tables où RLS est désactivé pour éviter les erreurs de linting

-- Supprimer les politiques de la table attendance
DROP POLICY IF EXISTS "Teachers can create attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can delete attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can update attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view attendance for their classes" ON public.attendance;

-- Supprimer les politiques de la table attendance_sessions
DROP POLICY IF EXISTS "Teachers can manage their attendance sessions" ON public.attendance_sessions;

-- Supprimer les politiques de la table class_subjects
DROP POLICY IF EXISTS "Allow all operations on class_subjects" ON public.class_subjects;

-- Supprimer les politiques de la table classes
DROP POLICY IF EXISTS "Allow all operations on classes" ON public.classes;

-- Supprimer les politiques de la table grades
DROP POLICY IF EXISTS "Allow all operations on grades" ON public.grades;

-- Supprimer les politiques de la table schools
DROP POLICY IF EXISTS "Allow all operations on schools" ON public.schools;

-- Supprimer les politiques de la table students
DROP POLICY IF EXISTS "Allow all operations on students" ON public.students;

-- Supprimer les politiques de la table subjects
DROP POLICY IF EXISTS "Allow all operations on subjects" ON public.subjects;

-- Supprimer les politiques de la table teacher_classes
DROP POLICY IF EXISTS "Allow all operations on teacher_classes" ON public.teacher_classes;

-- Supprimer les politiques de la table teachers
DROP POLICY IF EXISTS "Allow all operations on teachers" ON public.teachers;

-- Supprimer les politiques de la table user_credentials
DROP POLICY IF EXISTS "Admins can manage all user credentials" ON public.user_credentials;