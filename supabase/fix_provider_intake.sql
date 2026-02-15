-- Run this once in Supabase SQL Editor to fix:
-- 1) Bookings can store AI intake (transcript, keywords) so providers see the report
-- 2) Tasnim (Tasnim@gmail.com) is linked as provider "Tasnim Beg MD" so her dashboard shows requests
--
-- Then: have the patient (x@x.com) submit a NEW booking with intake (pick Tasnim, date/time, complete AI intake, submit).
-- Tasnim will see it after clicking Refresh on the provider dashboard.

-- 1) Add intake columns to bookings (if not already present)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_keywords TEXT[] DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_transcript TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_session_id TEXT;

-- 2) Confirm Tasnim's auth email so sign-in works
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'Tasnim@gmail.com';

-- 3) Link provider "Tasnim Beg MD" to auth user Tasnim@gmail.com
UPDATE providers p
SET user_id = u.id
FROM auth.users u
WHERE u.email = 'Tasnim@gmail.com'
  AND p.name = 'Tasnim Beg MD';
