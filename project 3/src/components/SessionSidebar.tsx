import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Calendar, Trash2, X } from 'lucide-react';
import { Session, loadUserSessions, createSession, deleteSession } from '../services/supabase';

interface SessionSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  isOpen,
  onClose
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const userSessions = await loadUserSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await createSession();
      if (newSession) {
        await loadSessions(); // Refresh list
        onSessionSelect(newSession.id);
        onClose();
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Dieses Gespräch wirklich löschen?')) {
      try {
        await deleteSession(sessionId);
        await loadSessions(); // Refresh list
        
        // If deleted session was current, create new one
        if (sessionId === currentSessionId) {
          onNewSession();
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const generateSessionName = (session: Session, index: number) => {
    if (session.name) return session.name;
    
    const date = new Date(session.created_at);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Chat ${sessions.length - index}`;
    } else {
      return `Chat vom ${date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit' 
      })}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Heute';
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return `Vor ${diffDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Now works on all screen sizes */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-label="Sidebar schließen"
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-gray-900 text-white z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat-Verlauf</h2>
            {/* Close button - Now visible on all screen sizes */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Sidebar schließen"
              title="Schließen (Esc)"
            >
              <X size={20} />
            </button>
          </div>
          
          <button
            onClick={handleNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <Plus size={16} />
            Neuer Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin mx-auto mb-2"></div>
              Lade Gespräche...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">Noch keine Gespräche</p>
              <p className="text-sm text-gray-500">Starte dein erstes Gespräch mit NUX!</p>
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSessionSelect(session.id);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                    session.id === currentSessionId
                      ? 'bg-gray-700 border border-gray-600'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-white truncate">
                        {generateSessionName(session, index)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all rounded"
                    title="Gespräch löschen"
                    aria-label="Gespräch löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <img 
                src="/F4627AE6-273E-4464-B6CC-E1249420F51E-removebg-preview Kopie 2.png" 
                alt="NUX Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-medium">NUX - Der Leadflüsterer</span>
          </div>
          <p>💡 Deine Gespräche werden automatisch gespeichert</p>
          <p className="mt-1 text-gray-500">Drücke Esc zum Schließen</p>
        </div>
      </div>
    </>
  );
};