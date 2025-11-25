-- Add custom limits to subscriptions table for per-school overrides
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS custom_student_limit integer,
ADD COLUMN IF NOT EXISTS custom_teacher_limit integer;

COMMENT ON COLUMN subscriptions.custom_student_limit IS 'Custom student limit that overrides the plan limit for this specific school';
COMMENT ON COLUMN subscriptions.custom_teacher_limit IS 'Custom teacher limit that overrides the plan limit for this specific school';