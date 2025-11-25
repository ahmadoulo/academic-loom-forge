-- Add currency field to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'MAD';

-- Add owner_id field to schools table to link with user_credentials
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.user_credentials(id) ON DELETE SET NULL;

-- Add is_active field to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_schools_owner_id ON public.schools(owner_id);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON public.schools(is_active);