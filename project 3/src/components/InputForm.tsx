import React, { useState } from 'react';
import { Brain } from 'lucide-react';

interface FormData {
  oldContacts: string;
  newContacts: string;
  automation: string;
}

interface InputFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    oldContacts: '',
    newContacts: '',
    automation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.oldContacts && formData.newContacts && formData.automation) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.oldContacts && formData.newContacts && formData.automation;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mb-8">
      <div>
        <label htmlFor="oldContacts" className="block text-sm font-medium text-gray-900 mb-2">
          Wie viele alte Kontakte willst du analysieren?
        </label>
        <input
          type="number"
          id="oldContacts"
          value={formData.oldContacts}
          onChange={(e) => setFormData({ ...formData, oldContacts: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
          placeholder="z.B. 150"
          min="1"
          required
        />
      </div>

      <div>
        <label htmlFor="newContacts" className="block text-sm font-medium text-gray-900 mb-2">
          Wie viele neue Kontakte durch Ads?
        </label>
        <input
          type="number"
          id="newContacts"
          value={formData.newContacts}
          onChange={(e) => setFormData({ ...formData, newContacts: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
          placeholder="z.B. 80"
          min="1"
          required
        />
      </div>

      <div>
        <label htmlFor="automation" className="block text-sm font-medium text-gray-900 mb-2">
          Nutzen Sie bereits Automatisierungen?
        </label>
        <select
          id="automation"
          value={formData.automation}
          onChange={(e) => setFormData({ ...formData, automation: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900"
          required
        >
          <option value="">Bitte wählen...</option>
          <option value="ja">Ja</option>
          <option value="nein">Nein</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:cursor-not-allowed"
      >
        <Brain size={20} />
        {isLoading ? 'Analyse läuft...' : '🧠 Analyse starten'}
      </button>
    </form>
  );
};