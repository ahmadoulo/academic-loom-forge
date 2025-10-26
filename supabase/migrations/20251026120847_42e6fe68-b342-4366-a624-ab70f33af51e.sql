-- Phase 1: Cleanup - Supprimer les colonnes academic_year redondantes
ALTER TABLE classes DROP COLUMN IF EXISTS academic_year;
ALTER TABLE assignments DROP COLUMN IF EXISTS academic_year;
ALTER TABLE attendance DROP COLUMN IF EXISTS academic_year;
ALTER TABLE grades DROP COLUMN IF EXISTS academic_year;

-- Phase 2: Créer les tables pour le système de transition

-- Table pour suivre la préparation d'une nouvelle année par école
CREATE TABLE IF NOT EXISTS year_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  from_year_id UUID NOT NULL REFERENCES school_years(id),
  to_year_id UUID NOT NULL REFERENCES school_years(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'classes_created', 'mapping_done', 'completed')),
  classes_created_at TIMESTAMPTZ,
  mapping_completed_at TIMESTAMPTZ,
  students_promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, from_year_id, to_year_id)
);

-- Table pour mapper les transitions de classes entre années
CREATE TABLE IF NOT EXISTS class_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES year_preparations(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES classes(id),
  to_class_id UUID NOT NULL REFERENCES classes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(preparation_id, from_class_id)
);

-- Table pour l'historique des transitions d'étudiants
CREATE TABLE IF NOT EXISTS student_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID NOT NULL REFERENCES year_preparations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  from_class_id UUID NOT NULL REFERENCES classes(id),
  to_class_id UUID REFERENCES classes(id),
  transition_type TEXT NOT NULL CHECK (transition_type IN ('promoted', 'retained', 'departed', 'transferred')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(user_id)
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE year_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transitions ENABLE ROW LEVEL SECURITY;

-- Policies pour year_preparations
CREATE POLICY "Schools can view their year preparations"
  ON year_preparations FOR SELECT
  USING (true);

CREATE POLICY "Schools can create year preparations"
  ON year_preparations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update their year preparations"
  ON year_preparations FOR UPDATE
  USING (true);

-- Policies pour class_transitions
CREATE POLICY "Schools can view class transitions"
  ON class_transitions FOR SELECT
  USING (true);

CREATE POLICY "Schools can create class transitions"
  ON class_transitions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update class transitions"
  ON class_transitions FOR UPDATE
  USING (true);

CREATE POLICY "Schools can delete class transitions"
  ON class_transitions FOR DELETE
  USING (true);

-- Policies pour student_transitions
CREATE POLICY "Schools can view student transitions"
  ON student_transitions FOR SELECT
  USING (true);

CREATE POLICY "Schools can create student transitions"
  ON student_transitions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Schools can update student transitions"
  ON student_transitions FOR UPDATE
  USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_year_preparations_updated_at
  BEFORE UPDATE ON year_preparations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();