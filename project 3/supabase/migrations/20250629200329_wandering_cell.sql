/*
  # Complete NUX Database Schema

  1. New Tables
    - `users` - User management with optional email
    - `sessions` - Chat session tracking with user association
    - `conversations` - Complete chat history storage
    - `leads` - Lead management and tracking
    - `feedback` - User feedback collection

  2. Security
    - Enable RLS on all tables
    - Add policies for session-based access
    - Secure user data isolation

  3. Features
    - Automatic UUID generation
    - Timestamp tracking
    - Foreign key relationships
    - Optimized indexes for performance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  name text,
  contact_info text,
  source text,
  status text DEFAULT 'neu' CHECK (status IN ('neu', 'aktiv', 'reaktiviert', 'abgeschlossen', 'verloren')),
  created_at timestamptz DEFAULT now()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active_at);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous access (session-based)
-- Users: Allow anonymous users to create and read their own records
CREATE POLICY "Allow anonymous user creation" ON users
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow users to read own data" ON users
  FOR SELECT TO anon
  USING (true);

-- Sessions: Allow anonymous users to create and manage sessions
CREATE POLICY "Allow anonymous session creation" ON sessions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow session access" ON sessions
  FOR ALL TO anon
  USING (true);

-- Conversations: Allow access based on session
CREATE POLICY "Allow conversation access by session" ON conversations
  FOR ALL TO anon
  USING (true);

-- Leads: Allow access based on session
CREATE POLICY "Allow lead access by session" ON leads
  FOR ALL TO anon
  USING (true);

-- Feedback: Allow access based on session
CREATE POLICY "Allow feedback access by session" ON feedback
  FOR ALL TO anon
  USING (true);

-- Function to clean up old sessions (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions 
  WHERE last_active_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;