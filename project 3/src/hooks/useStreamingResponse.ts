import { useState, useCallback } from 'react';

export interface StreamingState {
  isStreaming: boolean;
  streamingContent: string;
  isComplete: boolean;
}

export const useStreamingResponse = () => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamingContent: '',
    isComplete: false
  });

  const startStreaming = useCallback((content: string) => {
    setStreamingState({
      isStreaming: true,
      streamingContent: content,
      isComplete: false
    });
  }, []);

  const completeStreaming = useCallback(() => {
    setStreamingState(prev => ({
      ...prev,
      isStreaming: false,
      isComplete: true
    }));
  }, []);

  const resetStreaming = useCallback(() => {
    setStreamingState({
      isStreaming: false,
      streamingContent: '',
      isComplete: false
    });
  }, []);

  return {
    streamingState,
    startStreaming,
    completeStreaming,
    resetStreaming
  };
};