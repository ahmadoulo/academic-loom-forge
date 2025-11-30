-- Allow "refuse" status for school_admission
ALTER TABLE public.school_admission
  DROP CONSTRAINT IF EXISTS school_admission_status_check;

ALTER TABLE public.school_admission
  ADD CONSTRAINT school_admission_status_check
  CHECK (status IN ('nouveau', 'en_cours', 'traite', 'refuse'));
