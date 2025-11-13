-- Add footer_content column to document_templates table
ALTER TABLE document_templates 
ADD COLUMN footer_content TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN document_templates.footer_content IS 'Custom footer content for the document template';