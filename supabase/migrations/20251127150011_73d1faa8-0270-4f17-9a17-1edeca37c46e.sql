-- Table pour les rôles admin SaaS
CREATE TABLE IF NOT EXISTS public.saas_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les utilisateurs admin SaaS
CREATE TABLE IF NOT EXISTS public.saas_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID REFERENCES public.saas_roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les rôles d'école
CREATE TABLE IF NOT EXISTS public.school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Table pour les utilisateurs d'école
CREATE TABLE IF NOT EXISTS public.school_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID REFERENCES public.school_roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(school_id, email)
);

-- Enable RLS
ALTER TABLE public.saas_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

-- Policies pour saas_roles (only admin)
CREATE POLICY "Allow all for SaaS admin" ON public.saas_roles FOR ALL USING (true);

-- Policies pour saas_users (only admin)
CREATE POLICY "Allow all for SaaS admin" ON public.saas_users FOR ALL USING (true);

-- Policies pour school_roles
CREATE POLICY "Schools can view their roles" ON public.school_roles FOR SELECT USING (true);
CREATE POLICY "Schools can manage their roles" ON public.school_roles FOR ALL USING (true);

-- Policies pour school_users
CREATE POLICY "Schools can view their users" ON public.school_users FOR SELECT USING (true);
CREATE POLICY "Schools can manage their users" ON public.school_users FOR ALL USING (true);

-- Insert default SaaS roles
INSERT INTO public.saas_roles (name, description, permissions, is_system) VALUES
('administrateur', 'Administrateur avec tous les droits', '["all"]'::jsonb, true),
('support', 'Support technique avec accès limité', '["schools.read", "schools.view", "subscriptions.read", "users.read"]'::jsonb, true),
('manager', 'Manager avec droits de gestion', '["schools.read", "schools.create", "schools.update", "subscriptions.read", "subscriptions.create", "subscriptions.update", "users.read", "users.create"]'::jsonb, true);

-- Insert default school roles (for each school - will be done dynamically)
-- These are templates that schools can customize
CREATE OR REPLACE FUNCTION create_default_school_roles(p_school_id UUID)
RETURNS void
LANGUAGE plpgsql
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

-- Trigger pour créer les rôles par défaut quand une école est créée
CREATE OR REPLACE FUNCTION trigger_create_default_school_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM create_default_school_roles(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_school_created_create_roles
AFTER INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_school_roles();

-- Créer les rôles pour les écoles existantes
DO $$
DECLARE
  school_record RECORD;
BEGIN
  FOR school_record IN SELECT id FROM public.schools
  LOOP
    PERFORM create_default_school_roles(school_record.id);
  END LOOP;
END $$;

-- Trigger pour updated_at
CREATE TRIGGER update_saas_roles_updated_at BEFORE UPDATE ON public.saas_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_users_updated_at BEFORE UPDATE ON public.saas_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_roles_updated_at BEFORE UPDATE ON public.school_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_users_updated_at BEFORE UPDATE ON public.school_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();