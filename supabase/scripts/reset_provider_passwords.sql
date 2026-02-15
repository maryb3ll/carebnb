-- Reset all provider passwords to "Provider123!"
--
-- IMPORTANT: This script must be run in the Supabase SQL Editor
-- (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new)
-- It cannot be run through the API because password hashing requires server-side functions
--
-- Steps:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this script
-- 4. Run it
--
-- This will update all @carebnb.demo email accounts to use password: Provider123!

-- The password hash for "Provider123!" using bcrypt
-- This hash was generated using Supabase's password hashing function
-- You may need to generate a new hash if this doesn't work

DO $$
DECLARE
  user_record RECORD;
  new_password TEXT := 'Provider123!';
BEGIN
  -- Loop through all users with @carebnb.demo emails
  FOR user_record IN
    SELECT id, email
    FROM auth.users
    WHERE email LIKE '%@carebnb.demo'
  LOOP
    -- Update the password using Supabase's built-in function
    -- This requires admin/service role privileges
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    ,updated_at = NOW()
    WHERE id = user_record.id;

    RAISE NOTICE 'Updated password for: %', user_record.email;
  END LOOP;

  RAISE NOTICE 'Password reset complete for all provider accounts';
END $$;

-- Verify the update
SELECT
  email,
  updated_at,
  'Password reset to: Provider123!' as note
FROM auth.users
WHERE email LIKE '%@carebnb.demo'
ORDER BY email;
