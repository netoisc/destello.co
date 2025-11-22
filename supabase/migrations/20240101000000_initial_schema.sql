-- Destello Initial Schema
-- This migration creates all the base tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  audio_url TEXT,
  limite_total INTEGER NOT NULL,
  cantidad_mercurio INTEGER DEFAULT 0,
  fecha TIMESTAMPTZ NOT NULL,
  lugar TEXT NOT NULL,
  que_traer TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations table (Mercurio and Venus)
CREATE TABLE invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mercurio', 'venus')),
  code TEXT, -- 6-character code for Mercurio, NULL for Venus
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses table
CREATE TABLE responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mercurio', 'venus')),
  code TEXT, -- For Venus with code
  name TEXT,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  roulette_result TEXT, -- Result from roulette wheel
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_events_expires_at ON events(expires_at);
CREATE INDEX idx_invitations_event_id ON invitations(event_id);
CREATE INDEX idx_invitations_code ON invitations(code) WHERE code IS NOT NULL;
CREATE INDEX idx_responses_event_id ON responses(event_id);
CREATE INDEX idx_responses_type ON responses(type);

-- Function to auto-delete expired events (run via cron or edge function)
CREATE OR REPLACE FUNCTION delete_expired_events()
RETURNS void AS $$
BEGIN
  DELETE FROM events
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) - Allow public read/write for simplicity
-- You may want to restrict this in production
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Allow public read access to events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to events"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to events"
  ON events FOR UPDATE
  USING (true);

-- Policies for invitations
CREATE POLICY "Allow public read access to invitations"
  ON invitations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to invitations"
  ON invitations FOR INSERT
  WITH CHECK (true);

-- Policies for responses
CREATE POLICY "Allow public read access to responses"
  ON responses FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to responses"
  ON responses FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

