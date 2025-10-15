-- Add storage_path_pdf column to files table
-- This stores the user-uploaded PDF used for AI analysis

ALTER TABLE files
ADD COLUMN IF NOT EXISTS storage_path_pdf TEXT;

-- Add comment for documentation
COMMENT ON COLUMN files.storage_path_pdf IS 'Storage path for user-uploaded PDF used for AI analysis (preserves visual elements like charts and images)';

-- Note: Users upload both PPTX and PDF versions of the same factsheet
-- - PPTX: Used for regenerating output with AI summary
-- - PDF: Used for AI analysis to preserve visual fidelity
-- Storage path format: factsheets/pdf/{file_id}.pdf
