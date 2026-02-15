-- Add pdf_url column to care_requests table to store Supabase storage URL for AI-generated PDFs

ALTER TABLE care_requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment
COMMENT ON COLUMN care_requests.pdf_url IS 'URL to final.zip file in Supabase storage containing AI-generated summary and sources';
