-- Add template and color fields to bulletin_settings
ALTER TABLE public.bulletin_settings 
ADD COLUMN IF NOT EXISTS template_style TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#0066cc';