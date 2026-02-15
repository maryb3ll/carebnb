-- Store AI intake result on bookings so providers can see analysis (keywords, transcript).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_keywords TEXT[] DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_transcript TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_session_id TEXT;
