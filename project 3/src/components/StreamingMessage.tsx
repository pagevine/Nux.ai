import React, { useState, useEffect } from 'react';

interface StreamingMessageProps {
  content: string;
  onComplete?: () => void;
  speed?: number;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  content, 
  onComplete,
  speed = 900
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!content) return;

    const words = content.split(' ');
    let currentIndex = 0;
    
    const delayBetweenWords = (60 / speed) * 1000;
    
    const streamWords = () => {
      if (currentIndex < words.length) {
        setDisplayedContent(prev => {
          const newContent = currentIndex === 0 
            ? words[currentIndex] 
            : prev + ' ' + words[currentIndex];
          return newContent;
        });
        
        currentIndex++;
        
        const baseDelay = delayBetweenWords;
        const randomVariation = Math.random() * 30;
        const punctuationDelay = words[currentIndex - 1]?.match(/[.!?]$/) ? 200 : 0;
        
        setTimeout(streamWords, baseDelay + randomVariation + punctuationDelay);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    const startDelay = setTimeout(streamWords, 100);
    
    return () => {
      clearTimeout(startDelay);
    };
  }, [content, speed, onComplete]);

  return (
    <div className="w-full px-4 py-2">
      <div className="flex justify-start">
        <div className="max-w-[80%]">
          <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
            {displayedContent}
            {!isComplete && (
              <span className="inline-block w-0.5 h-4 bg-gray-900 ml-1 animate-blink"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};