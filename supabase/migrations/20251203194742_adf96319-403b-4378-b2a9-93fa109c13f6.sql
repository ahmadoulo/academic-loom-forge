-- Create school_textbooks table (Cahiers de texte assignés aux classes)
CREATE TABLE public.school_textbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, class_id, school_year_id)
);

-- Create school_textbook_entries table (Entrées des professeurs)
CREATE TABLE public.school_textbook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  lesson_content TEXT NOT NULL,
  homework_given TEXT,
  homework_due_date DATE,
  next_session_plan TEXT,
  resources_links TEXT,
  observations TEXT,
  chapter_title TEXT,
  objectives_covered TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school_textbook_notes table (Notes de l'administration)
CREATE TABLE public.school_textbook_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  textbook_id UUID NOT NULL REFERENCES public.school_textbooks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.user_credentials(id),
  target_teacher_id UUID REFERENCES public.teachers(id),
  note_content TEXT NOT NULL,
  is_visible_to_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbook_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_textbooks
CREATE POLICY "Schools can manage their textbooks" ON public.school_textbooks
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for school_textbook_entries
CREATE POLICY "Teachers can manage their entries" ON public.school_textbook_entries
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for school_textbook_notes
CREATE POLICY "Schools can manage textbook notes" ON public.school_textbook_notes
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_textbooks_school_class ON public.school_textbooks(school_id, class_id);
CREATE INDEX idx_textbook_entries_textbook ON public.school_textbook_entries(textbook_id);
CREATE INDEX idx_textbook_entries_teacher ON public.school_textbook_entries(teacher_id);
CREATE INDEX idx_textbook_entries_date ON public.school_textbook_entries(session_date DESC);
CREATE INDEX idx_textbook_notes_textbook ON public.school_textbook_notes(textbook_id);

-- Triggers for updated_at
CREATE TRIGGER update_school_textbooks_updated_at
  BEFORE UPDATE ON public.school_textbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_textbook_entries_updated_at
  BEFORE UPDATE ON public.school_textbook_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_textbook_notes_updated_at
  BEFORE UPDATE ON public.school_textbook_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();