-- First, clean up orphaned records
DELETE FROM absence_notifications_log
WHERE assignment_id NOT IN (SELECT id FROM assignments);

-- Add foreign key constraint to absence_notifications_log
ALTER TABLE absence_notifications_log
ADD CONSTRAINT absence_notifications_log_assignment_id_fkey
FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_absence_notifications_log_assignment_id 
ON absence_notifications_log(assignment_id);

CREATE INDEX IF NOT EXISTS idx_absence_notifications_log_sent_at 
ON absence_notifications_log(sent_at DESC);