-- Create the table to store document metadata
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL,
  description text NULL,
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS) for the new table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for the documents table
-- Allow admin users to perform all actions
CREATE POLICY "Allow admin all access"
ON public.documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view all documents
CREATE POLICY "Allow authenticated users to read documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);


-- Create a new storage bucket for general documents if it doesn't exist
-- Note: You can run this part separately or check if the bucket exists first.
-- The UI will attempt to use a bucket named 'general-documents'.
-- Creating it here for completeness.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('general-documents', 'general-documents', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;


-- Create policies for the 'general-documents' storage bucket
-- Allow anyone to view files (public bucket)
CREATE POLICY "Allow public read access to general documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'general-documents');

-- Allow authenticated users to upload, update, and delete files
CREATE POLICY "Allow authenticated users to manage general documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'general-documents');

-- Note: You might already have a 'deposit-receipts' bucket with similar policies.
-- If you prefer to use one bucket for all files, you can adjust the bucket name
-- in `src/app/actions/documents.ts` and ensure the policies are sufficient.
-- The current implementation creates and uses a new 'general-documents' bucket.
