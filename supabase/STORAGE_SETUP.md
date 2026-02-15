# Supabase Storage Setup for CareBnB

This document describes how to set up the Supabase storage bucket for AI-generated medical summaries.

## Create Storage Bucket

1. Go to your Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Configure the bucket:
   - **Name:** `carebnbstoragebucket`
   - **Public bucket:** Yes (enable public access)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** `application/zip, application/pdf`

## Bucket Policies

After creating the bucket, set up the following policies:

### Policy 1: Public Read Access
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'carebnbstoragebucket');
```

### Policy 2: Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'carebnbstoragebucket');
```

### Policy 3: Service Role Full Access
```sql
CREATE POLICY "Service role full access"
ON storage.objects
TO service_role
USING (bucket_id = 'carebnbstoragebucket');
```

## File Naming Convention

Files uploaded to this bucket follow this naming pattern:
- `final_[unique_id].zip` - AI-generated medical summary package

Example: `final_a1b2c3d4.zip`

## Contents of ZIP Files

Each ZIP file contains:
- `summary.pdf` - Comprehensive medical analysis with:
  - Extracted keywords
  - Transcript summary
  - Patient clinical summary
  - SOAP notes
  - Related healthcare fields
  - Diagnostic devices recommendations
  - Urgency level assessment

- `source_*.pdf` (if applicable) - Research articles with AI-highlighted relevant passages

## Usage in Application

The AI Intake API (`/api/intake/process`) automatically:
1. Processes text or audio input through the audio-model pipeline
2. Generates medical summaries and research
3. Creates final.zip with all outputs
4. Uploads to Supabase storage with unique ID
5. Returns public URL
6. Stores URL in `care_requests.pdf_url` field

## Verify Setup

Test that the bucket is working:

```javascript
// In browser console or test script
const { data, error } = await supabase.storage
  .from('carebnbstoragebucket')
  .list();

console.log('Bucket accessible:', !error);
```

## Cleanup

To remove old files (optional cron job):

```sql
-- Delete files older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'carebnbstoragebucket'
  AND created_at < NOW() - INTERVAL '90 days';
```
