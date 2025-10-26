-- Fusionner les étudiants avec le même CIN avant d'appliquer la contrainte unique

-- 1. Générer des CIN temporaires pour les étudiants sans CIN
UPDATE students 
SET cin_number = 'TEMP-' || id::text 
WHERE cin_number IS NULL;

-- 2. Identifier et fusionner les doublons
DO $$
DECLARE
  dup_cin TEXT;
  keep_student_id UUID;
  delete_student_id UUID;
BEGIN
  -- Pour chaque CIN dupliqué
  FOR dup_cin IN 
    SELECT cin_number 
    FROM students 
    GROUP BY cin_number 
    HAVING COUNT(*) > 1
  LOOP
    -- Trouver le plus ancien étudiant à conserver
    SELECT id INTO keep_student_id
    FROM students
    WHERE cin_number = dup_cin
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Pour chaque doublon à supprimer
    FOR delete_student_id IN
      SELECT id
      FROM students
      WHERE cin_number = dup_cin AND id != keep_student_id
    LOOP
      -- Réassigner les inscriptions au student_id à conserver
      UPDATE student_school
      SET student_id = keep_student_id
      WHERE student_id = delete_student_id;
      
      -- Supprimer le doublon
      DELETE FROM students WHERE id = delete_student_id;
    END LOOP;
  END LOOP;
END $$;

-- 3. Supprimer la colonne academic_year qui est hardcodée
ALTER TABLE students DROP COLUMN IF EXISTS academic_year;

-- 4. Rendre school_id, class_id, school_year_id nullable
ALTER TABLE students ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN school_year_id DROP NOT NULL;

-- 5. Ajouter la contrainte unique sur cin_number
ALTER TABLE students ALTER COLUMN cin_number SET NOT NULL;
CREATE UNIQUE INDEX idx_students_cin_unique ON students(cin_number);

-- 6. Créer un index sur student_school pour vérifier rapidement les inscriptions
CREATE INDEX IF NOT EXISTS idx_student_school_lookup ON student_school(student_id, school_year_id, school_id, is_active);

-- 7. Ajouter des commentaires pour clarifier l'architecture
COMMENT ON TABLE students IS 'Table principale des étudiants - Un étudiant = un ID unique basé sur CIN. Les colonnes school_id, class_id, school_year_id sont dépréciées, utiliser student_school pour les inscriptions.';
COMMENT ON TABLE student_school IS 'Historique des inscriptions des étudiants par année scolaire et école. Permet de tracker les changements d''école et de conserver l''historique.';