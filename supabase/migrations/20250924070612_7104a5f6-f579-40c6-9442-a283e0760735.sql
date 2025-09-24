-- Insérer des rôles pour les utilisateurs existants
INSERT INTO public.user_roles (user_id, role, school_id, granted_by)
SELECT 
  p.user_id,
  p.role,
  p.school_id,
  NULL as granted_by
FROM public.profiles p
WHERE p.user_id IS NOT NULL AND p.role IS NOT NULL
ON CONFLICT DO NOTHING;

-- Créer des comptes utilisateurs de test si ils n'existent pas déjà
-- Note: Ces insertions seront ignorées si les emails existent déjà
DO $$
BEGIN
  -- Admin global
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'admin@eduvate.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"first_name": "Admin", "last_name": "Global"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Ignorer les erreurs d'insertion dans auth.users car on ne peut pas les insérer directement
    NULL;
END $$;