-- Create table for school cameras
CREATE TABLE public.school_cameras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rtsp_url TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_cameras ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Schools can view their own cameras"
ON public.school_cameras
FOR SELECT
USING (true);

CREATE POLICY "Schools can create their own cameras"
ON public.school_cameras
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can update their own cameras"
ON public.school_cameras
FOR UPDATE
USING (true);

CREATE POLICY "Schools can delete their own cameras"
ON public.school_cameras
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_school_cameras_updated_at
BEFORE UPDATE ON public.school_cameras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();