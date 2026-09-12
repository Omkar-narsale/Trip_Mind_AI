-- ================================================================
-- TripMind AI - Phase 7 Supabase PostgreSQL Schema
-- ================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PLANNING SESSIONS
CREATE TABLE IF NOT EXISTS planning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'analyzing', 'planning', 'completed', 'partial_success', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session status and date queries
CREATE INDEX IF NOT EXISTS idx_planning_sessions_created_at ON planning_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planning_sessions_status ON planning_sessions(status);

-- 2. TRIP REQUESTS
CREATE TABLE IF NOT EXISTS trip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    travelers INTEGER NOT NULL CHECK (travelers > 0),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
    additional_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_requests_session_id ON trip_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_destination ON trip_requests(destination);

-- 3. TRIP PROFILES (Enhanced profile from Phase 3)
CREATE TABLE IF NOT EXISTS trip_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_profiles_session_id ON trip_profiles(session_id);

-- 4. WEATHER RESULTS (Live weather from Phase 5)
CREATE TABLE IF NOT EXISTS weather_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    weather_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_results_session_id ON weather_results(session_id);

-- 5. PLACES RESULTS (OpenStreetMap / Overpass attractions from Phase 6)
CREATE TABLE IF NOT EXISTS places_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    places_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_places_results_session_id ON places_results(session_id);

-- 6. HOTEL RESULTS (Accommodation Intelligence from Phase 7)
CREATE TABLE IF NOT EXISTS hotel_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    hotel_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_results_session_id ON hotel_results(session_id);

-- 7. Transportation & Route Optimization Results (Phase 8)
CREATE TABLE IF NOT EXISTS transportation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    transportation_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transportation_results_session_id ON transportation_results(session_id);

-- 8. Food Intelligence Results
CREATE TABLE IF NOT EXISTS food_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    food_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_results_session_id ON food_results(session_id);

-- 9. Day-Wise Itinerary Results (Phase 9)
CREATE TABLE IF NOT EXISTS itinerary_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    itinerary_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_results_session_id ON itinerary_results(session_id);


-- Trigger for auto-updating updated_at timestamp on planning_sessions
CREATE OR REPLACE FUNCTION update_planning_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_planning_sessions_updated_at ON planning_sessions;
CREATE TRIGGER trg_update_planning_sessions_updated_at
    BEFORE UPDATE ON planning_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_planning_session_timestamp();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & SCHEMA GRANTS
-- ================================================================

-- Explicit table permissions for PostgREST roles (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 1. planning_sessions
ALTER TABLE planning_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on planning_sessions" ON planning_sessions;
CREATE POLICY "Allow all on planning_sessions" ON planning_sessions FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 2. trip_requests
ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on trip_requests" ON trip_requests;
CREATE POLICY "Allow all on trip_requests" ON trip_requests FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 3. trip_profiles
ALTER TABLE trip_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on trip_profiles" ON trip_profiles;
CREATE POLICY "Allow all on trip_profiles" ON trip_profiles FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 4. weather_results
ALTER TABLE weather_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on weather_results" ON weather_results;
CREATE POLICY "Allow all on weather_results" ON weather_results FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 5. places_results
ALTER TABLE places_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on places_results" ON places_results;
CREATE POLICY "Allow all on places_results" ON places_results FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 6. hotel_results
ALTER TABLE hotel_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on hotel_results" ON hotel_results;
CREATE POLICY "Allow all on hotel_results" ON hotel_results FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 7. transportation_results
ALTER TABLE transportation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on transportation_results" ON transportation_results;
CREATE POLICY "Allow all on transportation_results" ON transportation_results FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 8. food_results
ALTER TABLE food_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on food_results" ON food_results;
CREATE POLICY "Allow all on food_results" ON food_results FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 9. itinerary_results
ALTER TABLE itinerary_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on itinerary_results" ON itinerary_results;
CREATE POLICY "Allow all on itinerary_results" ON itinerary_results FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);


