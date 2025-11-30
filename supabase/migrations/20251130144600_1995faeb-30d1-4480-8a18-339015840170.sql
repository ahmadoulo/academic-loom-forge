-- Add 'refuse' status to school_admission if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'refuse' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'admission_status')
  ) THEN
    ALTER TYPE admission_status ADD VALUE 'refuse';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- If the enum type doesn't exist, we'll handle it differently
    NULL;
END $$;

-- If the column uses text type instead of enum, that's fine
-- The column will accept 'refuse' as a value