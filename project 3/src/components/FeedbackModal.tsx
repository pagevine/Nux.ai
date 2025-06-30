import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { saveFeedback } from '../services/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  messageId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  sessionId,
  messageId 
}) => {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating && sessionId && !isSubmitting) {
      setIsSubmitting(true);
      
      try {
        const ratingValue = rating === 'up' ? 5 : 1;
        await saveFeedback(sessionId, messageId, ratingValue, feedback);
        
        console.log('Feedback submitted:', { rating, feedback, sessionId, messageId });
        setSubmitted(true);
        
        setTimeout(() => {
          setSubmitted(false);
          setRating(null);
          setFeedback('');
          setIsSubmitting(false);
          onClose();
        }, 2000);
      } catch (error) {
        console.error('Error submitting feedback:', error);
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Wie war unser Chat?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-green-600 mb-2">✅</div>
            <p className="text-gray-900 font-medium">Vielen Dank für dein Feedback!</p>
            <p className="text-sm text-gray-600 mt-1">Deine Bewertung hilft uns, NUX zu verbessern.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setRating('up')}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  rating === 'up'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                } disabled:opacity-50`}
              >
                <ThumbsUp size={24} />
              </button>
              <button
                type="button"
                onClick={() => setRating('down')}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  rating === 'down'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                } disabled:opacity-50`}
              >
                <ThumbsDown size={24} />
              </button>
            </div>
            
            <div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Was können wir verbessern? (optional)"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none disabled:opacity-50"
                rows={3}
              />
            </div>
            
            <button
              type="submit"
              disabled={!rating || isSubmitting}
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};