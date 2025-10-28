-- Ajouter les colonnes d'archivage aux tables critiques
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

ALTER TABLE classes ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Créer des index pour améliorer les performances des requêtes d'archivage
CREATE INDEX IF NOT EXISTS idx_students_archived ON students(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_teachers_archived ON teachers(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_subjects_archived ON subjects(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_classes_archived ON classes(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_classrooms_archived ON classrooms(archived) WHERE archived = false;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN students.archived IS 'Indique si l''étudiant est archivé. Les étudiants archivés conservent l''accès à leurs données historiques mais ne sont plus actifs.';
COMMENT ON COLUMN teachers.archived IS 'Indique si le professeur est archivé. Les professeurs archivés conservent l''accès à leurs données historiques.';
COMMENT ON COLUMN subjects.archived IS 'Indique si la matière est archivée. Les matières archivées restent visibles dans l''historique.';
COMMENT ON COLUMN classes.archived IS 'Indique si la classe est archivée. Les classes archivées restent visibles dans l''historique.';
COMMENT ON COLUMN classrooms.archived IS 'Indique si la salle est archivée. Les salles archivées restent visibles dans l''historique.';