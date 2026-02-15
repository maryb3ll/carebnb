-- Add 'declined' as a valid status for care_requests
-- This allows providers to decline requests, which removes them from the pending list

-- Drop the old constraint
ALTER TABLE care_requests DROP CONSTRAINT IF EXISTS care_requests_status_check;

-- Add the new constraint with 'declined' included
ALTER TABLE care_requests ADD CONSTRAINT care_requests_status_check
  CHECK (status IN ('open', 'matched', 'closed', 'declined'));

-- Update any existing care_requests that should be declined
-- (care_requests linked to declined bookings)
UPDATE care_requests cr
SET status = 'declined', updated_at = NOW()
WHERE cr.status = 'open'
  AND EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.care_request_id = cr.id
      AND b.status = 'declined'
  );
