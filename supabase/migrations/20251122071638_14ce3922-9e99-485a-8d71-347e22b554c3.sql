-- Ajouter le champ answer_on_document à la table exam_documents
ALTER TABLE exam_documents ADD COLUMN IF NOT EXISTS answer_on_document boolean DEFAULT true;

-- Créer un index pour faciliter le filtrage par classe dans le dashboard école
CREATE INDEX IF NOT EXISTS idx_exam_documents_class_id ON exam_documents(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_documents_status ON exam_documents(status);