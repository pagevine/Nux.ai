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

// Create Supabase client for auth
const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
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
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Mock auth for development when Supabase is not configured
const createMockAuth = () => {
  console.warn('🔧 Supabase Auth is not configured. Using mock authentication for development.');
  
  const mockUser: User = {
    id: 'mock-user-' + Date.now(),
    email: 'demo@nux.ai',
    name: 'Demo User',
    created_at: new Date().toISOString()
  };

  return {
    signUp: async (email: string, password: string, name?: string) => {
      const user = { ...mockUser, email, name };
      localStorage.setItem('nux_mock_user', JSON.stringify(user));
      return { user, error: null };
    },

    signIn: async (email: string, password: string) => {
      const user = { ...mockUser, email };
      localStorage.setItem('nux_mock_user', JSON.stringify(user));
      return { user, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('nux_mock_user');
      return { error: null };
    },

    forgotPassword: async (email: string) => {
      console.log('Mock: Password reset requested for', email);
      return { error: null };
    },

    getCurrentUser: async () => {
      const stored = localStorage.getItem('nux_mock_user');
      return stored ? JSON.parse(stored) : null;
    },

    updateProfile: async (updates: Partial<UserProfile>) => {
      console.log('Mock: Profile updated', updates);
      return { error: null };
    },

    updateSettings: async (updates: Partial<UserSettings>) => {
      console.log('Mock: Settings updated', updates);
      return { error: null };
    }
  };
};

// Real Supabase auth implementation
const createSupabaseAuth = () => {
  if (!supabase) throw new Error('Supabase not configured');

  return {
    signUp: async (email: string, password: string, name?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0]
            }
          }
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes('already registered')) {
            return { user: null, error: 'Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an oder verwende eine andere E-Mail.' };
          }
          return { user: null, error: error.message };
        }

        // Create user record in our users table
        if (data.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: name || email.split('@')[0],
              created_at: new Date().toISOString()
            });

          if (userError) {
            console.warn('Error creating user record:', userError);
            // Don't fail the signup if user record creation fails
          }
        }

        return { 
          user: data.user ? {
            id: data.user.id,
            email: data.user.email!,
            name: name || email.split('@')[0],
            created_at: data.user.created_at
          } : null, 
          error: null 
        };
      } catch (error) {
        return { user: null, error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Registrierung' };
      }
    },

    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes('Invalid login credentials')) {
            return { user: null, error: 'Ungültige Anmeldedaten. Bitte überprüfe deine E-Mail und dein Passwort.' };
          }
          return { user: null, error: error.message };
        }

        // Update last login if user exists
        if (data.user) {
          try {
            await supabase.rpc('update_user_last_login', { user_id: data.user.id });
          } catch (rpcError) {
            console.warn('Could not update last login:', rpcError);
            // Don't fail login if this fails
          }
        }

        return { 
          user: data.user ? {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || email.split('@')[0],
            created_at: data.user.created_at,
            last_login_at: new Date().toISOString()
          } : null, 
          error: null 
        };
      } catch (error) {
        return { user: null, error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Anmeldung' };
      }
    },

    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        return { error: error?.message || null };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Fehler beim Abmelden' };
      }
    },

    forgotPassword: async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        return { error: error?.message || null };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Fehler beim Zurücksetzen des Passworts' };
      }
    },

    getCurrentUser: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return null;

        // Get additional user data from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        return userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          created_at: userData.created_at,
          last_login_at: userData.last_login_at
        } : {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          created_at: user.created_at
        };
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    },

    updateProfile: async (updates: Partial<UserProfile>) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Nicht angemeldet' };

        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
          });

        return { error: error?.message || null };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Profils' };
      }
    },

    updateSettings: async (updates: Partial<UserSettings>) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Nicht angemeldet' };

        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
          });

        return { error: error?.message || null };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Einstellungen' };
      }
    },

    getUserProfile: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        return data;
      } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
      }
    },

    getUserSettings: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        return data;
      } catch (error) {
        console.error('Error getting user settings:', error);
        return null;
      }
    }
  };
};

// Export the appropriate auth implementation
export const auth = isSupabaseConfigured ? createSupabaseAuth() : createMockAuth();
export { isSupabaseConfigured as isAuthConfigured };

// Auth state management
export const getAuthState = async (): Promise<AuthState> => {
  try {
    const user = await auth.getCurrentUser();
    
    if (!user) {
      return {
        user: null,
        profile: null,
        settings: null,
        isLoading: false,
        isAuthenticated: false
      };
    }

    // Get profile and settings if using real Supabase
    let profile = null;
    let settings = null;

    if (isSupabaseConfigured && 'getUserProfile' in auth) {
      profile = await auth.getUserProfile();
      settings = await auth.getUserSettings();
    }

    return {
      user,
      profile,
      settings,
      isLoading: false,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Error getting auth state:', error);
    return {
      user: null,
      profile: null,
      settings: null,
      isLoading: false,
      isAuthenticated: false
    };
  }
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Passwort muss mindestens 8 Zeichen lang sein');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Passwort muss mindestens eine Zahl enthalten');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};