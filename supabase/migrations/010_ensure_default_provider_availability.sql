-- Ensure all providers have default Monday-Friday 9 AM - 5 PM availability
-- This will set default hours for any providers that don't have recurring schedules

INSERT INTO provider_availability (
  provider_id,
  availability_type,
  day_of_week,
  start_time,
  end_time,
  notes,
  created_at,
  updated_at
)
SELECT
  p.id,
  'recurring'::TEXT,
  day_num,
  '09:00'::TIME,
  '17:00'::TIME,
  'Default schedule - please customize'::TEXT,
  NOW(),
  NOW()
FROM providers p
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS days(day_num) -- Monday=1 through Friday=5
WHERE NOT EXISTS (
  SELECT 1 FROM provider_availability pa
  WHERE pa.provider_id = p.id
  AND pa.availability_type = 'recurring'
  AND pa.day_of_week = days.day_num
)
ON CONFLICT DO NOTHING;

-- Log how many providers now have availability
DO $$
DECLARE
  provider_count INTEGER;
  availability_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT id) INTO provider_count FROM providers;
  SELECT COUNT(DISTINCT provider_id) INTO availability_count
  FROM provider_availability
  WHERE availability_type = 'recurring';

  RAISE NOTICE 'Total providers: %, Providers with availability: %', provider_count, availability_count;
END $$;
