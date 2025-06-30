import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';

export const FeedbackSection: React.FC = () => {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating) {
      // Here you would normally send to a backend/database
      console.log('Feedback submitted:', { rating, feedback });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRating(null);
        setFeedback('');
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-green-600 mb-2">✅</div>
        <p className="text-gray-900 font-medium">Vielen Dank für dein Feedback!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Hat dir die Analyse geholfen?
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => setRating('up')}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              rating === 'up'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <ThumbsUp size={24} />
          </button>
          <button
            type="button"
            onClick={() => setRating('down')}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              rating === 'down'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <ThumbsDown size={24} />
          </button>
        </div>
        
        <div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Was können wir verbessern?"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          disabled={!rating}
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          <Send size={18} />
          Feedback senden
        </button>
      </form>
    </div>
  );
};