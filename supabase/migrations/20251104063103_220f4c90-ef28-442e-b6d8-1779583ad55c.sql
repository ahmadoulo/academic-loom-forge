-- Ajouter une colonne pour suivre si les notifications d'absence ont été envoyées
ALTER TABLE assignments
ADD COLUMN absence_notification_sent BOOLEAN DEFAULT false;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX idx_assignments_absence_notification 
ON assignments(absence_notification_sent, session_date, end_time);