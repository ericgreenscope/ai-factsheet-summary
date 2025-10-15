-- Add storage_path_pdf column to files table
-- This stores the intermediate PDF used for AI analysis

ALTER TABLE files
ADD COLUMN IF NOT EXISTS storage_path_pdf TEXT;

-- Add comment for documentation
COMMENT ON COLUMN files.storage_path_pdf IS 'Storage path for intermediate PDF used for AI analysis (converted from PPTX)';

-- Note: This is for debug purposes and can be used to download the PDF
-- Storage path format: factsheets/pdf/{file_id}.pdf
