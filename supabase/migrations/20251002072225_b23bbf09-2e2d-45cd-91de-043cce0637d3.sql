-- Create student_accounts table for student authentication
CREATE TABLE IF NOT EXISTS public.student_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  invitation_token TEXT,
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, school_id)
);

-- Enable RLS
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

-- Students can view their own account
CREATE POLICY "Students can view their own account"
ON public.student_accounts
FOR SELECT
USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Students can update their own account (for password reset)
CREATE POLICY "Students can update their own account"
ON public.student_accounts
FOR UPDATE
USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Public can insert (for registration process)
CREATE POLICY "Anyone can register"
ON public.student_accounts
FOR INSERT
WITH CHECK (true);

-- Schools can view their student accounts
CREATE POLICY "Schools can view their student accounts"
ON public.student_accounts
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_student_accounts_updated_at
BEFORE UPDATE ON public.student_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_student_accounts_email ON public.student_accounts(email);
CREATE INDEX idx_student_accounts_school_id ON public.student_accounts(school_id);
CREATE INDEX idx_student_accounts_invitation_token ON public.student_accounts(invitation_token);