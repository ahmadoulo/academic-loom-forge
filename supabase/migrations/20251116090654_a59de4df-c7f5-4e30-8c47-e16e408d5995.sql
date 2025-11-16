-- Add year_level column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS year_level INTEGER;

-- Add is_specialization column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_specialization BOOLEAN DEFAULT false;

COMMENT ON COLUMN classes.year_level IS 'Année du cycle (1, 2, 3, etc.)';
COMMENT ON COLUMN classes.is_specialization IS 'Indique si c''est une classe de spécialisation avec option';