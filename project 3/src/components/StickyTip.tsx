import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

export const StickyTip: React.FC = () => {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:w-80">
      <div className="bg-black text-white p-3 rounded-lg shadow-lg">
        <div className="flex items-start gap-2">
          <Lightbulb size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">💡 Tipp</p>
            <p className="text-gray-300">Je präziser du antwortest, desto besser kann ich dir helfen.</p>
          </div>
        </div>
        <button className="mt-2 text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors">
          👉 Mehr Tools entdecken
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};