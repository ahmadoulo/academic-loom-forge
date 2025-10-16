-- Supprimer les policies existantes qui bloquent l'accès
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can view announcements based on visibility" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Everyone can view published events" ON public.events;

-- Désactiver RLS sur announcements et events pour correspondre au reste de l'application
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);