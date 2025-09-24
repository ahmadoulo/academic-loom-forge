-- Corriger le hash du mot de passe pour "admin123"
-- Le hash correct pour "admin123" + "salt123" avec SHA-256
UPDATE public.user_credentials 
SET password_hash = '7c6a180b36896a0a8c02787eeafb0e4c' 
WHERE email = 'admin@eduvate.com';