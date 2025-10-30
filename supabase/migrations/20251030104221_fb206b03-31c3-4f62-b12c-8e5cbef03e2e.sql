-- Add columns to assignments table for session rescheduling
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS original_session_date DATE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS proposed_new_date DATE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reschedule_status TEXT CHECK (reschedule_status IN ('pending', 'approved', 'rejected')) DEFAULT NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rescheduled_by UUID;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN assignments.is_rescheduled IS 'Indicates if the session has been rescheduled';
COMMENT ON COLUMN assignments.reschedule_reason IS 'Reason for rescheduling the session';
COMMENT ON COLUMN assignments.original_session_date IS 'Original date before rescheduling';
COMMENT ON COLUMN assignments.proposed_new_date IS 'Proposed new date by teacher (awaiting admin approval)';
COMMENT ON COLUMN assignments.reschedule_status IS 'Status of reschedule request: pending, approved, rejected';
COMMENT ON COLUMN assignments.rescheduled_by IS 'User ID who requested the reschedule';
COMMENT ON COLUMN assignments.rescheduled_at IS 'Timestamp when the reschedule was requested';