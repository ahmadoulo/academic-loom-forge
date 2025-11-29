-- Add is_modified field to grades table to track if a grade has been modified
ALTER TABLE grades 
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN grades.is_modified IS 'Tracks if the grade has been modified after creation. Teachers can modify a grade only once.';