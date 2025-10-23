-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Schools can upload their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Schools can update their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Schools can delete their own logo" ON storage.objects;

-- Create public policies for school logos (matching other sections of the app)
CREATE POLICY "Anyone can upload school logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'school-logos');

CREATE POLICY "Anyone can update school logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'school-logos');

CREATE POLICY "Anyone can delete school logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'school-logos');