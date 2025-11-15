-- Create cycles table
CREATE TABLE public.cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT, -- Licence, Master, Doctorat, etc.
  duration_years INTEGER DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create options table
CREATE TABLE public.options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT, -- Code de l'option (ex: DEV, CYBER)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add cycle_id and option_id to classes table
ALTER TABLE public.classes 
ADD COLUMN cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
ADD COLUMN option_id UUID REFERENCES public.options(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cycles
CREATE POLICY "Anyone can view cycles"
ON public.cycles FOR SELECT
USING (true);

CREATE POLICY "Schools can manage their cycles"
ON public.cycles FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for options
CREATE POLICY "Anyone can view options"
ON public.options FOR SELECT
USING (true);

CREATE POLICY "Schools can manage their options"
ON public.options FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_cycles_school_id ON public.cycles(school_id);
CREATE INDEX idx_options_cycle_id ON public.options(cycle_id);
CREATE INDEX idx_options_school_id ON public.options(school_id);
CREATE INDEX idx_classes_cycle_id ON public.classes(cycle_id);
CREATE INDEX idx_classes_option_id ON public.classes(option_id);

-- Update trigger for updated_at
CREATE TRIGGER update_cycles_updated_at
BEFORE UPDATE ON public.cycles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_options_updated_at
BEFORE UPDATE ON public.options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();