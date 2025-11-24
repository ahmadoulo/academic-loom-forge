-- Add coefficient column to subjects table
ALTER TABLE subjects 
ADD COLUMN coefficient numeric NOT NULL DEFAULT 1 CHECK (coefficient > 0 AND coefficient <= 10);

COMMENT ON COLUMN subjects.coefficient IS 'Coefficient de la matière pour le calcul des moyennes (entre 0 et 10)';