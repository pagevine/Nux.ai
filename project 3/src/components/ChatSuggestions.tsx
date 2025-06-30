import React from 'react';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

export const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSuggestionClick, disabled }) => {
  const suggestions = [
    "Ich habe ein paar alte Leads, aber weiß nicht, was ich damit machen soll",
    "Ich will mehr Termine machen, aber niemand antwortet",
    "Ich habe gar keine Leads, will aber mit Vertrieb durchstarten",
    "Ich will einfach besser werden im Umsetzen"
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Hey, ich bin NUX
        </h1>
        <p className="text-gray-600 text-lg">
          Lass uns gemeinsam aus deinen Kontakten echte Abschlüsse machen
        </p>
      </div>
      
      {/* Suggestion Cards */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={disabled}
            className="w-full text-left p-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};