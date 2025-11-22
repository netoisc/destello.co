-- New Access Levels System (L0, L1, L2)
-- L0: Owner (6-digit code + unique hash link)
-- L1: Hosts/Anfitriones (events/id/mercury, requires NIP-L1 4-digit code)
-- L2: Invitados (events/id/venus, requires NIP-L2 4-digit code)

-- Add owner_code to events table (6-digit code for owner access)
ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_code TEXT UNIQUE;

-- Add owner_link to events table (unique hash link for owner)
ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_link TEXT UNIQUE;

-- Update invitations table to support NIP codes and usage tracking
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS nip_code TEXT; -- 4-digit NIP code (L1 or L2)
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL; -- NULL = unlimited, number = max uses
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0; -- Current usage count
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('l0', 'l1', 'l2')) DEFAULT 'l1'; -- Access level
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS created_by_invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL; -- For L2 created by L1

-- Update type constraint to include 'l0'
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_type_check;
ALTER TABLE invitations ADD CONSTRAINT invitations_type_check CHECK (type IN ('mercurio', 'venus', 'l0', 'l1', 'l2'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_nip_code ON invitations(nip_code) WHERE nip_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_level ON invitations(level) WHERE level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_owner_code ON invitations(event_id, type) WHERE type = 'l0';
CREATE INDEX IF NOT EXISTS idx_events_owner_code ON events(owner_code) WHERE owner_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_owner_link ON events(owner_link) WHERE owner_link IS NOT NULL;

-- Update responses table to track level
ALTER TABLE responses ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('l0', 'l1', 'l2')) DEFAULT 'l2';
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_type_check;
ALTER TABLE responses ADD CONSTRAINT responses_type_check CHECK (type IN ('mercurio', 'venus', 'l0', 'l1', 'l2'));

-- Create function to validate and increment NIP usage
CREATE OR REPLACE FUNCTION use_nip_code(
  p_event_id TEXT,
  p_nip_code TEXT,
  p_level TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Find the invitation with matching event_id, nip_code, and level
  SELECT * INTO v_invitation
  FROM invitations
  WHERE event_id = p_event_id
    AND nip_code = p_nip_code
    AND level = p_level
    AND (usage_limit IS NULL OR usage_count < usage_limit);
  
  -- If invitation found and usage limit not exceeded
  IF v_invitation.id IS NOT NULL THEN
    -- Increment usage count
    UPDATE invitations
    SET usage_count = usage_count + 1
    WHERE id = v_invitation.id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate owner code
CREATE OR REPLACE FUNCTION validate_owner_code(
  p_event_id TEXT,
  p_owner_code TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM events 
    WHERE id = p_event_id 
      AND owner_code = p_owner_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure policies allow checking NIP codes and owner codes
-- Policies already exist for public access, but ensure they work for new columns
