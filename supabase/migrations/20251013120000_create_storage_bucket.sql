-- Create factsheets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('factsheets', 'factsheets', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the factsheets bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload factsheets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'factsheets');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read factsheets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'factsheets');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update factsheets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'factsheets');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete factsheets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'factsheets');
