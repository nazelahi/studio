-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    category text NOT NULL,
    description text NULL,
    CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- Enable RLS if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow admin full access" ON public.documents;
DROP POLICY IF EXISTS "Allow public read access" ON public.documents;
DROP POLICY IF EXISTS "Allow admin all access to general documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to general documents" ON storage.objects;


-- 3. Create Correct Policies for Documents Table
-- Allow authenticated users (admins) to perform all operations
CREATE POLICY "Allow authenticated users full access"
ON public.documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Create Correct Storage Bucket Policies
-- This assumes you have a PUBLIC bucket named 'general-documents'

-- Allow authenticated users (admins) to upload/manage all files in the bucket
CREATE POLICY "Allow authenticated users all access to general documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'general-documents')
WITH CHECK (bucket_id = 'general-documents');

-- Allow anyone to view files (since it's a public bucket)
CREATE POLICY "Allow public read access to general documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'general-documents');
