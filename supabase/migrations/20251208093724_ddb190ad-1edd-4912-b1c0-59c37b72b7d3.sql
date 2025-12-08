-- Add justification fields to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS is_justified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS justification_comment text,
ADD COLUMN IF NOT EXISTS justification_file_path text,
ADD COLUMN IF NOT EXISTS justification_submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS justification_status text DEFAULT 'pending' CHECK (justification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS justification_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS justification_reviewed_by uuid REFERENCES public.user_credentials(id),
ADD COLUMN IF NOT EXISTS justification_rejection_reason text;

-- Create storage bucket for school documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('school-document', 'school-document', false, 2097152)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for school-document bucket
CREATE POLICY "Students can upload their justification documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'school-document');

CREATE POLICY "Schools and students can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'school-document');

CREATE POLICY "Schools can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'school-document');