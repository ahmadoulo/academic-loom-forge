-- Vérifier les triggers existants sur la table students
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'students';

-- Supprimer TOUS les triggers qui utilisent la fonction create_student_account
DROP TRIGGER IF EXISTS trigger_create_student_account ON students;
DROP TRIGGER IF EXISTS on_student_created ON students;

-- Maintenant supprimer la fonction avec CASCADE pour être sûr
DROP FUNCTION IF EXISTS public.create_student_account() CASCADE;

-- Créer une nouvelle fonction simplifiée
CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Pour l'instant, on ne fait rien - juste retourner NEW
  -- La création de compte utilisateur sera gérée séparément
  RETURN NEW;
END;
$function$;