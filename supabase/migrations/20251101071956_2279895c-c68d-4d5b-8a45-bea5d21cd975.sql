-- Enable RLS on critical tables and create permissive policies
-- Since authentication is handled via custom tables, not Supabase Auth

-- Attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on attendance"
ON public.attendance
FOR ALL
USING (true)
WITH CHECK (true);

-- Attendance sessions table
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on attendance_sessions"
ON public.attendance_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- User credentials table
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_credentials"
ON public.user_credentials
FOR ALL
USING (true)
WITH CHECK (true);

-- Student accounts table
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on student_accounts"
ON public.student_accounts
FOR ALL
USING (true)
WITH CHECK (true);

-- Events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on events"
ON public.events
FOR ALL
USING (true)
WITH CHECK (true);

-- Announcements table
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on announcements"
ON public.announcements
FOR ALL
USING (true)
WITH CHECK (true);

-- Schools table (if not already enabled)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on schools"
ON public.schools
FOR ALL
USING (true)
WITH CHECK (true);