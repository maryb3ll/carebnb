-- CareBnb setup verification — run in Supabase SQL Editor (read-only checks)
-- Use this to confirm schema, extensions, and functions match the project setup.

-- 1. Extensions (expect 2 rows: postgis, pgcrypto)
SELECT '1. Extensions' AS check_section, extname AS name, 'installed' AS status
FROM pg_extension
WHERE extname IN ('postgis', 'pgcrypto')
ORDER BY extname;

-- 2. Tables (expect 4 rows: bookings, care_requests, patients, providers)
SELECT '2. Tables' AS check_section, tablename AS name, 'exists' AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('providers', 'patients', 'care_requests', 'bookings')
ORDER BY tablename;

-- 3. Auth/intake columns (migration 001): providers.user_id, patients.user_id, bookings.patient_name
SELECT '3. Auth/Intake columns' AS check_section, table_name || '.' || column_name AS name, 'exists' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'providers' AND column_name = 'user_id')
    OR (table_name = 'patients' AND column_name = 'user_id')
    OR (table_name = 'bookings' AND column_name IN ('patient_name', 'patient_phone', 'address_notes', 'consent'))
  )
ORDER BY table_name, column_name;

-- 4. Decline/referral columns (migration 002): bookings.decline_reason, referred_provider_id + status 'declined'
SELECT '4. Decline/Referral' AS check_section, table_name || '.' || column_name AS name, 'exists' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('decline_reason', 'referred_provider_id')
ORDER BY column_name;

-- 5. Functions (expect 2 rows: match_providers, match_requests)
SELECT '5. Functions' AS check_section, routine_name AS name, 'exists' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('match_providers', 'match_requests')
ORDER BY routine_name;

-- 6. Row counts
SELECT '6. Row counts' AS check_section, 'providers' AS name, count(*)::text AS status FROM providers
UNION ALL SELECT '6. Row counts', 'patients', count(*)::text FROM patients
UNION ALL SELECT '6. Row counts', 'care_requests', count(*)::text FROM care_requests
UNION ALL SELECT '6. Row counts', 'bookings', count(*)::text FROM bookings;
