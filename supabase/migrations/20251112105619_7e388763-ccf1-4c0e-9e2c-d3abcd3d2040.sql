-- Add footer_color column to document_templates
ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS footer_color TEXT DEFAULT '#1e40af';