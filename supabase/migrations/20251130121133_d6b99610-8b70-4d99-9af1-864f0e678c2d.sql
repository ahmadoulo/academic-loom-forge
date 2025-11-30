-- Table: school_fee_config (types de frais configurables)
CREATE TABLE public.school_fee_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_default NUMERIC NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'yearly', 'once')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: school_fees (frais générés pour les élèves)
CREATE TABLE public.school_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_config_id UUID NOT NULL REFERENCES public.school_fee_config(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  due_month TEXT NOT NULL,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: school_payments (encaissements)
CREATE TABLE public.school_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES public.school_fees(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT NOT NULL CHECK (method IN ('cash', 'cheque', 'bank', 'other')),
  notes TEXT,
  recorded_by UUID REFERENCES public.user_credentials(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_fee_config
CREATE POLICY "Schools can view their fee configs"
  ON public.school_fee_config FOR SELECT
  USING (true);

CREATE POLICY "Schools can insert their fee configs"
  ON public.school_fee_config FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update their fee configs"
  ON public.school_fee_config FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete their fee configs"
  ON public.school_fee_config FOR DELETE
  USING (true);

-- RLS Policies for school_fees
CREATE POLICY "Schools can view their fees"
  ON public.school_fees FOR SELECT
  USING (true);

CREATE POLICY "Schools can insert fees"
  ON public.school_fees FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update fees"
  ON public.school_fees FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete fees"
  ON public.school_fees FOR DELETE
  USING (true);

-- RLS Policies for school_payments
CREATE POLICY "Schools can view their payments"
  ON public.school_payments FOR SELECT
  USING (true);

CREATE POLICY "Schools can insert payments"
  ON public.school_payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update payments"
  ON public.school_payments FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete payments"
  ON public.school_payments FOR DELETE
  USING (true);

-- Indexes for performance
CREATE INDEX idx_school_fee_config_school_id ON public.school_fee_config(school_id);
CREATE INDEX idx_school_fees_student_id ON public.school_fees(student_id);
CREATE INDEX idx_school_fees_school_id ON public.school_fees(school_id);
CREATE INDEX idx_school_fees_status ON public.school_fees(status);
CREATE INDEX idx_school_fees_due_month ON public.school_fees(due_month);
CREATE INDEX idx_school_payments_student_id ON public.school_payments(student_id);
CREATE INDEX idx_school_payments_school_id ON public.school_payments(school_id);
CREATE INDEX idx_school_payments_fee_id ON public.school_payments(fee_id);

-- Trigger for updated_at
CREATE TRIGGER update_school_fee_config_updated_at
  BEFORE UPDATE ON public.school_fee_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_fees_updated_at
  BEFORE UPDATE ON public.school_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();