-- Drop the old constraint and add a new one with 'justified' status
ALTER TABLE public.attendance DROP CONSTRAINT attendance_status_check;

ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check 
CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'justified'::text]));