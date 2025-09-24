-- Insert test profile data for admin functionality
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, is_active) VALUES
('d234efe6-654a-43e0-910a-0c2b97cd540d', 'admin@eduvate.com', 'Admin', 'Global', 'global_admin', true)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;