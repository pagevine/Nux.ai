import React from 'react';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  
  if (isUser) {
    // User messages: Right-aligned pill-shaped bubbles
    return (
      <div className="w-full px-4 py-2">
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-black text-white px-4 py-3 rounded-full">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Chatbot messages: Left-aligned text-only, matches background
    return (
      <div className="w-full px-4 py-2">
        <div className="flex justify-start">
          <div className="max-w-[80%]">
            <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  }
};