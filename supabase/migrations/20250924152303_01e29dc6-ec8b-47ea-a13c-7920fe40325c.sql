-- Désactiver RLS sur TOUTES les tables restantes pour un accès complet
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques RLS restantes des tables profiles
DROP POLICY IF EXISTS "Global admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Global and school admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "School admins can view school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Supprimer toutes les politiques RLS de la table user_roles
DROP POLICY IF EXISTS "Global admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "School admins can manage school roles" ON public.user_roles;

-- Commentaire : Maintenant TOUTES les tables sont accessibles sans restriction