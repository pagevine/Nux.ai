/*
  # Sessions and Conversation Management

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `name` (text, optional session name)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `last_active_at` (timestamp)

  2. Table Updates
    - Add `session_id` column to existing `conversations` table
    - Add foreign key constraint linking conversations to sessions

  3. Security
    - Enable RLS on sessions table
    - Add policies for anonymous and authenticated access
    - Update conversation policies to work with sessions

  4. Performance
    - Add indexes for efficient querying
*/

-- Sessions table for chat session management
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to users table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'sessions' AND constraint_name = 'sessions_user_id_fkey'
    ) THEN
      ALTER TABLE sessions 
      ADD CONSTRAINT sessions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update conversations table structure if needed
DO $$
BEGIN
  -- Add session_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN session_id uuid;
  END IF;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'conversations' AND constraint_name = 'conversations_session_id_fkey'
  ) THEN
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active_at);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anonymous read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anonymous update sessions" ON sessions;
DROP POLICY IF EXISTS "Allow session access" ON sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create conversations in own sessions" ON conversations;
DROP POLICY IF EXISTS "Users can read conversations from own sessions" ON conversations;

-- RLS Policies for sessions - Allow anonymous access for demo
CREATE POLICY "Allow anonymous insert sessions"
  ON sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous read sessions"
  ON sessions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update sessions"
  ON sessions
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow session access"
  ON sessions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for authenticated users
CREATE POLICY "Users can create own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Update conversations policies to work with sessions
CREATE POLICY "Users can create conversations in own sessions"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read conversations from own sessions"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions 
      WHERE user_id = auth.uid()
    )
  );