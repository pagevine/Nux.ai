import { useState, useEffect } from 'react';
import { createSession, updateSessionActivity, Session, loadConversationHistory, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from './useAuth';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    initializeSession();
  }, [user, isAuthenticated]);

  const initializeSession = async () => {
    try {
      // Check if we have a session ID in localStorage
      const storedSessionId = localStorage.getItem('nux_session_id');
      
      if (storedSessionId) {
        // If Supabase is configured and we have a mock session ID, clear it and create new
        if (isSupabaseConfigured && storedSessionId.startsWith('mock-sessions-')) {
          console.log('Clearing incompatible mock session ID for real Supabase');
          localStorage.removeItem('nux_session_id');
          await createNewSession();
          return;
        }
        
        // Try to use existing session and check if it has conversations
        try {
          const conversations = await loadConversationHistory(storedSessionId, 1);
          
          if (conversations.length > 0) {
            // Session exists and has data, use it
            await updateSessionActivity(storedSessionId);
            setSession({
              id: storedSessionId,
              created_at: new Date().toISOString(),
              last_active_at: new Date().toISOString()
            });
          } else {
            // Session exists but no conversations, create new one
            await createNewSession();
          }
        } catch (error) {
          console.warn('Error loading session, creating new one:', error);
          // If there's an error loading the session (e.g., invalid UUID), create new
          localStorage.removeItem('nux_session_id');
          await createNewSession();
        }
      } else {
        // No stored session, create new one
        await createNewSession();
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      // Fallback: create new session
      await createNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      // Generate session name based on current date and user
      const now = new Date();
      const sessionName = isAuthenticated && user?.name 
        ? `${user.name} - ${now.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}`
        : `Chat vom ${now.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}`;
      
      const newSession = await createSession(sessionName);
      if (newSession) {
        localStorage.setItem('nux_session_id', newSession.id);
        setSession(newSession);
        return newSession;
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const switchToSession = async (sessionId: string) => {
    try {
      // Validate session ID format if Supabase is configured
      if (isSupabaseConfigured && sessionId.startsWith('mock-')) {
        console.warn('Cannot switch to mock session with real Supabase');
        await createNewSession();
        return;
      }
      
      localStorage.setItem('nux_session_id', sessionId);
      await updateSessionActivity(sessionId);
      
      // Load session details if needed
      setSession({
        id: sessionId,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error switching session:', error);
      // Fallback to creating new session
      await createNewSession();
    }
  };

  const refreshSession = async () => {
    if (session) {
      await updateSessionActivity(session.id);
    }
  };

  const clearCurrentSession = () => {
    // Clear current session from state but keep in localStorage for history
    setSession(null);
  };

  return {
    session,
    isLoading,
    refreshSession,
    switchToSession,
    createNewSession,
    clearCurrentSession
  };
};