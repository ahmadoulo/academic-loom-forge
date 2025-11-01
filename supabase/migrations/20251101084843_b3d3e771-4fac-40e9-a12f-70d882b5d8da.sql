-- Create table to track which sessions have had absence notifications sent
CREATE TABLE IF NOT EXISTS public.absence_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  session_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, session_date)
);

-- Enable RLS
ALTER TABLE public.absence_notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow teachers and school admins to view logs
CREATE POLICY "School staff can view absence notification logs"
ON public.absence_notifications_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN classes c ON a.class_id = c.id
    JOIN schools s ON c.school_id = s.id
    JOIN user_credentials uc ON uc.school_id = s.id
    WHERE a.id = assignment_id
    AND uc.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND uc.role IN ('teacher', 'school_admin')
  )
);

-- Create index for performance
CREATE INDEX idx_absence_notifications_log_assignment_date 
ON public.absence_notifications_log(assignment_id, session_date);