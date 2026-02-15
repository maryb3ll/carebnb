-- Tasnim is a PROVIDER (Tasnim Beg MD), not a patient.
-- This links the existing provider "Tasnim Beg MD" (from stanford_doctors2.csv)
-- to auth user Tasnim@gmail.com so they can log in to the provider dashboard.
--
-- STEP 1 – Create the auth user in Supabase Dashboard:
--   Authentication → Users → Add user (or Create new user)
--   Email: Tasnim@gmail.com
--   Password: Tasnim
--
-- STEP 2 – Run this script in SQL Editor.
--   (Ensure Stanford providers are seeded first: run seed_stanford_providers.sql if needed.)

-- 1) Confirm email so sign-in works (fixes "Email not confirmed")
-- (confirmed_at is generated; only set email_confirmed_at.)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'Tasnim@gmail.com';

-- 2) Link provider "Tasnim Beg MD" to this auth user
UPDATE providers p
SET user_id = u.id
FROM auth.users u
WHERE u.email = 'Tasnim@gmail.com'
  AND p.name = 'Tasnim Beg MD';

-- If provider link updated 0 rows: ensure seed_stanford_providers.sql has been run, then run this again.
