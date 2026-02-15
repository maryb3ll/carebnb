-- Run after schema.sql. Adds auth linkage and intake fields.

-- Link patients to Supabase Auth (optional)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Link providers to Supabase Auth (optional)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);

-- Intake/booking details (patient name, phone, address, consent)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT false;
