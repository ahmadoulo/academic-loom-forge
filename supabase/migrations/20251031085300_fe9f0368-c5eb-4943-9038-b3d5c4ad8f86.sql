-- Create school_notifications table to track email notifications
CREATE TABLE IF NOT EXISTS public.school_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'teacher', 'staff')),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Schools can view their notifications"
  ON public.school_notifications
  FOR SELECT
  USING (true);

CREATE POLICY "Schools can insert notifications"
  ON public.school_notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_school_notifications_school_id ON public.school_notifications(school_id);
CREATE INDEX idx_school_notifications_sent_at ON public.school_notifications(sent_at DESC);
CREATE INDEX idx_school_notifications_recipient_type ON public.school_notifications(recipient_type);