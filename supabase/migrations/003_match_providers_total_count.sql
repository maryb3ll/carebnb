-- Add total_count to match_providers so the API can return total matching providers (for "X providers found").
-- Each row gets the same total_count (window count before LIMIT).
-- Must DROP first because we are changing the return type (adding total_count).

DROP FUNCTION IF EXISTS match_providers(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ, DOUBLE PRECISION, INTEGER);

CREATE OR REPLACE FUNCTION match_providers(
  p_service TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_when TIMESTAMPTZ DEFAULT NULL,
  p_radius_km DOUBLE PRECISION DEFAULT 50,
  p_limit_n INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  services TEXT[],
  specialties TEXT[],
  rating NUMERIC,
  visit_count INTEGER,
  price NUMERIC,
  next_available TIMESTAMPTZ,
  photo_url TEXT,
  distance_km DOUBLE PRECISION,
  total_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.name,
    pr.role,
    pr.services,
    pr.specialties,
    pr.rating,
    pr.visit_count,
    pr.price,
    pr.next_available,
    pr.photo_url,
    (ST_Distance(pr.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0)::DOUBLE PRECISION AS distance_km,
    (COUNT(*) OVER())::INTEGER AS total_count
  FROM providers pr
  WHERE
    p_service = ANY(pr.services)
    AND ST_DWithin(
      pr.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
    AND (p_when IS NULL OR pr.next_available IS NULL OR pr.next_available <= p_when + INTERVAL '2 hours')
  ORDER BY
    pr.location::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    pr.rating DESC,
    pr.visit_count DESC
  LIMIT p_limit_n;
END;
$$;
