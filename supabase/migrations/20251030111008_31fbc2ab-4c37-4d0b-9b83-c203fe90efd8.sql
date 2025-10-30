-- Add new columns to teachers table
ALTER TABLE teachers
ADD COLUMN gender text CHECK (gender IN ('male', 'female')),
ADD COLUMN mobile text,
ADD COLUMN birth_date date,
ADD COLUMN qualification text,
ADD COLUMN address text,
ADD COLUMN salary numeric,
ADD COLUMN join_date date,
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN assigned_classes_count integer DEFAULT 0;