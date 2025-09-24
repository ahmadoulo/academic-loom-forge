-- Ajouter les nouveaux champs à la table students
ALTER TABLE public.students 
ADD COLUMN birth_date date,
ADD COLUMN cin_number text,
ADD COLUMN student_phone text,
ADD COLUMN parent_phone text;

-- Ajouter un index sur le numéro CIN pour les recherches rapides
CREATE INDEX idx_students_cin ON public.students(cin_number);

-- Créer une fonction pour générer automatiquement un compte utilisateur lors de l'ajout d'un étudiant
CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password text;
BEGIN
  -- Utiliser le CIN comme mot de passe temporaire si disponible, sinon générer un mot de passe
  temp_password := COALESCE(NEW.cin_number, 'student' || NEW.id::text);
  
  -- Créer le compte utilisateur seulement si un email est fourni
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    -- Insérer dans la table profiles
    INSERT INTO public.profiles (
      user_id, 
      email, 
      first_name, 
      last_name, 
      role, 
      school_id,
      is_active
    ) VALUES (
      gen_random_uuid(), -- Pour l'instant on génère un UUID, l'auth viendra plus tard
      NEW.email,
      NEW.firstname,
      NEW.lastname,
      'student'::app_role,
      NEW.school_id,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer un trigger pour appeler automatiquement cette fonction
CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.create_student_account();

-- Fonction pour générer un mot de passe aléatoirement
CREATE OR REPLACE FUNCTION public.generate_random_password(length int DEFAULT 12)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result text := '';
    i int := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$;