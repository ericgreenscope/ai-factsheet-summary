-- ESG Factsheet AI - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- FILES table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    original_filename TEXT NOT NULL,
    storage_path_original TEXT NOT NULL,
    storage_path_regenerated TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBS table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ANALYZE', 'REGENERATE')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUGGESTIONS table
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    model_name TEXT,
    raw_model_output JSONB,
    strengths TEXT,
    weaknesses TEXT,
    action_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    suggestion_id UUID REFERENCES suggestions(id) ON DELETE SET NULL,
    editor_notes TEXT,
    strengths_final TEXT,
    weaknesses_final TEXT,
    action_plan_final TEXT,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'APPROVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_file_id ON jobs(file_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_file_id ON suggestions(file_id);
CREATE INDEX IF NOT EXISTS idx_reviews_file_id ON reviews(file_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Updated_at trigger for jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Storage Buckets Setup Instructions
-- Run these in Supabase Dashboard > Storage:
-- 1. Create a bucket named "factsheets"
-- 2. Set policies as needed (e.g., authenticated users can upload/read)
-- 
-- Or use the Supabase API to create the bucket programmatically.
-- The backend will use paths like:
--   - factsheets/original/{file_id}.pptx
--   - factsheets/regenerated/{file_id}.pptx

