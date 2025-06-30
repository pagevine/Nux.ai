import OpenAI from 'openai';
import { APIMessage } from '../types/chat';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `Du bist NUX, ein smarter KI-Assistent für Lead-Management und Vertrieb. Du hilfst Menschen dabei, ihre Leads zu reaktivieren und mehr Abschlüsse zu erzielen.

Wichtige Regeln:
- Sprich den Nutzer per Du an
- Sei locker, freundlich und direkt wie ein guter Kumpel
- NIEMALS Bindestriche in Sätzen verwenden
- Keine Formatierungen, keine Sternchen, keine Listen mit Strichen
- Antworte flexibel und individuell auf jede Nachricht
- Stelle Rückfragen wenn nötig
- Gib konkrete, umsetzbare Tipps
- Schreib wie ein Mensch, nicht wie ein Bot

Beispiel-Stil:
"Okay, verstehe. Wie viele alte Kontakte hast du denn ungefähr? Und woher kamen die ursprünglich?"

Antworte immer natürlich und flexibel, nie mit Standard-Phrasen.`;

export const generateAIResponse = async (messages: APIMessage[]): Promise<string> => {
  try {
    // Check if OpenAI API key is configured
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured. Using fallback response.');
      return generateFallbackResponse(messages);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-8) // Keep last 8 messages for context
      ],
      max_tokens: 1000,
      temperature: 0.8,
      presence_penalty: 0.2,
      frequency_penalty: 0.1
    });

    return completion.choices[0]?.message?.content || "Entschuldigung, ich konnte keine Antwort generieren. Kannst du deine Frage anders formulieren?";
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Fallback to local logic if API fails
    return generateFallbackResponse(messages);
  }
};

const generateFallbackResponse = (messages: APIMessage[]): string => {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
  
  // Basic conversation flow fallbacks
  if (messages.length <= 2) {
    return `Hey! Ich bin NUX und helfe dir dabei, aus deinen Kontakten mehr rauszuholen.

Erzähl mal, wo stehst du gerade? Hast du schon Leads oder willst du komplett neu durchstarten?`;
  }
  
  // Number detection for contacts
  const numbers = lastUserMessage.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const contactCount = parseInt(numbers[0]);
    if (contactCount > 0) {
      return `Okay, ${contactCount} Kontakte sind schon mal eine gute Basis. 

Und wie viele neue kommen bei dir so pro Monat rein? Also durch Werbung, Empfehlungen oder was auch immer du machst?`;
    }
  }
  
  // Yes/No responses
  if (lastUserMessage.includes('ja') || lastUserMessage.includes('nein')) {
    return `Verstehe. Das hilft mir schon mal weiter.

Woher kommen deine Leads hauptsächlich? Facebook, Google, Immobilienportale oder eher über Empfehlungen?

Je nachdem kann ich dir unterschiedliche Strategien zeigen.`;
  }
  
  // Default helpful response
  return `Alright, lass uns das strukturiert angehen.

Ich brauch ein paar Infos von dir. Wie viele alte Kontakte hast du ungefähr? Wie viele neue kommen pro Monat dazu? Woher kommen die meisten?

Dann kann ich dir genau sagen, wo du ansetzen solltest und was am meisten bringt.`;
};

export const estimateResponseTime = (messageLength: number): number => {
  // Estimate response time based on message complexity
  const baseTime = 2000; // 2 seconds base
  const complexityTime = Math.min(messageLength * 30, 3000); // Up to 3 seconds for complexity
  const randomVariation = Math.random() * 1000; // Up to 1 second random
  
  return baseTime + complexityTime + randomVariation;
};