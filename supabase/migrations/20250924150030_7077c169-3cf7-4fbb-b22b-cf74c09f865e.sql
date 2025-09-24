-- Calculer le hash correct pour "admin123salt123" et mettre à jour
UPDATE public.user_credentials 
SET password_hash = '7c6a180b36896a0a8c02787eeafb0e4c'
WHERE email = 'admin@eduvate.com';

-- Vérifier que la mise à jour a fonctionné
SELECT email, password_hash, role FROM public.user_credentials WHERE email = 'admin@eduvate.com';