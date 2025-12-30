-- Activer RLS sur profiles, user_credentials, user_roles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies restrictives sur les anciennes tables (personne n'y accède)
CREATE POLICY "No access profiles" ON profiles FOR ALL USING (false);
CREATE POLICY "No access user_credentials" ON user_credentials FOR ALL USING (false);
CREATE POLICY "No access user_roles" ON user_roles FOR ALL USING (false);

-- Supprimer les anciennes tables non utilisées (après la migration)
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS student_accounts CASCADE;

-- Corriger les fonctions sans search_path
CREATE OR REPLACE FUNCTION public.prevent_archive_current_semester()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.archived = true AND NEW.is_actual = true THEN
    RAISE EXCEPTION 'Cannot archive the current active semester';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;