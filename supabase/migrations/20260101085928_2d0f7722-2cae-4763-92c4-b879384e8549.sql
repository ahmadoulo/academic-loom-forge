-- Add new roles for school staff
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admission';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretary';