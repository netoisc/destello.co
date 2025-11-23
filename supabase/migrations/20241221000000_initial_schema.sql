-- Destello Initial Schema
-- Modelo simple según Product.md
-- Owner (SUN) -> Anfitriones (planetas) -> Invitados (estrellas)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id TEXT PRIMARY KEY, -- formato: sun-<unique-id>
  owner_nombre TEXT NOT NULL, -- Nombre del creador del evento
  nombre TEXT NOT NULL, -- Nombre del evento
  descripcion TEXT, -- Descripción opcional
  audio_url TEXT, -- URL del audio opcional
  limite_total INTEGER NOT NULL DEFAULT 20, -- Límite total de invitados
  anfitriones TEXT, -- Lista separada por comas de anfitriones
  fecha TIMESTAMPTZ NOT NULL, -- Fecha y hora del evento
  lugar TEXT NOT NULL, -- Lugar del evento
  opciones_traer TEXT[] DEFAULT '{}', -- Array de opciones para llevar
  owner_nip TEXT NOT NULL, -- NIP de 4 dígitos para modificar el evento
  expires_at TIMESTAMPTZ NOT NULL, -- Fecha de expiración (1 día después del evento)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_fecha CHECK (fecha > NOW() + INTERVAL '1 day' AND fecha <= NOW() + INTERVAL '6 months'),
  CONSTRAINT valid_limite_total CHECK (limite_total > 0)
);

-- Guests table (invitados)
-- Nota: No hay constraint UNIQUE porque múltiples invitados pueden tener el mismo nombre
-- La identificación única se maneja con cookies/sesiones en la aplicación
CREATE TABLE guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- Nombre del invitado
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')), -- Si aceptó o rechazó
  opciones_seleccionadas TEXT[] DEFAULT '{}', -- Opciones que eligió llevar
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_events_expires_at ON events(expires_at);
CREATE INDEX idx_events_fecha ON events(fecha);
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_response ON guests(response) WHERE response = 'yes';

-- Function to auto-delete expired events (run via cron or edge function)
CREATE OR REPLACE FUNCTION delete_expired_events()
RETURNS void AS $$
BEGIN
  DELETE FROM events
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

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

-- Row Level Security (RLS) - Allow public read/write for simplicity
-- You may want to restrict this in production
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

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

-- Policies for guests
CREATE POLICY "Allow public read access to guests"
  ON guests FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to guests"
  ON guests FOR INSERT
  WITH CHECK (true);

-- Function to get event with confirmed count
CREATE OR REPLACE FUNCTION get_event_with_count(p_event_id TEXT)
RETURNS TABLE (
  id TEXT,
  owner_nombre TEXT,
  nombre TEXT,
  descripcion TEXT,
  audio_url TEXT,
  limite_total INTEGER,
  anfitriones TEXT,
  fecha TIMESTAMPTZ,
  lugar TEXT,
  opciones_traer TEXT[],
  confirmados INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.owner_nombre,
    e.nombre,
    e.descripcion,
    e.audio_url,
    e.limite_total,
    e.anfitriones,
    e.fecha,
    e.lugar,
    e.opciones_traer,
    COUNT(g.id)::INTEGER as confirmados,
    e.expires_at,
    e.created_at
  FROM events e
  LEFT JOIN guests g ON g.event_id = e.id AND g.response = 'yes'
  WHERE e.id = p_event_id
  GROUP BY e.id, e.owner_nombre, e.nombre, e.descripcion, e.audio_url, 
           e.limite_total, e.anfitriones, e.fecha, e.lugar, e.opciones_traer,
           e.expires_at, e.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

