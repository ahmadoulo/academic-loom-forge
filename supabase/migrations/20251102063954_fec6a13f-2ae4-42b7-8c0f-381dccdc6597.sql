-- Add school_id to absence_notifications_log for filtering
ALTER TABLE absence_notifications_log
ADD COLUMN IF NOT EXISTS school_id uuid;

-- Create index for school_id
CREATE INDEX IF NOT EXISTS idx_absence_notifications_log_school_id 
ON absence_notifications_log(school_id);

-- Update existing records to populate school_id from assignments
UPDATE absence_notifications_log anl
SET school_id = a.school_id
FROM assignments a
WHERE anl.assignment_id = a.id AND anl.school_id IS NULL;

-- Drop the existing restrictive RLS policy
DROP POLICY IF EXISTS "School staff can view absence notification logs" ON absence_notifications_log;

-- Create a new policy that allows reading without authentication (like other tables)
CREATE POLICY "Anyone can view absence notification logs"
ON absence_notifications_log
FOR SELECT
USING (true);

-- Allow inserting logs (for edge functions)
CREATE POLICY "Allow inserting absence notification logs"
ON absence_notifications_log
FOR INSERT
WITH CHECK (true);