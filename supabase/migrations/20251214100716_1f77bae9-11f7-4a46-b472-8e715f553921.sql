-- Table pour les paramètres de bulletin par école
CREATE TABLE public.bulletin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  show_weighted_average BOOLEAN NOT NULL DEFAULT true,
  show_ranking BOOLEAN NOT NULL DEFAULT true,
  show_mention BOOLEAN NOT NULL DEFAULT true,
  show_decision BOOLEAN NOT NULL DEFAULT true,
  show_observations BOOLEAN NOT NULL DEFAULT false,
  custom_footer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_school_bulletin_settings UNIQUE (school_id)
);

-- Enable RLS
ALTER TABLE public.bulletin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Schools can view their bulletin settings"
ON public.bulletin_settings
FOR SELECT
USING (true);

CREATE POLICY "Schools can create their bulletin settings"
ON public.bulletin_settings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Schools can update their bulletin settings"
ON public.bulletin_settings
FOR UPDATE
USING (true);

CREATE POLICY "Schools can delete their bulletin settings"
ON public.bulletin_settings
FOR DELETE
USING (true);