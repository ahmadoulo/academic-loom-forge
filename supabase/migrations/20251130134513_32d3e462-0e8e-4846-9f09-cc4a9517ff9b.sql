-- Create school_admission table for managing student admission requests
CREATE TABLE school_admission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Personal Information
  civility TEXT NOT NULL CHECK (civility IN ('M', 'Mme', 'Mlle')),
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  nationality TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Desired Formation
  desired_cycle_id UUID NOT NULL REFERENCES cycles(id),
  desired_option_id UUID REFERENCES options(id),
  education_level TEXT NOT NULL,
  last_institution TEXT NOT NULL,
  last_institution_type TEXT NOT NULL CHECK (last_institution_type IN ('public', 'private', 'mission')),
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'traite')),
  notes TEXT,
  converted_to_student_id UUID REFERENCES students(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE school_admission ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for public admission form)
CREATE POLICY "Anyone can submit admission requests"
  ON school_admission
  FOR INSERT
  WITH CHECK (true);

-- Schools can view their admission requests
CREATE POLICY "Schools can view their admission requests"
  ON school_admission
  FOR SELECT
  USING (true);

-- Schools can update their admission requests
CREATE POLICY "Schools can update their admission requests"
  ON school_admission
  FOR UPDATE
  USING (true);

-- Schools can delete their admission requests
CREATE POLICY "Schools can delete their admission requests"
  ON school_admission
  FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_school_admission_school_id ON school_admission(school_id);
CREATE INDEX idx_school_admission_status ON school_admission(status);

-- Create trigger for updated_at
CREATE TRIGGER update_school_admission_updated_at
  BEFORE UPDATE ON school_admission
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();