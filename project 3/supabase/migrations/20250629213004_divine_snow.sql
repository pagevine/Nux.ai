-- Add name column to sessions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'name'
  ) THEN
    ALTER TABLE sessions ADD COLUMN name text;
  END IF;
END $$;

-- Add index for session names for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);

-- Update any existing sessions without names to have a default name
-- Use a safer approach that doesn't rely on dynamic column detection
DO $$
BEGIN
  -- First, check if the sessions table exists and has any rows
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
    -- Try each possible timestamp column in order of preference
    BEGIN
      -- Try created_at first
      UPDATE sessions SET name = 'Chat vom ' || to_char(created_at, 'DD.MM.YYYY') WHERE name IS NULL;
    EXCEPTION WHEN undefined_column THEN
      BEGIN
        -- Try started_at if created_at doesn't exist
        UPDATE sessions SET name = 'Chat vom ' || to_char(started_at, 'DD.MM.YYYY') WHERE name IS NULL;
      EXCEPTION WHEN undefined_column THEN
        BEGIN
          -- Try last_active_at if started_at doesn't exist
          UPDATE sessions SET name = 'Chat vom ' || to_char(last_active_at, 'DD.MM.YYYY') WHERE name IS NULL;
        EXCEPTION WHEN undefined_column THEN
          -- Fallback: use current timestamp if no timestamp columns exist
          UPDATE sessions SET name = 'Chat vom ' || to_char(now(), 'DD.MM.YYYY') WHERE name IS NULL;
        END;
      END;
    END;
  END IF;
END $$;