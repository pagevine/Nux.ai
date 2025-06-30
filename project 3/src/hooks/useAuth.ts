import { useState, useEffect, useCallback } from 'react';
import { auth, getAuthState, AuthState, User, UserProfile, UserSettings } from '../services/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    settings: null,
    isLoading: true,
    isAuthenticated: false
  });

  const [error, setError] = useState<string | null>(null);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      setError(null);
      const state = await getAuthState();
      setAuthState(state);
    } catch (error) {
      console.error('Error loading auth state:', error);
      setError('Fehler beim Laden der Authentifizierung');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { user, error: authError } = await auth.signUp(email, password, name);
      
      if (authError) {
        setError(authError);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: authError };
      }

      if (user) {
        await loadAuthState(); // Reload to get complete state
        return { success: true, user };
      }

      return { success: false, error: 'Unbekannter Fehler' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { user, error: authError } = await auth.signIn(email, password);
      
      if (authError) {
        setError(authError);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: authError };
      }

      if (user) {
        await loadAuthState(); // Reload to get complete state
        return { success: true, user };
      }

      return { success: false, error: 'Unbekannter Fehler' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await auth.signOut();
      
      setAuthState({
        user: null,
        profile: null,
        settings: null,
        isLoading: false,
        isAuthenticated: false
      });

      // Clear any stored session data
      localStorage.removeItem('nux_session_id');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Abmelden';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      
      const { error: resetError } = await auth.forgotPassword(email);
      
      if (resetError) {
        setError(resetError);
        return { success: false, error: resetError };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Zurücksetzen des Passworts';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      
      const { error: updateError } = await auth.updateProfile(updates);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      // Reload auth state to get updated profile
      await loadAuthState();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Profils';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      setError(null);
      
      const { error: updateError } = await auth.updateSettings(updates);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      // Reload auth state to get updated settings
      await loadAuthState();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Einstellungen';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Auth state
    user: authState.user,
    profile: authState.profile,
    settings: authState.settings,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    error,

    // Auth actions
    signUp,
    signIn,
    signOut,
    forgotPassword,
    updateProfile,
    updateSettings,
    clearError,
    
    // Utility
    reload: loadAuthState
  };
};