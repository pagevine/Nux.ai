import React from 'react';
import { Rocket } from 'lucide-react';

export const StickyBottomCTA: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 shadow-lg border-t border-gray-200 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Rocket size={20} />
          <span className="font-medium">🚀 Noch mehr Leads? Jetzt KI-Coach aktivieren</span>
        </div>
        <button className="bg-white hover:bg-gray-100 text-black font-medium px-6 py-2 rounded-lg transition-all duration-200 whitespace-nowrap">
          Jetzt starten
        </button>
      </div>
    </div>
  );
};