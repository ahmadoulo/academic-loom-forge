-- Add calculation_system field to cycles table
ALTER TABLE public.cycles 
ADD COLUMN IF NOT EXISTS calculation_system text NOT NULL DEFAULT 'coefficient' 
CHECK (calculation_system IN ('credit', 'coefficient'));