-- Migration: Add freeform analysis text fields
-- Adds analysis_text to suggestions and analysis_text_final to reviews

ALTER TABLE suggestions
ADD COLUMN IF NOT EXISTS analysis_text TEXT;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS analysis_text_final TEXT;
