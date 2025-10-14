-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'school' CHECK (scope IN ('school', 'class', 'subject', 'public')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'students', 'teachers', 'class')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_events_start_at ON public.events(start_at);
CREATE INDEX idx_events_class_id ON public.events(class_id);
CREATE INDEX idx_events_subject_id ON public.events(subject_id);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX idx_announcements_class_id ON public.announcements(class_id);
CREATE INDEX idx_announcements_pinned ON public.announcements(pinned) WHERE pinned = true;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for events
-- Admin can do everything
CREATE POLICY "Admins can manage all events"
  ON public.events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_credentials
      WHERE user_credentials.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND user_credentials.role IN ('admin', 'admin_school', 'superadmin')
    )
  );

-- Everyone can read published events
CREATE POLICY "Everyone can view published events"
  ON public.events
  FOR SELECT
  USING (published = true);

-- RLS Policies for announcements
-- Admin can do everything
CREATE POLICY "Admins can manage all announcements"
  ON public.announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_credentials
      WHERE user_credentials.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND user_credentials.role IN ('admin', 'admin_school', 'superadmin')
    )
  );

-- Users can view announcements based on visibility
CREATE POLICY "Users can view announcements based on visibility"
  ON public.announcements
  FOR SELECT
  USING (
    visibility = 'all' OR
    (visibility = 'students' AND EXISTS (
      SELECT 1 FROM public.user_credentials
      WHERE user_credentials.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND user_credentials.role = 'student'
    )) OR
    (visibility = 'teachers' AND EXISTS (
      SELECT 1 FROM public.user_credentials
      WHERE user_credentials.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND user_credentials.role = 'professor'
    )) OR
    (visibility = 'class' AND class_id IN (
      SELECT class_id FROM public.students
      WHERE students.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ))
  );

-- Insert mock data for events
INSERT INTO public.events (title, description, start_at, end_at, location, scope, published)
VALUES 
  ('Book Fair', 'Browse and purchase books at our annual school Book Fair.', '2024-09-16 08:00:00+00', '2024-09-16 10:00:00+00', 'School Library', 'school', true),
  ('Sports Day', 'A fun-filled day of athletic events and team competitions.', '2024-09-18 10:00:00+00', '2024-09-18 12:00:00+00', 'Sports Field', 'school', true),
  ('Art Exhibition', 'Display your artwork for the school community to admire.', '2024-09-20 14:00:00+00', '2024-09-20 16:00:00+00', 'Art Gallery', 'school', true);

-- Insert mock data for announcements
INSERT INTO public.announcements (title, body, visibility, pinned)
VALUES 
  ('Rappel : Dates d''inscription', 'N''oubliez pas de confirmer vos inscriptions avant le 30 septembre. Les places sont limitées pour certaines activités.', 'all', true),
  ('Nouvelle politique de présence', 'À partir de lundi prochain, la présence sera obligatoire pour toutes les séances de cours. Consultez le règlement mis à jour.', 'students', false),
  ('Réunion parents-professeurs', 'La réunion trimestrielle aura lieu le 25 septembre à 18h00 dans la salle polyvalente.', 'teachers', false);