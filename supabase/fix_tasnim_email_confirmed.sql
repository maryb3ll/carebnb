-- =============================================================================
-- FIX "Email not confirmed" FOR Tasnim@gmail.com (PROVIDER – Tasnim Beg MD)
-- =============================================================================
-- Tasnim is a PROVIDER (doctor), not a patient. This script only:
--   1. Confirms the auth user's email so they can log in.
--   2. Links that auth user to the existing provider row "Tasnim Beg MD".
-- No patient record is created or modified.
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor (one run).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP A: DIAGNOSTIC – See the user row BEFORE any change
-- (If this returns 0 rows, the user doesn't exist: create them in
--  Authentication → Users → Add user → Email: Tasnim@gmail.com, Password: Tasnim)
-- -----------------------------------------------------------------------------
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN 'OK – already confirmed'
    ELSE 'NOT CONFIRMED – will fix below'
  END AS status
FROM auth.users
WHERE LOWER(TRIM(email)) = 'tasnim@gmail.com';

-- If the row exists and email_confirmed_at is NULL, the next step will fix it.
-- If no row exists, create the user in Dashboard first, then run this script again.

-- -----------------------------------------------------------------------------
-- STEP B: FIX – Set email as confirmed (required for sign-in)
-- -----------------------------------------------------------------------------
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE LOWER(TRIM(email)) = 'tasnim@gmail.com';

-- -----------------------------------------------------------------------------
-- STEP C: VERIFY – Same query again; email_confirmed_at should now be set
-- -----------------------------------------------------------------------------
SELECT
  id,
  email,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN 'SUCCESS – email is now confirmed. Try logging in.'
    ELSE 'FAIL – email_confirmed_at still NULL (unexpected)'
  END AS result
FROM auth.users
WHERE LOWER(TRIM(email)) = 'tasnim@gmail.com';

-- -----------------------------------------------------------------------------
-- STEP D: OPTIONAL – Link provider "Tasnim Beg MD" to this user (if not done)
-- -----------------------------------------------------------------------------
UPDATE providers p
SET user_id = u.id
FROM auth.users u
WHERE LOWER(TRIM(u.email)) = 'tasnim@gmail.com'
  AND p.name = 'Tasnim Beg MD';

-- -----------------------------------------------------------------------------
-- WHAT TO DO NEXT
-- -----------------------------------------------------------------------------
-- 1. Check STEP C result: "SUCCESS – email is now confirmed" should appear.
-- 2. In your app, log in with:  Tasnim@gmail.com  /  Tasnim
-- 3. Tasnim is a provider: after login, use the provider dashboard (My jobs, Find open requests).
-- 4. If it still says "Email not confirmed":
--    - Supabase Dashboard → Authentication → Providers → Email
--    - Turn OFF "Confirm email" so new sign-ins don’t require confirmation.
--    - Then try logging in again (and/or run this script once more).
-- =============================================================================
