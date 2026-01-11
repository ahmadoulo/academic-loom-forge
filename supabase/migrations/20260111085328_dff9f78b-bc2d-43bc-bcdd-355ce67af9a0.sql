-- Table pour les types de documents administratifs par cycle
CREATE TABLE public.administrative_document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  year_level INTEGER, -- Niveau d'année requis (1, 2, 3...), NULL = tous les niveaux du cycle
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le suivi des documents par étudiant
CREATE TABLE public.student_administrative_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.administrative_document_types(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'acquired', 'pending')),
  acquired_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  file_path TEXT,
  verified_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, document_type_id)
);

-- Enable RLS
ALTER TABLE public.administrative_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_administrative_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for administrative_document_types
CREATE POLICY "Schools can view their document types"
ON public.administrative_document_types
FOR SELECT
USING (true);

CREATE POLICY "Schools can create document types"
ON public.administrative_document_types
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can update their document types"
ON public.administrative_document_types
FOR UPDATE
USING (true);

CREATE POLICY "Schools can delete their document types"
ON public.administrative_document_types
FOR DELETE
USING (true);

-- RLS Policies for student_administrative_documents
CREATE POLICY "Schools can view student documents"
ON public.student_administrative_documents
FOR SELECT
USING (true);

CREATE POLICY "Schools can create student documents"
ON public.student_administrative_documents
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can update student documents"
ON public.student_administrative_documents
FOR UPDATE
USING (true);

CREATE POLICY "Schools can delete student documents"
ON public.student_administrative_documents
FOR DELETE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_admin_doc_types_school ON public.administrative_document_types(school_id);
CREATE INDEX idx_admin_doc_types_cycle ON public.administrative_document_types(cycle_id);
CREATE INDEX idx_student_admin_docs_student ON public.student_administrative_documents(student_id);
CREATE INDEX idx_student_admin_docs_type ON public.student_administrative_documents(document_type_id);
CREATE INDEX idx_student_admin_docs_school ON public.student_administrative_documents(school_id);
CREATE INDEX idx_student_admin_docs_status ON public.student_administrative_documents(status);

-- Trigger for updated_at
CREATE TRIGGER update_administrative_document_types_updated_at
BEFORE UPDATE ON public.administrative_document_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_administrative_documents_updated_at
BEFORE UPDATE ON public.student_administrative_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();