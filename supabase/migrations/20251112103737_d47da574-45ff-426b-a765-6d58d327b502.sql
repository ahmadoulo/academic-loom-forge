-- Create document_templates table for storing document templates
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'enrollment_certificate', 'attendance_certificate', 'success_certificate', etc.
  content TEXT NOT NULL, -- Template content with placeholders like {{student_name}}, {{class_name}}, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Schools can view their document templates"
  ON public.document_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Schools can create document templates"
  ON public.document_templates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update their document templates"
  ON public.document_templates
  FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete their document templates"
  ON public.document_templates
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();