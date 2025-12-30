-- Phase 1: Création du système d'authentification unifié

-- 1.1 Créer la table unifiée app_users
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- bcrypt, nullable pour invitation en attente
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- Lien vers l'école (NULL pour global_admin)
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  
  -- Liens vers les entités métier (optionnels)
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  
  -- Statut du compte
  is_active BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Système d'invitation
  invitation_token TEXT,
  invitation_expires_at TIMESTAMPTZ,
  
  -- Gestion de session
  last_login TIMESTAMPTZ,
  session_token TEXT,
  session_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_school_id ON public.app_users(school_id);
CREATE INDEX idx_app_users_session_token ON public.app_users(session_token);
CREATE INDEX idx_app_users_invitation_token ON public.app_users(invitation_token);

-- 1.2 Créer la table des rôles
CREATE TABLE public.app_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE, -- NULL pour rôles globaux
  granted_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Un utilisateur ne peut avoir le même rôle qu'une fois par école
  UNIQUE(user_id, role, school_id)
);

-- Index pour les recherches de rôles
CREATE INDEX idx_app_user_roles_user_id ON public.app_user_roles(user_id);
CREATE INDEX idx_app_user_roles_school_id ON public.app_user_roles(school_id);
CREATE INDEX idx_app_user_roles_role ON public.app_user_roles(role);

-- 1.3 Fonction de vérification des rôles (SECURITY DEFINER pour éviter récursion RLS)
CREATE OR REPLACE FUNCTION public.check_user_role(
  _user_id UUID, 
  _role app_role,
  _school_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles
    WHERE user_id = _user_id 
    AND role = _role
    AND (
      -- Pour les rôles globaux (global_admin), school_id est NULL
      (_school_id IS NULL AND school_id IS NULL)
      OR
      -- Pour les rôles liés à une école
      (school_id = _school_id)
      OR
      -- Si on ne spécifie pas d'école, on vérifie juste le rôle
      (_school_id IS NULL AND role = 'global_admin')
    )
  )
$$;

-- 1.4 Fonction pour obtenir tous les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role app_role, school_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, school_id FROM app_user_roles WHERE user_id = _user_id
$$;

-- 1.5 Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_app_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_app_users_updated_at();

-- 1.6 Activer RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;

-- 1.7 Policies RLS pour app_users
-- Permettre toutes les opérations via service role (Edge Functions)
CREATE POLICY "Service role full access on app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);

-- 1.8 Policies RLS pour app_user_roles
CREATE POLICY "Service role full access on app_user_roles" ON public.app_user_roles
  FOR ALL USING (true) WITH CHECK (true);