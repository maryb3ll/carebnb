-- Migration: Provider Availability Tracking System
-- Purpose: Add comprehensive availability management with recurring schedules and time blocks
-- Date: 2026-02-15

-- ============================================================================
-- 1. Create provider_availability table
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

  -- Weekly recurring schedule (e.g., Mon-Fri 9-5)
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,

  -- One-time overrides (specific date availability or blocks)
  specific_date DATE,
  is_available BOOLEAN NOT NULL DEFAULT true, -- false = blocked time

  -- Type: 'recurring', 'one_time_available', 'one_time_blocked'
  availability_type TEXT NOT NULL CHECK (availability_type IN ('recurring', 'one_time_available', 'one_time_blocked')),

  -- Optional notes/reason
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT valid_recurring CHECK (
    (availability_type = 'recurring' AND day_of_week IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND specific_date IS NULL)
    OR
    (availability_type IN ('one_time_available', 'one_time_blocked') AND specific_date IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND day_of_week IS NULL)
  ),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================================================
-- 2. Create performance indexes
-- ============================================================================

-- Index for provider lookups
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider ON provider_availability(provider_id);

-- Index for recurring schedule queries (by day of week)
CREATE INDEX IF NOT EXISTS idx_provider_availability_day ON provider_availability(day_of_week)
  WHERE availability_type = 'recurring';

-- Index for one-time availability/blocks (by specific date)
CREATE INDEX IF NOT EXISTS idx_provider_availability_date ON provider_availability(specific_date)
  WHERE availability_type IN ('one_time_available', 'one_time_blocked');

-- Composite index for type-based queries
CREATE INDEX IF NOT EXISTS idx_provider_availability_type ON provider_availability(availability_type);

-- ============================================================================
-- 3. Enhance bookings table for conflict detection
-- ============================================================================

-- Add duration field (default 60 minutes per user preference)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0);

-- Note: We'll compute scheduled_end in queries as: scheduled_at + (duration_minutes || ' minutes')::interval
-- This avoids PostgreSQL immutability issues with GENERATED columns

-- ============================================================================
-- 4. Create indexes for booking conflict checking
-- ============================================================================

-- Index for finding bookings by provider and scheduled time
-- This index is sufficient for both time-based and date-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_provider_scheduled
  ON bookings(provider_id, scheduled_at)
  WHERE status IN ('pending', 'confirmed');

-- ============================================================================
-- 5. Seed default availability for existing providers
-- ============================================================================

-- Give all existing providers a default Mon-Fri 9 AM - 5 PM schedule
-- This ensures backward compatibility and gets providers started quickly
INSERT INTO provider_availability (provider_id, availability_type, day_of_week, start_time, end_time, notes)
SELECT
  p.id,
  'recurring'::TEXT,
  day_num::INTEGER,
  '09:00'::TIME,
  '17:00'::TIME,
  'Default schedule - please customize'::TEXT
FROM providers p
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS days(day_num) -- Monday through Friday
WHERE NOT EXISTS (
  SELECT 1 FROM provider_availability pa
  WHERE pa.provider_id = p.id
  AND pa.availability_type = 'recurring'
  AND pa.day_of_week = day_num
);

-- ============================================================================
-- 6. Add helpful comments
-- ============================================================================

COMMENT ON TABLE provider_availability IS 'Stores provider availability schedules including recurring weekly hours and one-time blocks';
COMMENT ON COLUMN provider_availability.availability_type IS 'Type of availability entry: recurring (weekly schedule), one_time_available (override), one_time_blocked (unavailable)';
COMMENT ON COLUMN provider_availability.day_of_week IS 'Day of week for recurring schedules: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN provider_availability.specific_date IS 'Specific date for one-time availability or blocks';
COMMENT ON COLUMN provider_availability.is_available IS 'Whether time is available (true) or blocked (false)';
COMMENT ON COLUMN bookings.duration_minutes IS 'Length of appointment in minutes (default 60)';
