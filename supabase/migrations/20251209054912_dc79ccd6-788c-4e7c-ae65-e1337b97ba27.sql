-- Change the default value of justification_status to NULL instead of 'pending'
ALTER TABLE attendance ALTER COLUMN justification_status SET DEFAULT NULL;

-- Update all existing absences that have 'pending' status but no justification submitted
UPDATE attendance 
SET justification_status = NULL 
WHERE justification_status = 'pending' 
  AND justification_submitted_at IS NULL;