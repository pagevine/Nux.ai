import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface UserMenuProps {
  className?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ 
  className = '', 
  onProfileClick,
  onSettingsClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    onProfileClick?.();
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    onSettingsClick?.();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            
            <div className="py-1">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User size={16} />
                Profil bearbeiten
              </button>
              
              <button
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings size={16} />
                Einstellungen
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Abmelden
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};