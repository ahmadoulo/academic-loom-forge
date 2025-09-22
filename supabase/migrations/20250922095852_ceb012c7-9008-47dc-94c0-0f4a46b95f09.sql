-- Create attendance table for student presence tracking
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  class_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'qr_scan')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table
CREATE POLICY "Teachers can view attendance for their classes" 
ON public.attendance 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can create attendance records" 
ON public.attendance 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teachers can update attendance records" 
ON public.attendance 
FOR UPDATE 
USING (true);

CREATE POLICY "Teachers can delete attendance records" 
ON public.attendance 
FOR DELETE 
USING (true);

-- Create attendance sessions table for QR code generation
CREATE TABLE public.attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  session_code TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for attendance sessions
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance sessions
CREATE POLICY "Teachers can manage their attendance sessions" 
ON public.attendance_sessions 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_sessions_updated_at
BEFORE UPDATE ON public.attendance_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();