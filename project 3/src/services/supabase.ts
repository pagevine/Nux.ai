import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20;

// Create either real or mock client
const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

function createMockSupabaseClient() {
  console.warn('🔧 Supabase is not configured. Using local mock data for development.');
  console.warn('📝 To enable full functionality, click "Connect to Supabase" or configure your .env file.');
  
  // Simple in-memory storage for development
  const mockStorage = {
    sessions: new Map(),
    conversations: new Map(),
    feedback: new Map(),
    leads: new Map(),
    users: new Map(),
    user_profiles: new Map(),
    user_settings: new Map()
  };

  return {
    from: (table: string) => {
      // Create a chainable query builder
      const queryBuilder = {
        _filters: [] as Array<{ column: string; value: any }>,
        _orderBy: null as { column: string; ascending: boolean } | null,
        _limit: null as number | null,

        select: function(columns?: string) {
          // Return this to allow chaining
          return this;
        },

        insert: (data: any) => ({
          select: () => ({
            single: () => {
              // Generate proper UUID for mock data when Supabase is not configured
              const id = `${crypto.randomUUID()}`;
              const record = { 
                id, 
                ...data, 
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_active_at: new Date().toISOString()
              };
              mockStorage[table as keyof typeof mockStorage]?.set(id, record);
              return Promise.resolve({ data: record, error: null });
            }
          })
        }),

        upsert: (data: any) => ({
          select: () => ({
            single: () => {
              // For upsert, try to find existing record first
              const storage = mockStorage[table as keyof typeof mockStorage];
              if (storage && data.user_id) {
                // Find existing record by user_id
                for (const [key, record] of storage.entries()) {
                  if ((record as any).user_id === data.user_id) {
                    const updatedRecord = { ...record, ...data, updated_at: new Date().toISOString() };
                    storage.set(key, updatedRecord);
                    return Promise.resolve({ data: updatedRecord, error: null });
                  }
                }
              }
              
              // If not found, create new with proper UUID
              const id = data.id || crypto.randomUUID();
              const record = { 
                id, 
                ...data, 
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              storage?.set(id, record);
              return Promise.resolve({ data: record, error: null });
            }
          })
        }),

        update: function(data: any) {
          return {
            eq: (column: string, value: any) => {
              const storage = mockStorage[table as keyof typeof mockStorage];
              if (storage) {
                for (const [key, record] of storage.entries()) {
                  if ((record as any)[column] === value) {
                    const updatedRecord = { ...record, ...data, updated_at: new Date().toISOString() };
                    storage.set(key, updatedRecord);
                    break;
                  }
                }
              }
              return Promise.resolve({ data: null, error: null });
            }
          };
        },

        delete: function() {
          return {
            eq: (column: string, value: any) => {
              const storage = mockStorage[table as keyof typeof mockStorage];
              if (storage) {
                for (const [key, record] of storage.entries()) {
                  if ((record as any)[column] === value) {
                    storage.delete(key);
                    break;
                  }
                }
              }
              return Promise.resolve({ data: null, error: null });
            }
          };
        },

        eq: function(column: string, value: any) {
          this._filters.push({ column, value });
          return this;
        },

        order: function(orderColumn: string, options?: { ascending?: boolean }) {
          this._orderBy = { 
            column: orderColumn, 
            ascending: options?.ascending !== false 
          };
          return this;
        },

        limit: function(count: number) {
          this._limit = count;
          return this;
        },

        single: function() {
          return this._executeQuery().then(result => ({
            ...result,
            data: result.data?.[0] || null
          }));
        },

        _executeQuery: function() {
          let records = Array.from(mockStorage[table as keyof typeof mockStorage]?.values() || []);
          
          // Apply filters
          for (const filter of this._filters) {
            records = records.filter((record: any) => record[filter.column] === filter.value);
          }
          
          // Apply ordering
          if (this._orderBy) {
            const { column, ascending } = this._orderBy;
            records.sort((a: any, b: any) => {
              const aVal = new Date(a[column]).getTime();
              const bVal = new Date(b[column]).getTime();
              return ascending ? aVal - bVal : bVal - aVal;
            });
          }
          
          // Apply limit
          if (this._limit !== null) {
            records = records.slice(0, this._limit);
          }
          
          return Promise.resolve({ data: records, error: null });
        },

        then: function(resolve: any, reject?: any) {
          return this._executeQuery().then(resolve, reject);
        }
      };

      return queryBuilder;
    },

    rpc: (functionName: string, params?: any) => {
      console.log(`Mock RPC call: ${functionName}`, params);
      
      if (functionName === 'update_user_last_login') {
        const storage = mockStorage.users;
        if (storage && params?.user_id) {
          for (const [key, record] of storage.entries()) {
            if ((record as any).id === params.user_id) {
              const updatedRecord = { 
                ...record, 
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              storage.set(key, updatedRecord);
              break;
            }
          }
        }
        return Promise.resolve({ data: null, error: null });
      }
      
      if (functionName === 'get_user_stats') {
        return Promise.resolve({ 
          data: {
            total_sessions: 5,
            total_conversations: 25,
            total_leads: 10,
            total_feedback: 3,
            last_active: new Date().toISOString()
          }, 
          error: null 
        });
      }
      
      return Promise.resolve({ data: null, error: null });
    },

    auth: {
      getUser: () => Promise.resolve({ 
        data: { user: null }, 
        error: null 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ 
        data: { subscription: { unsubscribe: () => {} } } 
      })
    }
  };
}

// Export configuration status and client
export { supabase, isSupabaseConfigured };

// Database types (updated with user relations)
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  is_active?: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  industry?: string;
  company_name?: string;
  role?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  name?: string;
  user_id?: string;
  created_at: string;
  last_active_at: string;
}

export interface Lead {
  id: string;
  session_id: string;
  user_id?: string;
  name?: string;
  contact_info?: string;
  source?: string;
  status: 'neu' | 'aktiv' | 'reaktiviert' | 'abgeschlossen' | 'verloren';
  created_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  session_id: string;
  user_id?: string;
  message_id?: string;
  rating?: number;
  comment?: string;
  created_at: string;
}

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) {
    // For mock mode, return a consistent mock user ID
    const mockUser = localStorage.getItem('nux_mock_user');
    return mockUser ? JSON.parse(mockUser).id : 'mock-user-default';
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Session management (updated with user context)
export const createSession = async (name?: string): Promise<Session | null> => {
  try {
    const userId = await getCurrentUserId();
    
    const sessionData: any = {};
    
    // Only add name if provided
    if (name) {
      sessionData.name = name;
    }
    
    // Only add user_id if we have one
    if (userId) {
      sessionData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    return; // Skip for mock client
  }

  try {
    await supabase
      .from('sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
};

export const loadUserSessions = async (limit: number = 20): Promise<Session[]> => {
  try {
    const userId = await getCurrentUserId();
    
    let query = supabase
      .from('sessions')
      .select('*')
      .order('last_active_at', { ascending: false })
      .limit(limit);

    // Filter by user if authenticated
    if (userId && isSupabaseConfigured) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

export const updateSessionName = async (sessionId: string, name: string): Promise<void> => {
  try {
    await supabase
      .from('sessions')
      .update({ name })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error updating session name:', error);
  }
};

// Conversation management (unchanged, already linked via sessions)
export const saveConversation = async (
  sessionId: string,
  role: 'user' | 'assistant',
  message: string
): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        role,
        message
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conversation:', error);
      return null;
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    return data;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return null;
  }
};

export const loadConversationHistory = async (sessionId: string, limit: number = 50): Promise<Conversation[]> => {
  try {
    // Validate session ID format if Supabase is configured
    if (isSupabaseConfigured && sessionId.startsWith('mock-')) {
      console.warn('Cannot load conversation history for mock session with real Supabase');
      return [];
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
};

export const getConversationContext = async (sessionId: string): Promise<Conversation[]> => {
  try {
    // Validate session ID format if Supabase is configured
    if (isSupabaseConfigured && sessionId.startsWith('mock-')) {
      console.warn('Cannot get conversation context for mock session with real Supabase');
      return [];
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error loading conversation context:', error);
      return [];
    }

    return (data || []).reverse();
  } catch (error) {
    console.error('Error loading conversation context:', error);
    return [];
  }
};

// Feedback management (updated with user context)
export const saveFeedback = async (
  sessionId: string,
  messageId?: string,
  rating?: number,
  comment?: string
): Promise<Feedback | null> => {
  try {
    const userId = await getCurrentUserId();
    
    const feedbackData: any = {
      session_id: sessionId,
      message_id: messageId,
      rating,
      comment
    };
    
    if (userId) {
      feedbackData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      console.error('Error saving feedback:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving feedback:', error);
    return null;
  }
};

// Lead management (updated with user context)
export const saveLead = async (
  sessionId: string,
  name?: string,
  contactInfo?: string,
  source?: string,
  status: 'neu' | 'aktiv' | 'reaktiviert' | 'abgeschlossen' | 'verloren' = 'neu'
): Promise<Lead | null> => {
  try {
    const userId = await getCurrentUserId();
    
    const leadData: any = {
      session_id: sessionId,
      name,
      contact_info: contactInfo,
      source,
      status
    };
    
    if (userId) {
      leadData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error saving lead:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving lead:', error);
    return null;
  }
};

export const updateLeadStatus = async (
  leadId: string, 
  status: 'neu' | 'aktiv' | 'reaktiviert' | 'abgeschlossen' | 'verloren'
): Promise<void> => {
  try {
    await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId);
  } catch (error) {
    console.error('Error updating lead status:', error);
  }
};

export const getLeadsByUser = async (): Promise<Lead[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading user leads:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading user leads:', error);
    return [];
  }
};

export const getLeadsBySession = async (sessionId: string): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading leads:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading leads:', error);
    return [];
  }
};

// User management functions
export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
};

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return null;
  }
};

// Analytics and insights (updated with user context)
export const getUserStats = async (): Promise<any> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_user_stats', { user_id: userId });
      
      if (error) {
        console.error('Error getting user stats:', error);
        return null;
      }
      
      return data;
    } else {
      // Mock stats for development
      return {
        total_sessions: 5,
        total_conversations: 25,
        total_leads: 10,
        total_feedback: 3,
        last_active: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

export const getSessionStats = async (sessionId: string) => {
  try {
    const [conversationsResult, feedbackResult, leadsResult] = await Promise.all([
      supabase
        .from('conversations')
        .select('id, role')
        .eq('session_id', sessionId),
      supabase
        .from('feedback')
        .select('rating')
        .eq('session_id', sessionId),
      supabase
        .from('leads')
        .select('status')
        .eq('session_id', sessionId)
    ]);

    const conversations = conversationsResult.data || [];
    const feedback = feedbackResult.data || [];
    const leads = leadsResult.data || [];

    return {
      totalMessages: conversations.length,
      userMessages: conversations.filter(c => c.role === 'user').length,
      assistantMessages: conversations.filter(c => c.role === 'assistant').length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length 
        : null,
      totalLeads: leads.length,
      leadsByStatus: leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      averageRating: null,
      totalLeads: 0,
      leadsByStatus: {}
    };
  }
};

// Cleanup functions (updated with user context)
export const cleanupOldSessions = async (daysOld: number = 30): Promise<void> => {
  if (!isSupabaseConfigured) return;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)
      .lt('last_active_at', cutoffDate.toISOString());
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
  }
};