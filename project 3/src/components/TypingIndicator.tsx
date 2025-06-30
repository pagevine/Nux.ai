import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="w-full px-4 py-2">
      <div className="flex justify-start">
        <div className="max-w-[80%]">
          <div className="flex items-center gap-1 py-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};