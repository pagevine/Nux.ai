import React, { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ChatSuggestions } from './components/ChatSuggestions';
import { SessionSidebar } from './components/SessionSidebar';
import { TypingIndicator } from './components/TypingIndicator';
import { StreamingMessage } from './components/StreamingMessage';
import { FeedbackModal } from './components/FeedbackModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { ChatMessage as ChatMessageType } from './types/chat';
import { useSession } from './hooks/useSession';
import { useAuth } from './hooks/useAuth';
import { saveConversation, loadConversationHistory, isSupabaseConfigured } from './services/supabase';
import { generateAIResponse } from './services/openai';
import { MessageSquare, LogIn } from 'lucide-react';

function App() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { session, isLoading: sessionLoading, switchToSession, createNewSession } = useSession();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isStreaming]);

  // Load conversation history when session changes
  useEffect(() => {
    if (session && !isLoadingHistory) {
      loadHistory();
    }
  }, [session?.id]);

  const loadHistory = async () => {
    if (!session) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await loadConversationHistory(session.id);
      
      if (history.length > 0) {
        // Convert Supabase conversations to ChatMessage format
        const chatMessages: ChatMessageType[] = history.map(conv => ({
          id: conv.id,
          type: conv.role,
          content: conv.message,
          timestamp: new Date(conv.created_at)
        }));
        
        setMessages(chatMessages);
        setShowSuggestions(false);
      } else {
        // No history, reset to initial state
        setMessages([]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      // Reset to initial state on error
      setMessages([]);
      setShowSuggestions(true);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    await switchToSession(sessionId);
    setShowSidebar(false);
  };

  const handleNewSession = async () => {
    await createNewSession();
    setShowSidebar(false);
    // Reset for new session
    setMessages([]);
    setShowSuggestions(true);
    setIsStreaming(false);
    setStreamingContent('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!session) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Add user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    // Save user message to database
    if (isSupabaseConfigured) {
      try {
        await saveConversation(session.id, 'user', content);
      } catch (error) {
        console.warn('Could not save conversation to database:', error);
      }
    }

    try {
      // Build conversation context for AI
      const conversationHistory = updatedMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await generateAIResponse(conversationHistory);
      
      setIsTyping(false);
      
      // Start streaming the response
      setStreamingContent(aiResponse);
      setIsStreaming(true);

    } catch (error) {
      console.error('Error handling message:', error);
      
      // Fallback message
      setIsTyping(false);
      setStreamingContent("Sorry, da ist was schiefgelaufen. Kannst du das nochmal versuchen?");
      setIsStreaming(true);
    }
  };

  const handleStreamingComplete = async () => {
    // Add the completed message to chat history
    const assistantMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: streamingContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(false);
    setStreamingContent('');

    // Save assistant message to database
    if (session && isSupabaseConfigured) {
      try {
        await saveConversation(session.id, 'assistant', assistantMessage.content);
      } catch (error) {
        console.warn('Could not save assistant message to database:', error);
      }
    }

    // Show feedback modal after significant interaction
    if (messages.length > 6) {
      setTimeout(() => setShowFeedback(true), 3000);
    }
  };

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // Show loading state while auth and session are being initialized
  if (authLoading || sessionLoading || isLoadingHistory) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">NUX wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Session Sidebar */}
      <SessionSidebar
        currentSessionId={session?.id}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Auth */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Left: Menu Button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Chat History"
            >
              <MessageSquare size={20} className="text-gray-600" />
            </button>
            
            {/* Center: Title */}
            <h1 className="text-lg font-semibold text-gray-900">
              NUX
            </h1>
            
            {/* Right: Auth Section */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <UserMenu 
                  onProfileClick={() => setShowProfile(true)}
                  onSettingsClick={() => setShowSettings(true)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAuthClick('signin')}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Anmelden
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                  >
                    <LogIn size={16} />
                    Registrieren
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {showSuggestions ? (
            <ChatSuggestions 
              onSuggestionClick={handleSuggestionClick}
              disabled={isTyping || !session || isStreaming}
            />
          ) : (
            <div className="w-full">
              {/* Chat Messages */}
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              
              {isStreaming && (
                <StreamingMessage 
                  content={streamingContent}
                  onComplete={handleStreamingComplete}
                  speed={900}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isTyping || !session || isStreaming} 
        />
      </div>
      
      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
      
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)}
        sessionId={session?.id}
      />

      {/* Floating feedback button */}
      {messages.length > 4 && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed top-4 right-4 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 z-30"
          title="Feedback geben"
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  );
}

export default App;