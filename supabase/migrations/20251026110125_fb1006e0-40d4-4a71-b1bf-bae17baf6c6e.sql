-- Supprimer les colonnes obsolètes de la table students
-- Ces informations sont maintenant stockées dans student_school

ALTER TABLE students 
DROP COLUMN IF EXISTS school_id,
DROP COLUMN IF EXISTS class_id,
DROP COLUMN IF EXISTS school_year_id;

COMMENT ON TABLE students IS 'Stores student personal information only. Enrollment data (school, class, year) is in student_school table.';