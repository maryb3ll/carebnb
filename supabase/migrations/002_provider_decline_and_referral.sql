-- Provider decline with reason + optional referral to another provider.

-- Allow 'declined' status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'declined'));

-- Decline reason and optional referred provider
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referred_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_referred_provider ON bookings(referred_provider_id);
