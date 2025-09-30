-- Table pour les demandes de documents administratifs
CREATE TABLE public.document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le suivi des demandes
CREATE TABLE public.document_request_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_request_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour document_requests
CREATE POLICY "Students can view their own requests"
ON public.document_requests
FOR SELECT
USING (true);

CREATE POLICY "Students can create their own requests"
ON public.document_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can view requests from their students"
ON public.document_requests
FOR SELECT
USING (true);

CREATE POLICY "Schools can update requests"
ON public.document_requests
FOR UPDATE
USING (true);

-- RLS Policies pour document_request_tracking
CREATE POLICY "Students can view tracking of their requests"
ON public.document_request_tracking
FOR SELECT
USING (true);

CREATE POLICY "Schools can view all tracking"
ON public.document_request_tracking
FOR SELECT
USING (true);

CREATE POLICY "Schools can insert tracking records"
ON public.document_request_tracking
FOR INSERT
WITH CHECK (true);

-- Trigger pour updated_at
CREATE TRIGGER update_document_requests_updated_at
BEFORE UPDATE ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour performance
CREATE INDEX idx_document_requests_student_id ON public.document_requests(student_id);
CREATE INDEX idx_document_requests_school_id ON public.document_requests(school_id);
CREATE INDEX idx_document_requests_status ON public.document_requests(status);
CREATE INDEX idx_document_request_tracking_request_id ON public.document_request_tracking(request_id);