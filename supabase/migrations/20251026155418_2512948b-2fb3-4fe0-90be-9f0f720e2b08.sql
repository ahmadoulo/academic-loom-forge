-- Migration: RLS policies permissives pour le développement
-- Permettre l'accès aux school_years sans authentification Supabase

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their school years" ON school_years;
DROP POLICY IF EXISTS "School admins can insert school years" ON school_years;
DROP POLICY IF EXISTS "School admins can update their school years" ON school_years;

-- Créer des policies permissives pour le développement
-- IMPORTANT: À restreindre en production !

-- Policy pour SELECT (lecture)
CREATE POLICY "Allow select school_years for dev" 
ON school_years FOR SELECT 
USING (true);

-- Policy pour INSERT (création)
CREATE POLICY "Allow insert school_years for dev" 
ON school_years FOR INSERT 
WITH CHECK (true);

-- Policy pour UPDATE (mise à jour)
CREATE POLICY "Allow update school_years for dev" 
ON school_years FOR UPDATE 
USING (true);

-- Policy pour DELETE (suppression)
CREATE POLICY "Allow delete school_years for dev" 
ON school_years FOR DELETE 
USING (true);