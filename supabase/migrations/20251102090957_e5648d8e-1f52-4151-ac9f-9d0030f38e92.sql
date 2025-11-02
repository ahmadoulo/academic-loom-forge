-- Ajouter student_id à absence_notifications_log pour tracer chaque notification individuelle
ALTER TABLE absence_notifications_log 
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Créer un index pour les requêtes par étudiant
CREATE INDEX IF NOT EXISTS idx_absence_notifications_log_student 
ON absence_notifications_log(student_id, assignment_id, session_date);

-- Créer un index composite pour vérifier si une notification a déjà été envoyée
CREATE UNIQUE INDEX IF NOT EXISTS idx_absence_notifications_log_unique 
ON absence_notifications_log(assignment_id, session_date, student_id) 
WHERE student_id IS NOT NULL;