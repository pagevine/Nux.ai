export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserData {
  oldContacts?: number;
  newContacts?: number;
  sources?: string[];
  automation?: boolean;
  hasAnalysis?: boolean;
  industry?: string;
  challenges?: string[];
}

export interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Supabase database types
export interface DatabaseSession {
  id: string;
  user_id?: string;
  started_at: string;
  last_active_at: string;
}

export interface DatabaseConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface DatabaseFeedback {
  id: string;
  session_id: string;
  message_id?: string;
  rating?: number;
  comment?: string;
  created_at: string;
}