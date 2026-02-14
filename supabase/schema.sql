-- CareBnb Marketplace Schema
-- Run in Supabase SQL Editor after enabling postgis + pgcrypto (Phase 0.2)

-- =============================================================================
-- EXTENSIONS (enable in Supabase dashboard if not already)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Providers: care providers with location (geography), services, availability
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  visit_count INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  next_available TIMESTAMPTZ,
  photo_url TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Care requests: open "jobs" from patients
CREATE TABLE IF NOT EXISTS care_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  description TEXT,
  requested_start TIMESTAMPTZ NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings: link provider + patient (or care_request)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  care_request_id UUID REFERENCES care_requests(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- GIST for geography distance queries
CREATE INDEX IF NOT EXISTS idx_providers_location ON providers USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_care_requests_location ON care_requests USING GIST (location);

-- GIN for array containment (services)
CREATE INDEX IF NOT EXISTS idx_providers_services ON providers USING GIN (services);

-- Status and service for filtering
CREATE INDEX IF NOT EXISTS idx_care_requests_status ON care_requests (status);
CREATE INDEX IF NOT EXISTS idx_care_requests_service ON care_requests (service);
CREATE INDEX IF NOT EXISTS idx_care_requests_requested_start ON care_requests (requested_start);

-- =============================================================================
-- RPC: match_providers(service, lat, lng, when, radius_km, limit_n)
-- Returns providers within radius, with service, roughly available near requested time
-- Sort: distance asc, rating desc, visit_count desc
-- =============================================================================
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
  distance_km DOUBLE PRECISION
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
    (ST_Distance(pr.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0)::DOUBLE PRECISION AS distance_km
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

-- =============================================================================
-- RPC: match_requests(service, lat, lng, radius_km, limit_n)
-- Returns open care requests within radius
-- Sort: distance asc, requested_start asc
-- =============================================================================
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
  distance_km DOUBLE PRECISION
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
    (ST_Distance(cr.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0)::DOUBLE PRECISION AS distance_km
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

-- =============================================================================
-- SEED DATA (SF area: ~37.77, -122.42)
-- =============================================================================

-- 1 patient
INSERT INTO patients (id, name, email) VALUES
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'Demo Patient', 'demo@carebnb.demo')
ON CONFLICT DO NOTHING;

-- 10–20 providers near SF (lat, lng in WGS84; geography uses lng, lat order in ST_MakePoint)
INSERT INTO providers (name, role, services, specialties, rating, visit_count, price, next_available, photo_url, location) VALUES
  ('Maria Santos', 'RN', ARRAY['nursing', 'medication'], ARRAY['elderly', 'post-op'], 4.9, 120, 85.00, NOW() + INTERVAL '1 hour', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200', ST_SetSRID(ST_MakePoint(-122.42, 37.77), 4326)::geography),
  ('James Chen', 'CNA', ARRAY['companion', 'personal_care'], ARRAY['dementia', 'mobility'], 4.8, 95, 45.00, NOW() + INTERVAL '2 hours', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200', ST_SetSRID(ST_MakePoint(-122.41, 37.78), 4326)::geography),
  ('Elena Rodriguez', 'LVN', ARRAY['nursing', 'wound_care'], ARRAY['wounds', 'diabetes'], 4.95, 200, 75.00, NOW() + INTERVAL '30 minutes', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200', ST_SetSRID(ST_MakePoint(-122.43, 37.76), 4326)::geography),
  ('David Kim', 'Caregiver', ARRAY['companion', 'personal_care', 'transport'], ARRAY['elderly', 'respite'], 4.7, 60, 40.00, NOW() + INTERVAL '3 hours', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200', ST_SetSRID(ST_MakePoint(-122.40, 37.79), 4326)::geography),
  ('Sarah Johnson', 'RN', ARRAY['nursing', 'medication', 'wound_care'], ARRAY['hospice', 'elderly'], 4.85, 150, 90.00, NOW() + INTERVAL '4 hours', 'https://images.unsplash.com/photo-1582750433449-648a127bbf80?w=200', ST_SetSRID(ST_MakePoint(-122.44, 37.75), 4326)::geography),
  ('Michael Torres', 'CNA', ARRAY['personal_care', 'companion'], ARRAY['mobility', 'alzheimers'], 4.6, 45, 42.00, NOW() + INTERVAL '1 day', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200', ST_SetSRID(ST_MakePoint(-122.39, 37.80), 4326)::geography),
  ('Lisa Park', 'LVN', ARRAY['nursing', 'medication'], ARRAY['pediatric', 'chronic'], 4.88, 88, 78.00, NOW() + INTERVAL '2 hours', 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=200', ST_SetSRID(ST_MakePoint(-122.45, 37.74), 4326)::geography),
  ('Robert Williams', 'Caregiver', ARRAY['companion', 'transport'], ARRAY['respite', 'elderly'], 4.5, 30, 38.00, NOW(), 'https://images.unsplash.com/photo-1612531386530-97286d97c5b2?w=200', ST_SetSRID(ST_MakePoint(-122.38, 37.81), 4326)::geography),
  ('Ana Martinez', 'RN', ARRAY['nursing', 'wound_care', 'medication'], ARRAY['post-op', 'wounds'], 4.92, 180, 88.00, NOW() + INTERVAL '1 hour', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200', ST_SetSRID(ST_MakePoint(-122.46, 37.73), 4326)::geography),
  ('Chris Nguyen', 'CNA', ARRAY['personal_care', 'companion'], ARRAY['dementia', 'elderly'], 4.75, 72, 44.00, NOW() + INTERVAL '5 hours', 'https://images.unsplash.com/photo-1618499897164-2c4ac442b0a2?w=200', ST_SetSRID(ST_MakePoint(-122.37, 37.82), 4326)::geography),
  ('Jennifer Lee', 'LVN', ARRAY['nursing', 'medication'], ARRAY['diabetes', 'chronic'], 4.82, 110, 72.00, NOW() + INTERVAL '6 hours', 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=200', ST_SetSRID(ST_MakePoint(-122.47, 37.72), 4326)::geography),
  ('Thomas Brown', 'Caregiver', ARRAY['companion', 'personal_care', 'transport'], ARRAY['mobility', 'respite'], 4.65, 55, 41.00, NOW() + INTERVAL '12 hours', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', ST_SetSRID(ST_MakePoint(-122.36, 37.83), 4326)::geography)
ON CONFLICT DO NOTHING;

-- 2–3 care requests near SF
INSERT INTO care_requests (patient_id, service, description, requested_start, location, status) VALUES
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'nursing', 'Need medication administration and vitals check twice daily.', NOW() + INTERVAL '1 day', ST_SetSRID(ST_MakePoint(-122.42, 37.77), 4326)::geography, 'open'),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'companion', 'Friendly visit and light meal prep for elderly parent.', NOW() + INTERVAL '2 days', ST_SetSRID(ST_MakePoint(-122.41, 37.78), 4326)::geography, 'open'),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'personal_care', 'Morning routine assistance and mobility support.', NOW() + INTERVAL '3 days', ST_SetSRID(ST_MakePoint(-122.43, 37.76), 4326)::geography, 'open')
ON CONFLICT DO NOTHING;
