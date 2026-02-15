-- Run this in Supabase SQL Editor if Tasnim (Tasnim@gmail.com) can log in
-- but does NOT see pending patient requests on the provider dashboard.
--
-- This script:
-- 1) Confirms the auth user's email so sign-in works.
-- 2) Links the provider row "Tasnim Beg MD" to that auth user (so GET /api/bookings?for=provider returns her bookings).

-- 1) Confirm email for Tasnim@gmail.com
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'Tasnim@gmail.com';

-- 2) Link provider "Tasnim Beg MD" to auth user Tasnim@gmail.com
UPDATE providers p
SET user_id = u.id
FROM auth.users u
WHERE u.email = 'Tasnim@gmail.com'
  AND p.name = 'Tasnim Beg MD';

-- Verify: run this and ensure you see one row with user_id set:
-- SELECT id, name, user_id FROM providers WHERE name = 'Tasnim Beg MD';
