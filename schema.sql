-- =================================================================
-- SQL for Documents Feature
-- =================================================================

-- Step 1: Create the documents table
-- This table will store metadata about your uploaded files.
-- Run this query in the Supabase SQL Editor.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    category text NOT NULL,
    description text,
    CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- Step 2: Set up Row Level Security (RLS) for the table
-- -----------------------------------------------------------------
-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all documents
CREATE POLICY "Allow public read access to documents"
ON public.documents
FOR SELECT
USING (true);

-- Allow admin users (service_role) to perform all actions
-- This is handled by the server-side actions using the service_role key,
-- which bypasses RLS. No explicit policy is needed for the service role.


-- Step 3: Set up the Storage Bucket
-- -----------------------------------------------------------------
-- 1. Go to the "Storage" section in your Supabase dashboard.
-- 2. Create a new **public** bucket named `general-documents`.
-- 3. The following policies will be automatically created by Supabase
--    when you make the bucket public, but you can run them if needed.

-- Allow public read access to files in the `general-documents` bucket
CREATE POLICY "Public read access for general-documents"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'general-documents' );

-- Allow authenticated users to upload files to the `general-documents` bucket.
-- The app's server-side code will handle the uploads.
CREATE POLICY "Allow authenticated uploads to general-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'general-documents' );
