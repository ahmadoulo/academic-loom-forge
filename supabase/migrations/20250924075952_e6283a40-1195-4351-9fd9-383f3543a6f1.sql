-- Enable realtime for attendance table
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- Enable realtime for attendance_sessions table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;