import React, { useState } from 'react';
import { X, Bell, Mail, Globe, Palette, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAuth();
  const [formData, setFormData] = useState({
    notifications_enabled: settings?.notifications_enabled ?? true,
    email_notifications: settings?.email_notifications ?? true,
    language: settings?.language || 'de',
    timezone: settings?.timezone || 'Europe/Berlin',
    theme: settings?.theme || 'light'
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateSettings(formData);
      onClose();
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Einstellungen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Bell size={18} />
              Benachrichtigungen
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, notifications_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Push-Benachrichtigungen aktivieren</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.email_notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_notifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">E-Mail-Benachrichtigungen</span>
              </label>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe size={16} className="inline mr-1" />
              Sprache
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Palette size={16} className="inline mr-1" />
              Design
            </label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value as any }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
              <option value="auto">Automatisch</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </button>
        </form>
      </div>
    </div>
  );
};