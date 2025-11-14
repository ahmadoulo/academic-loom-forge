-- Add header_style column to document_templates table
ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS header_style TEXT DEFAULT 'modern';

-- Add comment to describe the column
COMMENT ON COLUMN document_templates.header_style IS 'Style of the document header: modern, classic, minimal, or elegant';