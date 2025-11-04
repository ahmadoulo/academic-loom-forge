-- Add recurrence columns to assignments table
ALTER TABLE assignments
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern TEXT CHECK (recurrence_pattern IN ('weekly', 'monthly', 'none')),
ADD COLUMN recurrence_day INTEGER CHECK (recurrence_day >= 0 AND recurrence_day <= 6),
ADD COLUMN parent_assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
ADD COLUMN recurrence_end_date DATE;

-- Create index for better performance when querying recurring assignments
CREATE INDEX idx_assignments_parent_id ON assignments(parent_assignment_id);
CREATE INDEX idx_assignments_recurring ON assignments(is_recurring) WHERE is_recurring = true;

-- Add comment for documentation
COMMENT ON COLUMN assignments.recurrence_pattern IS 'Recurrence pattern: weekly, monthly, or none';
COMMENT ON COLUMN assignments.recurrence_day IS 'Day of week for recurrence: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN assignments.parent_assignment_id IS 'Reference to parent assignment if this is a recurring instance';
COMMENT ON COLUMN assignments.recurrence_end_date IS 'End date for recurrence generation (typically end of semester)';