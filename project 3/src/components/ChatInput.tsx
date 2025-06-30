import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { VoiceInput } from './VoiceInput';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleVoiceTranscription = (text: string) => {
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 sticky bottom-0">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Stell mir irgendeine Frage"
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 disabled:opacity-50 resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Voice Input Button */}
          <VoiceInput 
            onTranscription={handleVoiceTranscription}
            disabled={disabled}
          />
          
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};