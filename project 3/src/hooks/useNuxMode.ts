import { useState, useCallback } from 'react';
import { UserProfile, NuxMode, ConversationContext } from '../types/nux';
import { detectNuxMode, extractUserProfile, buildConversationContext } from '../utils/nuxModeDetection';
import { generateNuxResponse } from '../utils/nuxResponseGenerator';

export const useNuxMode = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [currentMode, setCurrentMode] = useState<NuxMode>({
    type: 'auto',
    confidence: 0.5,
    triggers: []
  });
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  const processUserMessage = useCallback((userMessage: string) => {
    // Update conversation history
    const updatedHistory = [...conversationHistory, userMessage];
    setConversationHistory(updatedHistory);

    // Extract user profile information
    const updatedProfile = extractUserProfile(userMessage, updatedHistory, userProfile);
    setUserProfile(updatedProfile);

    // Detect appropriate mode
    const detectedMode = detectNuxMode(userMessage, updatedHistory, updatedProfile);
    
    // Update mode if confidence is high enough or if it's the first detection
    if (detectedMode.confidence > currentMode.confidence || currentMode.type === 'auto') {
      setCurrentMode(detectedMode);
    }

    // Build conversation context
    const context: ConversationContext = buildConversationContext(
      updatedHistory,
      updatedProfile,
      detectedMode
    );

    // Generate appropriate response
    const nuxResponse = generateNuxResponse(userMessage, context);

    return {
      response: nuxResponse,
      context,
      profile: updatedProfile,
      mode: detectedMode
    };
  }, [conversationHistory, userProfile, currentMode]);

  const resetConversation = useCallback(() => {
    setUserProfile({});
    setCurrentMode({
      type: 'auto',
      confidence: 0.5,
      triggers: []
    });
    setConversationHistory([]);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const forceMode = useCallback((mode: NuxMode) => {
    setCurrentMode(mode);
  }, []);

  return {
    userProfile,
    currentMode,
    conversationHistory,
    processUserMessage,
    resetConversation,
    updateProfile,
    forceMode
  };
};