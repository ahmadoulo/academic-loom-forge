-- Add student_limit and teacher_limit to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN student_limit INTEGER,
ADD COLUMN teacher_limit INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN subscription_plans.student_limit IS 'Maximum number of students allowed for this plan';
COMMENT ON COLUMN subscription_plans.teacher_limit IS 'Maximum number of teachers allowed for this plan';