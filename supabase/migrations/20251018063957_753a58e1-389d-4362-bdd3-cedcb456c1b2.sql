-- Supprimer la contrainte CHECK sur la colonne visibility de la table announcements
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_visibility_check;

-- La validation de visibility sera gérée côté application