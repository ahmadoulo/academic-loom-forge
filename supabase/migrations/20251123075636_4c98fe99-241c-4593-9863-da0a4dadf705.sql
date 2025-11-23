-- Ajouter la colonne table_data à la table exam_questions pour supporter les tableaux
ALTER TABLE exam_questions
ADD COLUMN IF NOT EXISTS table_data jsonb DEFAULT NULL;