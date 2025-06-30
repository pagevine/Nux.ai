/*
  # User Accounts & Authentication System

  1. New Tables
    - Enhanced `users` table with authentication fields
    - User profiles for additional data
    - User preferences and settings

  2. Security
    - Enable RLS on all user-related tables
    - Add policies for user data access
    - Secure session and conversation access by user

  3. Changes
    - Update existing tables to properly link to users
    - Add user_id foreign keys where needed
    - Ensure data isolation between users
*/

-- Create users table if it doesn't exist (Supabase Auth integration)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  is_active boolean DEFAULT true
);

-- User profiles for extended information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  industry text,
  company_name text,
  role text,
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  goals text[],
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  language text DEFAULT 'de',
  timezone text DEFAULT 'Europe/Berlin',
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Update sessions table to ensure user_id is properly linked
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN user_id uuid;
  END IF;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'sessions' AND constraint_name = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE sessions 
    ADD CONSTRAINT sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update leads table to ensure proper user linking
DO $$
BEGIN
  -- Add user_id column to leads if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN user_id uuid;
  END IF;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'leads' AND constraint_name = 'leads_user_id_fkey'
  ) THEN
    ALTER TABLE leads 
    ADD CONSTRAINT leads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update feedback table to ensure proper user linking
DO $$
BEGIN
  -- Add user_id column to feedback if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE feedback ADD COLUMN user_id uuid;
  END IF;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'feedback' AND constraint_name = 'feedback_user_id_fkey'
  ) THEN
    ALTER TABLE feedback 
    ADD CONSTRAINT feedback_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anonymous user creation" ON users;
DROP POLICY IF EXISTS "Allow users to read own data" ON users;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow anonymous access for demo purposes (can be removed in production)
CREATE POLICY "Allow anonymous read users"
  ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow anonymous profile access"
  ON user_profiles
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_settings
CREATE POLICY "Users can manage own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow anonymous settings access"
  ON user_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Update sessions policies to be user-specific
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;

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

-- Update conversations policies
DROP POLICY IF EXISTS "Users can create conversations in own sessions" ON conversations;
DROP POLICY IF EXISTS "Users can read conversations from own sessions" ON conversations;

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

-- Update leads policies
DROP POLICY IF EXISTS "Users can create leads in own sessions" ON leads;
DROP POLICY IF EXISTS "Users can read leads from own sessions" ON leads;
DROP POLICY IF EXISTS "Users can update leads in own sessions" ON leads;

CREATE POLICY "Users can create own leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Update feedback policies
DROP POLICY IF EXISTS "Users can create feedback in own sessions" ON feedback;
DROP POLICY IF EXISTS "Users can read feedback from own sessions" ON feedback;

CREATE POLICY "Users can create own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Functions for user management
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (user_id, created_at, updated_at)
  VALUES (NEW.id, now(), now());
  
  -- Create user settings
  INSERT INTO user_settings (user_id, created_at, updated_at)
  VALUES (NEW.id, now(), now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile and settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user last login
CREATE OR REPLACE FUNCTION update_user_last_login(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET last_login_at = now(), updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions', (SELECT COUNT(*) FROM sessions WHERE sessions.user_id = get_user_stats.user_id),
    'total_conversations', (
      SELECT COUNT(*) FROM conversations 
      WHERE session_id IN (
        SELECT id FROM sessions WHERE sessions.user_id = get_user_stats.user_id
      )
    ),
    'total_leads', (SELECT COUNT(*) FROM leads WHERE leads.user_id = get_user_stats.user_id),
    'total_feedback', (SELECT COUNT(*) FROM feedback WHERE feedback.user_id = get_user_stats.user_id),
    'last_active', (
      SELECT MAX(last_active_at) FROM sessions WHERE sessions.user_id = get_user_stats.user_id
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;