-- Update match_requests RPC to include pdf_url for AI-generated summaries

CREATE OR REPLACE FUNCTION match_requests(
  p_service TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50,
  p_limit_n INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  service TEXT,
  description TEXT,
  requested_start TIMESTAMPTZ,
  status TEXT,
  distance_km DOUBLE PRECISION,
  pdf_url TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.patient_id,
    cr.service,
    cr.description,
    cr.requested_start,
    cr.status,
    (ST_Distance(cr.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0)::DOUBLE PRECISION AS distance_km,
    cr.pdf_url
  FROM care_requests cr
  WHERE
    cr.status = 'open'
    AND cr.service = p_service
    AND ST_DWithin(
      cr.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY
    cr.location::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    cr.requested_start ASC
  LIMIT p_limit_n;
END;
$$;
