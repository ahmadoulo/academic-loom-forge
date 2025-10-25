-- Vérifier et créer la table school_years
DO $$ 
BEGIN
    -- Créer la table si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'school_years') THEN
        CREATE TABLE public.school_years (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT UNIQUE NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          is_current BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Anyone can view school years"
          ON public.school_years FOR SELECT
          USING (true);
        
        CREATE POLICY "Admins can insert school years"
          ON public.school_years FOR INSERT
          WITH CHECK (true);
        
        CREATE POLICY "Admins can update school years"
          ON public.school_years FOR UPDATE
          USING (true);
        
        -- Create trigger
        CREATE TRIGGER update_school_years_updated_at
          BEFORE UPDATE ON public.school_years
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        
        -- Insert initial years
        INSERT INTO public.school_years (name, start_date, end_date, is_current) VALUES
          ('2022-2023', '2022-09-01', '2023-06-30', false),
          ('2023-2024', '2023-09-01', '2024-06-30', false),
          ('2024-2025', '2024-09-01', '2025-06-30', false),
          ('2025-2026', '2025-09-01', '2026-06-30', true),
          ('2026-2027', '2026-09-01', '2027-06-30', false),
          ('2027-2028', '2027-09-01', '2028-06-30', false);
        
        -- Create indexes
        CREATE INDEX idx_school_years_current ON public.school_years(is_current) WHERE is_current = true;
        CREATE INDEX idx_school_years_dates ON public.school_years(start_date, end_date);
        
        -- Create function for setting current year
        CREATE OR REPLACE FUNCTION set_current_school_year(year_id UUID)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        BEGIN
          UPDATE public.school_years SET is_current = false;
          UPDATE public.school_years SET is_current = true WHERE id = year_id;
        END;
        $func$;
    END IF;
    
    -- Ajouter les colonnes school_year_id si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'school_year_id') THEN
        ALTER TABLE public.students ADD COLUMN school_year_id UUID REFERENCES public.school_years(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grades' AND column_name = 'school_year_id') THEN
        ALTER TABLE public.grades ADD COLUMN school_year_id UUID REFERENCES public.school_years(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'school_year_id') THEN
        ALTER TABLE public.attendance ADD COLUMN school_year_id UUID REFERENCES public.school_years(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'school_year_id') THEN
        ALTER TABLE public.assignments ADD COLUMN school_year_id UUID REFERENCES public.school_years(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'school_year_id') THEN
        ALTER TABLE public.classes ADD COLUMN school_year_id UUID REFERENCES public.school_years(id);
    END IF;
END $$;

-- Migrer les données existantes
UPDATE public.students SET school_year_id = (
  SELECT id FROM public.school_years WHERE name = students.academic_year
) WHERE school_year_id IS NULL AND academic_year IS NOT NULL;

UPDATE public.grades SET school_year_id = (
  SELECT id FROM public.school_years WHERE name = grades.academic_year
) WHERE school_year_id IS NULL AND academic_year IS NOT NULL;

UPDATE public.attendance SET school_year_id = (
  SELECT id FROM public.school_years WHERE name = attendance.academic_year
) WHERE school_year_id IS NULL AND academic_year IS NOT NULL;

UPDATE public.assignments SET school_year_id = (
  SELECT id FROM public.school_years WHERE name = assignments.academic_year
) WHERE school_year_id IS NULL AND academic_year IS NOT NULL;

UPDATE public.classes SET school_year_id = (
  SELECT id FROM public.school_years WHERE name = classes.academic_year
) WHERE school_year_id IS NULL AND academic_year IS NOT NULL;

-- Assigner l'année courante aux données sans year_id
UPDATE public.students SET school_year_id = (SELECT id FROM public.school_years WHERE is_current = true) WHERE school_year_id IS NULL;
UPDATE public.grades SET school_year_id = (SELECT id FROM public.school_years WHERE is_current = true) WHERE school_year_id IS NULL;
UPDATE public.attendance SET school_year_id = (SELECT id FROM public.school_years WHERE is_current = true) WHERE school_year_id IS NULL;
UPDATE public.assignments SET school_year_id = (SELECT id FROM public.school_years WHERE is_current = true) WHERE school_year_id IS NULL;
UPDATE public.classes SET school_year_id = (SELECT id FROM public.school_years WHERE is_current = true) WHERE school_year_id IS NULL;

-- Rendre obligatoire après migration
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'school_year_id' AND is_nullable = 'YES') THEN
        ALTER TABLE public.students ALTER COLUMN school_year_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grades' AND column_name = 'school_year_id' AND is_nullable = 'YES') THEN
        ALTER TABLE public.grades ALTER COLUMN school_year_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'school_year_id' AND is_nullable = 'YES') THEN
        ALTER TABLE public.attendance ALTER COLUMN school_year_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'school_year_id' AND is_nullable = 'YES') THEN
        ALTER TABLE public.assignments ALTER COLUMN school_year_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'school_year_id' AND is_nullable = 'YES') THEN
        ALTER TABLE public.classes ALTER COLUMN school_year_id SET NOT NULL;
    END IF;
END $$;

-- Créer les indexes s'ils n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'students' AND indexname = 'idx_students_school_year') THEN
        CREATE INDEX idx_students_school_year ON public.students(school_year_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'grades' AND indexname = 'idx_grades_school_year') THEN
        CREATE INDEX idx_grades_school_year ON public.grades(school_year_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'attendance' AND indexname = 'idx_attendance_school_year') THEN
        CREATE INDEX idx_attendance_school_year ON public.attendance(school_year_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'assignments' AND indexname = 'idx_assignments_school_year') THEN
        CREATE INDEX idx_assignments_school_year ON public.assignments(school_year_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'classes' AND indexname = 'idx_classes_school_year') THEN
        CREATE INDEX idx_classes_school_year ON public.classes(school_year_id);
    END IF;
END $$;