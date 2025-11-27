-- Fix search_path for functions (drop trigger first)
DROP TRIGGER IF EXISTS on_school_created_create_roles ON public.schools;
DROP FUNCTION IF EXISTS trigger_create_default_school_roles();
DROP FUNCTION IF EXISTS create_default_school_roles(UUID);

CREATE OR REPLACE FUNCTION create_default_school_roles(p_school_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.school_roles (school_id, name, description, permissions, is_system) VALUES
  (p_school_id, 'Administrateur', 'Administrateur avec tous les droits sur l''école', '["all"]'::jsonb, true),
  (p_school_id, 'Directeur', 'Directeur avec droits de gestion complets', '["students.all", "teachers.all", "classes.all", "grades.all", "attendance.all", "reports.all", "settings.read"]'::jsonb, true),
  (p_school_id, 'Secrétaire', 'Secrétaire avec accès lecture/écriture limité', '["students.read", "students.create", "students.update", "teachers.read", "classes.read", "reports.read"]'::jsonb, true),
  (p_school_id, 'Comptable', 'Comptable avec accès aux finances', '["students.read", "reports.read", "subscriptions.read"]'::jsonb, true),
  (p_school_id, 'Lecteur', 'Lecture seule sur toutes les données', '["students.read", "teachers.read", "classes.read", "grades.read", "attendance.read", "reports.read"]'::jsonb, true)
  ON CONFLICT (school_id, name) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_create_default_school_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_default_school_roles(NEW.id);
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_school_created_create_roles
AFTER INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_school_roles();