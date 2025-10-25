-- Ajouter la colonne academic_year aux tables principales
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE grades ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2024-2025';

-- Créer des index pour améliorer les performances des requêtes filtrées par année
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year);
CREATE INDEX IF NOT EXISTS idx_grades_academic_year ON grades(academic_year);
CREATE INDEX IF NOT EXISTS idx_attendance_academic_year ON attendance(academic_year);
CREATE INDEX IF NOT EXISTS idx_assignments_academic_year ON assignments(academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

-- Index composites pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_students_school_year ON students(school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_grades_student_year ON grades(student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_attendance_class_year ON attendance(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_assignments_class_year ON assignments(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_school_year ON classes(school_id, academic_year);

COMMENT ON COLUMN students.academic_year IS 'Année scolaire (format: 2024-2025)';
COMMENT ON COLUMN grades.academic_year IS 'Année scolaire (format: 2024-2025)';
COMMENT ON COLUMN attendance.academic_year IS 'Année scolaire (format: 2024-2025)';
COMMENT ON COLUMN assignments.academic_year IS 'Année scolaire (format: 2024-2025)';
COMMENT ON COLUMN classes.academic_year IS 'Année scolaire (format: 2024-2025)';