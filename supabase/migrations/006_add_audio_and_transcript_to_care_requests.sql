-- Add audio_url and transcript columns to care_requests for AI-powered intake

ALTER TABLE care_requests
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS intake_type TEXT; -- 'audio' or 'text'

-- Add comments
COMMENT ON COLUMN care_requests.audio_url IS 'URL to audio file in Supabase storage if patient submitted audio intake';
COMMENT ON COLUMN care_requests.transcript IS 'Whisper transcript if audio was submitted, or original text if text was submitted';
COMMENT ON COLUMN care_requests.intake_type IS 'Type of intake submission: audio or text';
