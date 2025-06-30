import React from 'react';
import { UserProfile } from '../types/nux';
import { Users, Target, Clock, Zap } from 'lucide-react';

interface ProfileSummaryProps {
  profile: UserProfile;
  isVisible: boolean;
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile, isVisible }) => {
  if (!isVisible) return null;

  const hasSignificantData = profile.oldLeadsCount || profile.newLeadsPerMonth || profile.leadSources?.length;

  if (!hasSignificantData) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 mx-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Users size={16} />
        Dein Profil
      </h3>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        {profile.oldLeadsCount && (
          <div className="flex items-center gap-2">
            <Target size={12} className="text-blue-500" />
            <span className="text-gray-600">Alte Leads:</span>
            <span className="font-medium">{profile.oldLeadsCount}</span>
          </div>
        )}
        
        {profile.newLeadsPerMonth && (
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-green-500" />
            <span className="text-gray-600">Neue/Monat:</span>
            <span className="font-medium">{profile.newLeadsPerMonth}</span>
          </div>
        )}
        
        {profile.timeAvailableDaily && (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-orange-500" />
            <span className="text-gray-600">Zeit/Tag:</span>
            <span className="font-medium">{profile.timeAvailableDaily}h</span>
          </div>
        )}
        
        {profile.hasAutomation !== undefined && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${profile.hasAutomation ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">Automation:</span>
            <span className="font-medium">{profile.hasAutomation ? 'Ja' : 'Nein'}</span>
          </div>
        )}
      </div>
      
      {profile.leadSources && profile.leadSources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-gray-600 text-xs">Quellen: </span>
          <span className="text-xs font-medium">{profile.leadSources.join(', ')}</span>
        </div>
      )}
    </div>
  );
};