-- Fix: Add storage_path_pdf column if it doesn't exist
-- This migration ensures the PDF storage path column exists for dual-file workflow

ALTER TABLE files
ADD COLUMN IF NOT EXISTS storage_path_pdf TEXT;

-- Add comment for documentation
COMMENT ON COLUMN files.storage_path_pdf IS 'Storage path for user-uploaded PDF used for AI analysis (preserves visual elements like charts and images)';

-- Update existing records to set default values if needed
-- This is not strictly necessary but keeps the database clean
UPDATE files
SET storage_path_pdf = NULL
WHERE storage_path_pdf IS NULL;