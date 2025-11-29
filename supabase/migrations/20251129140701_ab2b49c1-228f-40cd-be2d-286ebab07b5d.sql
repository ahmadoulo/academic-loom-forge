-- Add bonus columns to grades table
ALTER TABLE grades 
ADD COLUMN bonus integer DEFAULT 0 CHECK (bonus >= 0 AND bonus <= 5),
ADD COLUMN bonus_reason text,
ADD COLUMN bonus_given_by uuid REFERENCES profiles(user_id),
ADD COLUMN bonus_given_at timestamp with time zone;