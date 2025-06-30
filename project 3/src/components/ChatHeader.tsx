import React from 'react';
import { History, Plus } from 'lucide-react';

interface ChatHeaderProps {
  onMenuClick?: () => void;
  onNewChat?: () => void;
  sessionName?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onMenuClick, onNewChat, sessionName }) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Chat History"
        >
          <History size={20} className="text-gray-600" />
        </button>
        
        {/* Center: Title */}
        <h1 className="text-lg font-semibold text-gray-900">
          {sessionName || 'Chat'}
        </h1>
        
        {/* Right: New Chat Button */}
        <button
          onClick={onNewChat}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="New Chat"
        >
          <Plus size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};