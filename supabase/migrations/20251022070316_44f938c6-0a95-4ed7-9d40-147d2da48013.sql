-- Add new columns to schools table for settings
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2024-2025',
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Maroc',
ADD COLUMN IF NOT EXISTS website TEXT;

-- Create storage bucket for school logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos',
  'school-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for school logos bucket
CREATE POLICY "School logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

CREATE POLICY "Schools can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Schools can update their own logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Schools can delete their own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-logos' AND
  auth.role() = 'authenticated'
);