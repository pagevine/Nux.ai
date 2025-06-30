/*
  # NUX Database Schema - Complete Setup

  1. New Tables
    - `users` - User management and authentication
    - `sessions` - Chat session tracking
    - `leads` - Lead information and status
    - `conversations` - Complete chat history
    - `feedback` - User feedback and ratings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access patterns

  3. Indexes
    - Performance optimization for queries
    - Foreign key relationships
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  name text,
  contact_info text,
  source text,
  status text DEFAULT 'neu',
  created_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  message_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users policies
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

-- Sessions policies
CREATE POLICY "Users can read own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Leads policies
CREATE POLICY "Users can read leads from own sessions"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create leads in own sessions"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads in own sessions"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

-- Conversations policies
CREATE POLICY "Users can read conversations from own sessions"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations in own sessions"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

-- Feedback policies
CREATE POLICY "Users can read feedback from own sessions"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create feedback in own sessions"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

-- Anonymous access for demo purposes (remove in production)
CREATE POLICY "Allow anonymous read conversations"
  ON conversations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert conversations"
  ON conversations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous read sessions"
  ON sessions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert sessions"
  ON sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update sessions"
  ON sessions
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert feedback"
  ON feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active_at);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);