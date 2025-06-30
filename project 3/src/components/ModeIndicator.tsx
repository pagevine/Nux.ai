import React from 'react';
import { Target, Users, Zap, Brain } from 'lucide-react';
import { NuxMode } from '../types/nux';

interface ModeIndicatorProps {
  mode: NuxMode;
  className?: string;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode, className = '' }) => {
  const getModeConfig = (modeType: string) => {
    switch (modeType) {
      case 'reaktivierung':
        return {
          icon: Target,
          label: 'Reaktivierungs-Modus',
          color: 'bg-blue-500',
          description: 'Alte Leads wieder aktivieren'
        };
      case 'coaching':
        return {
          icon: Users,
          label: 'Coaching-Modus',
          color: 'bg-green-500',
          description: 'Lead-Generation aufbauen'
        };
      case 'umsetzung':
        return {
          icon: Zap,
          label: 'Umsetzungs-Modus',
          color: 'bg-orange-500',
          description: 'Fokus & Struktur verbessern'
        };
      default:
        return {
          icon: Brain,
          label: 'Analyse-Modus',
          color: 'bg-gray-500',
          description: 'Situation verstehen'
        };
    }
  };

  const config = getModeConfig(mode.type);
  const Icon = config.icon;

  if (mode.type === 'auto' && mode.confidence < 0.7) {
    return null; // Don't show indicator during initial detection
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white ${config.color} ${className}`}>
      <Icon size={12} />
      <span>{config.label}</span>
      {mode.confidence > 0.8 && (
        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
      )}
    </div>
  );
};