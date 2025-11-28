-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.school_users CASCADE;
DROP TABLE IF EXISTS public.school_roles CASCADE;
DROP TABLE IF EXISTS public.saas_users CASCADE;
DROP TABLE IF EXISTS public.saas_roles CASCADE;

-- Drop the trigger function if exists
DROP FUNCTION IF EXISTS public.trigger_create_default_school_roles() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_school_roles(uuid) CASCADE;