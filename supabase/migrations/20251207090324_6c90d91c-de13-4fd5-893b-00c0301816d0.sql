-- Create table for event attendance sessions (QR code sessions)
CREATE TABLE public.event_attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for event attendance records
CREATE TABLE public.event_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.event_attendance_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_phone TEXT,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'qr_scan',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, participant_email),
  UNIQUE(event_id, student_id)
);

-- Add attendance_enabled column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.event_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_attendance_sessions
CREATE POLICY "Schools can manage their event sessions" ON public.event_attendance_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for event_attendance
CREATE POLICY "Anyone can mark event attendance" ON public.event_attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Schools can view their event attendance" ON public.event_attendance
  FOR SELECT USING (true);

CREATE POLICY "Schools can delete their event attendance" ON public.event_attendance
  FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_event_attendance_sessions_event_id ON public.event_attendance_sessions(event_id);
CREATE INDEX idx_event_attendance_sessions_session_code ON public.event_attendance_sessions(session_code);
CREATE INDEX idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX idx_event_attendance_session_id ON public.event_attendance(session_id);

-- Enable realtime for event attendance
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendance_sessions;