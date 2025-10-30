-- Ajouter la colonne archived à la table school_semester
ALTER TABLE school_semester 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Ajouter un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_school_semester_archived ON school_semester(archived);

-- Ajouter un trigger pour empêcher l'archivage du semestre actuel
CREATE OR REPLACE FUNCTION prevent_archive_current_semester()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.archived = true AND NEW.is_actual = true THEN
    RAISE EXCEPTION 'Cannot archive the current active semester';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_archive_current_semester
  BEFORE UPDATE ON school_semester
  FOR EACH ROW
  EXECUTE FUNCTION prevent_archive_current_semester();