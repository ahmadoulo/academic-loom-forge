-- Rollback: Restaurer school_years à son état original (sans school_id)

-- Étape 1: Supprimer les index créés
DROP INDEX IF EXISTS idx_school_years_school_id;
DROP INDEX IF EXISTS idx_school_years_school_current;
DROP INDEX IF EXISTS idx_school_years_school_next;
DROP INDEX IF EXISTS idx_unique_current_year_per_school;
DROP INDEX IF EXISTS idx_unique_next_year_per_school;

-- Étape 2: Restaurer les fonctions à leur état original
CREATE OR REPLACE FUNCTION public.create_next_school_year(current_year_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_year_data RECORD;
  next_year_start DATE;
  next_year_end DATE;
  next_year_name TEXT;
  new_year_id UUID;
BEGIN
  -- Get current year data
  SELECT * INTO current_year_data
  FROM school_years
  WHERE id = current_year_id;
  
  -- Calculate next year dates
  next_year_start := current_year_data.start_date + INTERVAL '1 year';
  next_year_end := current_year_data.end_date + INTERVAL '1 year';
  
  -- Generate next year name
  next_year_name := TO_CHAR(next_year_start, 'YYYY') || '-' || TO_CHAR(next_year_end, 'YYYY');
  
  -- Check if next year already exists
  SELECT id INTO new_year_id
  FROM school_years
  WHERE start_date = next_year_start;
  
  -- If not exists, create it
  IF new_year_id IS NULL THEN
    INSERT INTO school_years (name, start_date, end_date, is_current, is_next)
    VALUES (next_year_name, next_year_start, next_year_end, false, true)
    RETURNING id INTO new_year_id;
  ELSE
    -- If exists, mark it as next
    UPDATE school_years SET is_next = true WHERE id = new_year_id;
  END IF;
  
  RETURN new_year_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_current_school_year(year_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset all is_current to false
  UPDATE school_years SET is_current = false;
  
  -- Set the specified year as current
  UPDATE school_years 
  SET is_current = true, is_next = false
  WHERE id = year_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_school_year(year_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset all is_next to false
  UPDATE school_years SET is_next = false;
  
  -- Set the specified year as next
  UPDATE school_years 
  SET is_next = true 
  WHERE id = year_id;
END;
$function$;

-- Étape 3: Conserver une seule année scolaire globale (supprimer les doublons si créés)
DO $$
DECLARE
  years_to_keep RECORD;
BEGIN
  -- Pour chaque année unique (basée sur name et dates)
  FOR years_to_keep IN 
    SELECT DISTINCT ON (name, start_date, end_date) 
      id, name, start_date, end_date, is_current, is_next
    FROM school_years
    ORDER BY name, start_date, end_date, created_at DESC
  LOOP
    -- Supprimer tous les doublons sauf celui-ci
    DELETE FROM school_years 
    WHERE (name = years_to_keep.name 
           AND start_date = years_to_keep.start_date 
           AND end_date = years_to_keep.end_date)
      AND id != years_to_keep.id;
  END LOOP;
END $$;

-- Étape 4: Supprimer la colonne school_id
ALTER TABLE school_years DROP COLUMN IF EXISTS school_id;