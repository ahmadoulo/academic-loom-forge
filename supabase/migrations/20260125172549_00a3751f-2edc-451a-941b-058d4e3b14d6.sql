-- =====================================================
-- CRITICAL SECURITY FIX: Restrict app_users and school_admission tables
-- =====================================================

-- 1. DROP all permissive policies on app_users
DROP POLICY IF EXISTS "Anon access for edge functions" ON public.app_users;
DROP POLICY IF EXISTS "Allow all" ON public.app_users;
DROP POLICY IF EXISTS "Allow all access" ON public.app_users;
DROP POLICY IF EXISTS "Public read access" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own" ON public.app_users;

-- 2. Create strict policies for app_users - NO PUBLIC ACCESS
-- Only service_role should access this table directly
-- Frontend should use app_users_public view

CREATE POLICY "service_role_full_access" ON public.app_users
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 3. Ensure app_users_public view exists and is accessible
DROP VIEW IF EXISTS public.app_users_public;
CREATE VIEW public.app_users_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  avatar_url,
  school_id,
  is_active,
  teacher_id,
  student_id,
  created_at
FROM public.app_users;

-- Grant access to the public view
GRANT SELECT ON public.app_users_public TO anon, authenticated;

-- 4. DROP all permissive policies on school_admission
DROP POLICY IF EXISTS "Allow all" ON public.school_admission;
DROP POLICY IF EXISTS "Allow all access" ON public.school_admission;
DROP POLICY IF EXISTS "Public read access" ON public.school_admission;
DROP POLICY IF EXISTS "Anyone can insert admission" ON public.school_admission;
DROP POLICY IF EXISTS "School admins can view admissions" ON public.school_admission;
DROP POLICY IF EXISTS "School admins can update admissions" ON public.school_admission;
DROP POLICY IF EXISTS "School admins can delete admissions" ON public.school_admission;

-- 5. Create strict policies for school_admission
-- Allow public INSERT (for admission form submissions)
CREATE POLICY "public_can_submit_admission" ON public.school_admission
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Only school admins and global admins can SELECT
CREATE POLICY "admins_can_read_admissions" ON public.school_admission
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'global_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'school_admin'
    AND aur.school_id = school_admission.school_id
  )
);

-- Only school admins can UPDATE
CREATE POLICY "admins_can_update_admissions" ON public.school_admission
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'global_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'school_admin'
    AND aur.school_id = school_admission.school_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'global_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'school_admin'
    AND aur.school_id = school_admission.school_id
  )
);

-- Only school admins can DELETE
CREATE POLICY "admins_can_delete_admissions" ON public.school_admission
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'global_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.app_user_roles aur
    WHERE aur.role = 'school_admin'
    AND aur.school_id = school_admission.school_id
  )
);

-- 6. Ensure RLS is enabled on both tables
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission ENABLE ROW LEVEL SECURITY;