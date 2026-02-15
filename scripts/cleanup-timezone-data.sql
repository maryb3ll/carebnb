-- Cleanup script for timezone issues
-- This script identifies and optionally fixes bookings/care_requests with incorrect timezones

-- ============================================================================
-- 1. DIAGNOSTIC: Show current state
-- ============================================================================

-- Show all bookings for Bryan Drucker
SELECT
  b.id,
  b.status,
  b.scheduled_at,
  b.scheduled_at AT TIME ZONE 'America/Los_Angeles' as scheduled_at_pst,
  b.care_request_id,
  cr.status as care_request_status
FROM bookings b
LEFT JOIN care_requests cr ON b.care_request_id = cr.id
JOIN providers p ON b.provider_id = p.id
WHERE p.email = 'bryan.drucker@carebnb.demo'
ORDER BY b.created_at DESC;

-- Show all care_requests that should be in pending requests
SELECT
  id,
  status,
  service,
  requested_start,
  requested_start AT TIME ZONE 'America/Los_Angeles' as requested_start_pst,
  created_at
FROM care_requests
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 10;

-- Show orphaned care_requests (declined but still showing as open)
SELECT
  cr.id,
  cr.status as care_request_status,
  cr.requested_start,
  b.id as booking_id,
  b.status as booking_status
FROM care_requests cr
LEFT JOIN bookings b ON b.care_request_id = cr.id
WHERE cr.status = 'open'
  AND b.status IN ('declined', 'cancelled')
ORDER BY cr.created_at DESC;

-- ============================================================================
-- 2. CLEANUP: Fix declined care_requests
-- ============================================================================

-- Update care_requests that have declined/cancelled bookings but are still 'open'
-- UNCOMMENT TO RUN:
/*
UPDATE care_requests cr
SET
  status = 'declined',
  updated_at = NOW()
FROM bookings b
WHERE b.care_request_id = cr.id
  AND cr.status = 'open'
  AND b.status IN ('declined', 'cancelled');
*/

-- ============================================================================
-- 3. CLEANUP: Remove duplicate pending bookings
-- ============================================================================

-- Find duplicate pending bookings for the same care_request
SELECT
  care_request_id,
  provider_id,
  COUNT(*) as booking_count,
  ARRAY_AGG(id) as booking_ids,
  ARRAY_AGG(status) as statuses
FROM bookings
WHERE care_request_id IS NOT NULL
GROUP BY care_request_id, provider_id
HAVING COUNT(*) > 1;

-- Delete duplicate pending bookings (keep the most recent one)
-- UNCOMMENT TO RUN:
/*
DELETE FROM bookings
WHERE id IN (
  SELECT b1.id
  FROM bookings b1
  JOIN bookings b2 ON b1.care_request_id = b2.care_request_id
    AND b1.provider_id = b2.provider_id
    AND b1.id < b2.id
  WHERE b1.care_request_id IS NOT NULL
);
*/

-- ============================================================================
-- 4. VERIFICATION: Check cleanup results
-- ============================================================================

-- Count by status
SELECT
  status,
  COUNT(*) as count
FROM care_requests
GROUP BY status
ORDER BY status;

SELECT
  status,
  COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY status;

-- ============================================================================
-- NOTES:
-- - Run diagnostic queries first to understand the data
-- - Uncomment cleanup queries one at a time
-- - Verify results before running next cleanup
-- - All timestamps are stored in UTC in the database
-- - AT TIME ZONE converts to specified timezone for display only
-- ============================================================================
