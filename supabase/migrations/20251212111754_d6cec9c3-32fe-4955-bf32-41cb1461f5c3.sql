-- Add coefficient_type field to subjects table to distinguish between coefficient and credit
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS coefficient_type text NOT NULL DEFAULT 'coefficient' 
CHECK (coefficient_type IN ('coefficient', 'credit'));