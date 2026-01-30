-- Add MFA columns to app_users table
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_type text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS mfa_code text,
ADD COLUMN IF NOT EXISTS mfa_code_expires_at timestamp with time zone;

-- Create index for faster MFA lookups
CREATE INDEX IF NOT EXISTS idx_app_users_mfa_enabled ON public.app_users(mfa_enabled) WHERE mfa_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN public.app_users.mfa_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN public.app_users.mfa_type IS 'Type of MFA: email (default)';
COMMENT ON COLUMN public.app_users.mfa_code IS 'Temporary MFA code for verification';
COMMENT ON COLUMN public.app_users.mfa_code_expires_at IS 'Expiration time for the MFA code';