-- Tighten security for event attendance data
-- We will move reads/writes to backend functions and remove public RLS policies.

-- Drop overly-permissive policies
DROP POLICY IF EXISTS "Anyone can mark event attendance" ON public.event_attendance;
DROP POLICY IF EXISTS "Schools can delete their event attendance" ON public.event_attendance;
DROP POLICY IF EXISTS "Schools can view their event attendance" ON public.event_attendance;
DROP POLICY IF EXISTS "Schools can manage their event sessions" ON public.event_attendance_sessions;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Note: No new policies are created on purpose.
-- Access is now only possible via backend functions using elevated privileges.