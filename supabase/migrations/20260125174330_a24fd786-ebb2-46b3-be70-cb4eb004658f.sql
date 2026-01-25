-- ============================================================
-- SECURITY FIX: Restrict app_users_public view access
-- This fixes the security warning about PII exposure
-- ============================================================

-- Drop existing view and recreate with proper security
DROP VIEW IF EXISTS public.app_users_public;

-- Recreate view with minimal non-sensitive data
CREATE VIEW public.app_users_public 
WITH (security_invoker = on) AS 
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  school_id,
  is_active,
  teacher_id,
  student_id,
  created_at
FROM public.app_users;

-- Revoke all permissions first
REVOKE ALL ON public.app_users_public FROM anon, authenticated;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.app_users_public TO authenticated;

-- ============================================================
-- SECURITY FIX: Ensure app_users base table is properly locked
-- ============================================================

-- Drop any remaining permissive policies on app_users
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'app_users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.app_users', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well
ALTER TABLE public.app_users FORCE ROW LEVEL SECURITY;

-- Only service_role should access this table directly
-- No policies = no access for anon/authenticated (they must use edge functions)