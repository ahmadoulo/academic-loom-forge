-- Supprimer le compte existant s'il existe
DELETE FROM public.user_credentials WHERE email = 'admin@eduvate.com';

-- Créer le compte administrateur global
INSERT INTO public.user_credentials (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'admin@eduvate.com',
  'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
  'Super',
  'Admin',
  'global_admin',
  true
);