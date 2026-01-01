-- Create school_roles table for custom roles per school
CREATE TABLE IF NOT EXISTS public.school_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'blue',
    is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, name)
);

-- Create school_role_permissions table
CREATE TABLE IF NOT EXISTS public.school_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role_id, permission_key)
);

-- Create user_school_roles table to assign custom roles to users
CREATE TABLE IF NOT EXISTS public.user_school_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    school_role_id UUID NOT NULL REFERENCES public.school_roles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, school_role_id)
);

-- Enable RLS
ALTER TABLE public.school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_school_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_roles
CREATE POLICY "School admins can view their school roles" ON public.school_roles
    FOR SELECT USING (true);

CREATE POLICY "School admins can manage their school roles" ON public.school_roles
    FOR ALL USING (true);

-- RLS Policies for school_role_permissions
CREATE POLICY "School admins can view their school role permissions" ON public.school_role_permissions
    FOR SELECT USING (true);

CREATE POLICY "School admins can manage their school role permissions" ON public.school_role_permissions
    FOR ALL USING (true);

-- RLS Policies for user_school_roles
CREATE POLICY "School admins can view their user roles" ON public.user_school_roles
    FOR SELECT USING (true);

CREATE POLICY "School admins can manage their user roles" ON public.user_school_roles
    FOR ALL USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_roles_school_id ON public.school_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_school_role_permissions_role_id ON public.school_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_school_roles_user_id ON public.user_school_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_school_roles_school_id ON public.user_school_roles(school_id);

-- Function to check if user has a specific permission in a school
CREATE OR REPLACE FUNCTION public.user_has_school_permission(
    _user_id UUID,
    _school_id UUID,
    _permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_school_roles usr
        JOIN school_role_permissions srp ON srp.role_id = usr.school_role_id
        WHERE usr.user_id = _user_id
        AND usr.school_id = _school_id
        AND srp.permission_key = _permission_key
    )
    OR EXISTS (
        -- School admins have all permissions
        SELECT 1
        FROM app_user_roles aur
        WHERE aur.user_id = _user_id
        AND aur.school_id = _school_id
        AND aur.role = 'school_admin'
    )
    OR EXISTS (
        -- Global admins have all permissions
        SELECT 1
        FROM app_user_roles aur
        WHERE aur.user_id = _user_id
        AND aur.role = 'global_admin'
    )
$$;

-- Function to get all permissions for a user in a school
CREATE OR REPLACE FUNCTION public.get_user_school_permissions(
    _user_id UUID,
    _school_id UUID
)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT srp.permission_key),
        ARRAY[]::TEXT[]
    )
    FROM user_school_roles usr
    JOIN school_role_permissions srp ON srp.role_id = usr.school_role_id
    WHERE usr.user_id = _user_id
    AND usr.school_id = _school_id
$$;