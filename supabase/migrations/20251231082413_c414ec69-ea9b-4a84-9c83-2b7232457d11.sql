-- Enable RLS on app_users table
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Service role full access on app_users" ON public.app_users;

-- Create policy for service role to have full access
CREATE POLICY "Service role full access"
ON public.app_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policy for global admins to read all users  
CREATE POLICY "Global admins can view all users"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = auth.uid()::uuid
    AND role = 'global_admin'
  )
);

-- Create policy for school admins to view users in their school
CREATE POLICY "School admins can view school users"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user_roles
    WHERE user_id = auth.uid()::uuid
    AND role = 'school_admin'
    AND school_id = app_users.school_id
  )
);

-- Allow anon to access for edge functions
CREATE POLICY "Anon access for edge functions"
ON public.app_users
FOR ALL
TO anon
USING (true)
WITH CHECK (true);