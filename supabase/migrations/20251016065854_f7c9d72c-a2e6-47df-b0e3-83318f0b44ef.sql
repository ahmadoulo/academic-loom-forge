-- Ajouter school_id aux tables announcements et events
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Créer des index pour améliorer les performances de filtrage par école
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON public.announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_events_school_id ON public.events(school_id);

-- Mettre à jour les données existantes avec un school_id par défaut (première école trouvée)
UPDATE public.announcements 
SET school_id = (SELECT id FROM public.schools LIMIT 1)
WHERE school_id IS NULL;

UPDATE public.events 
SET school_id = (SELECT id FROM public.schools LIMIT 1)
WHERE school_id IS NULL;