-- Add is_next column to school_years table
ALTER TABLE school_years 
ADD COLUMN is_next BOOLEAN DEFAULT false;

-- Create function to set next year
CREATE OR REPLACE FUNCTION set_next_school_year(year_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset all is_next to false
  UPDATE school_years SET is_next = false;
  
  -- Set the specified year as next
  UPDATE school_years 
  SET is_next = true 
  WHERE id = year_id;
END;
$$;

-- Create function to automatically create next year if it doesn't exist
CREATE OR REPLACE FUNCTION create_next_school_year(current_year_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year_data RECORD;
  next_year_start DATE;
  next_year_end DATE;
  next_year_name TEXT;
  new_year_id UUID;
BEGIN
  -- Get current year data
  SELECT * INTO current_year_data
  FROM school_years
  WHERE id = current_year_id;
  
  -- Calculate next year dates
  next_year_start := current_year_data.start_date + INTERVAL '1 year';
  next_year_end := current_year_data.end_date + INTERVAL '1 year';
  
  -- Generate next year name
  next_year_name := TO_CHAR(next_year_start, 'YYYY') || '-' || TO_CHAR(next_year_end, 'YYYY');
  
  -- Check if next year already exists
  SELECT id INTO new_year_id
  FROM school_years
  WHERE start_date = next_year_start;
  
  -- If not exists, create it
  IF new_year_id IS NULL THEN
    INSERT INTO school_years (name, start_date, end_date, is_current, is_next)
    VALUES (next_year_name, next_year_start, next_year_end, false, true)
    RETURNING id INTO new_year_id;
  ELSE
    -- If exists, mark it as next
    UPDATE school_years SET is_next = true WHERE id = new_year_id;
  END IF;
  
  RETURN new_year_id;
END;
$$;