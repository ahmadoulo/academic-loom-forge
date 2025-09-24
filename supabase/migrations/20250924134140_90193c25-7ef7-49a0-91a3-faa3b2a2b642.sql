-- Créer la table pour l'authentification personnalisée
CREATE TABLE public.user_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  school_id uuid REFERENCES public.schools(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone
);

-- Activer RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent gérer tous les comptes
CREATE POLICY "Admins can manage all user credentials" 
ON public.user_credentials 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Index pour optimiser les recherches par email
CREATE INDEX idx_user_credentials_email ON public.user_credentials(email);
CREATE INDEX idx_user_credentials_school_id ON public.user_credentials(school_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_credentials_updated_at
BEFORE UPDATE ON public.user_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();