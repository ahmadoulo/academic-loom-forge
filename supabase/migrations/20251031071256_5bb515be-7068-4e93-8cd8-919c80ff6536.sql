-- Add tutor fields to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS tutor_name TEXT,
ADD COLUMN IF NOT EXISTS tutor_email TEXT;