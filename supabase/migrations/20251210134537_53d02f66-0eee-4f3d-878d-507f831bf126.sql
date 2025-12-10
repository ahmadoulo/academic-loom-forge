-- Add attachment columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS links text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Add attachment columns to announcements table  
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS links text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';