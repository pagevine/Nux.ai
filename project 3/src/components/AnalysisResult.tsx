import React from 'react';
import { TrendingUp, Users, Target, Zap, CheckCircle } from 'lucide-react';

interface AnalysisData {
  oldContacts: string;
  newContacts: string;
  automation: string;
}

interface AnalysisResultProps {
  data: AnalysisData;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const totalContacts = parseInt(data.oldContacts) + parseInt(data.newContacts);
  const potentialConversions = Math.round(totalContacts * 0.12);
  const successRate = data.automation === 'ja' ? '15-20%' : '8-12%';
  const revenueEstimate = potentialConversions * 3500;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp size={24} />
        📊 Deine Lead-Analyse
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Gesamt-Kontakte</span>
          </div>
          <p className="text-2xl font-bold text-black">{totalContacts}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Erfolgsquote</span>
          </div>
          <p className="text-2xl font-bold text-black">{successRate}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Potenzielle Abschlüsse</span>
          </div>
          <p className="text-2xl font-bold text-black">{potentialConversions}</p>
        </div>
      </div>

      <div className="bg-black text-white p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-2">💰 Umsatzpotenzial</h4>
        <p className="text-2xl font-bold">{revenueEstimate.toLocaleString('de-DE')} €</p>
        <p className="text-sm text-gray-300 mt-1">
          Basierend auf durchschnittlich 3.500€ Provision pro Abschluss
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle size={18} />
          🎯 Dein 5-Schritte-Reaktivierungsplan
        </h4>
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <p className="font-medium text-gray-900">Kontakte segmentieren</p>
              <p className="text-sm text-gray-600">Teile deine {data.oldContacts} alten Kontakte nach Interesse und Aktivität ein</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <p className="font-medium text-gray-900">Personalisierte Reaktivierung</p>
              <p className="text-sm text-gray-600">Erstelle individuelle Nachrichten basierend auf dem letzten Kontakt</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <p className="font-medium text-gray-900">Multi-Channel-Ansatz</p>
              <p className="text-sm text-gray-600">Nutze E-Mail, WhatsApp und Telefon für maximale Reichweite</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <p className="font-medium text-gray-900">Wertstrategie implementieren</p>
              <p className="text-sm text-gray-600">Biete kostenlose Marktanalysen und Immobilienbewertungen an</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
            <div>
              <p className="font-medium text-gray-900">Follow-up automatisieren</p>
              <p className="text-sm text-gray-600">
                {data.automation === 'ja' 
                  ? 'Optimiere deine bestehenden Automatisierungen für bessere Conversion'
                  : 'Implementiere ein CRM-System für systematisches Follow-up'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};