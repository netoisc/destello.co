-- Fix: Add missing columns to events table
-- This migration adds columns that might be missing if the table was created manually

-- Add cantidad_mercurio if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'cantidad_mercurio'
  ) THEN
    ALTER TABLE events ADD COLUMN cantidad_mercurio INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add limite_total if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'limite_total'
  ) THEN
    ALTER TABLE events ADD COLUMN limite_total INTEGER NOT NULL DEFAULT 20;
  END IF;
END $$;

