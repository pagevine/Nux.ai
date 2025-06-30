import { UserData, ChatMessage, APIMessage } from '../types/chat';
import { generateAIResponse, estimateResponseTime } from '../services/openai';
import { getConversationContext, Conversation } from '../services/supabase';

// Convert Supabase conversations to API messages for OpenAI
export const buildMessageArrayFromHistory = (conversations: Conversation[]): APIMessage[] => {
  const apiMessages: APIMessage[] = [];
  
  // Convert conversation history to API format
  conversations.forEach(conv => {
    apiMessages.push({
      role: conv.role === 'user' ? 'user' : 'assistant',
      content: conv.message
    });
  });
  
  return apiMessages;
};

// Build message array from chat messages (fallback)
export const buildMessageArray = (messages: ChatMessage[]): APIMessage[] => {
  // Take last 8 messages for better context
  const recentMessages = messages.slice(-8);
  
  const apiMessages: APIMessage[] = [];
  
  // Convert chat messages to API format
  recentMessages.forEach(message => {
    apiMessages.push({
      role: message.type === 'user' ? 'user' : 'assistant',
      content: message.content
    });
  });
  
  return apiMessages;
};

// Main function to generate NUX response with full context
export const generateNUXResponse = async (
  userMessage: string, 
  userData: UserData, 
  messageHistory: ChatMessage[],
  sessionId?: string
): Promise<{ response: string; estimatedTime: number }> => {
  
  let apiMessages: APIMessage[] = [];
  
  // Try to load conversation context from database first
  if (sessionId) {
    try {
      const conversationHistory = await getConversationContext(sessionId);
      if (conversationHistory.length > 0) {
        apiMessages = buildMessageArrayFromHistory(conversationHistory);
      }
    } catch (error) {
      console.warn('Could not load conversation context from database, using local history');
    }
  }
  
  // Fallback to local message history if no database context
  if (apiMessages.length === 0) {
    apiMessages = buildMessageArray(messageHistory);
  }
  
  // Add current user message
  apiMessages.push({
    role: 'user',
    content: userMessage
  });
  
  // Estimate response time for UI feedback
  const estimatedTime = estimateResponseTime(userMessage.length);
  
  try {
    // Get AI response with full context
    const response = await generateAIResponse(apiMessages);
    
    // Update user data based on conversation patterns
    updateUserDataFromConversation(userMessage, userData, apiMessages);
    
    return {
      response,
      estimatedTime
    };
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Fallback to local logic
    const fallbackResponse = generateFallbackResponse(userMessage, userData, messageHistory);
    
    return {
      response: fallbackResponse,
      estimatedTime
    };
  }
};

// Enhanced user data extraction from conversation
const updateUserDataFromConversation = (
  userMessage: string, 
  userData: UserData, 
  conversationHistory: APIMessage[]
): void => {
  const message = userMessage.toLowerCase();
  
  // Extract numbers for contacts
  const numbers = userMessage.match(/\d+/g);
  if (numbers) {
    // Determine context based on conversation flow
    const recentMessages = conversationHistory.slice(-4).map(m => m.content.toLowerCase());
    const context = recentMessages.join(' ');
    
    if (context.includes('alte') || context.includes('unbearbeitet') || !userData.oldContacts) {
      userData.oldContacts = parseInt(numbers[0]);
    } else if (context.includes('neue') || context.includes('monat') || !userData.newContacts) {
      userData.newContacts = parseInt(numbers[0]);
    }
  }
  
  // Detect automation usage
  if (message.includes('ja') || message.includes('crm') || message.includes('automation') || 
      message.includes('system') || message.includes('automatisch')) {
    userData.automation = true;
  } else if (message.includes('nein') || message.includes('manuell') || 
             message.includes('ohne') || message.includes('nicht')) {
    userData.automation = false;
  }
  
  // Detect lead sources
  const sources = [];
  if (message.includes('facebook') || message.includes('fb')) sources.push('Facebook Ads');
  if (message.includes('instagram') || message.includes('insta')) sources.push('Instagram');
  if (message.includes('google')) sources.push('Google Ads');
  if (message.includes('portal') || message.includes('immoscout') || message.includes('immowelt')) sources.push('Immobilienportale');
  if (message.includes('empfehlung') || message.includes('weiterempfehlung')) sources.push('Empfehlungen');
  if (message.includes('kalt') || message.includes('cold')) sources.push('Kaltakquise');
  if (message.includes('website') || message.includes('homepage')) sources.push('Website');
  
  if (sources.length > 0) {
    userData.sources = [...(userData.sources || []), ...sources];
  }
  
  // Detect industry specifics
  if (message.includes('immobilien') || message.includes('makler') || 
      message.includes('verkauf') || message.includes('vermietung')) {
    userData.industry = 'immobilien';
  }
  
  // Detect challenges
  const challenges = [];
  if (message.includes('zeit') || message.includes('zeitaufwand')) challenges.push('Zeitmangel');
  if (message.includes('follow') || message.includes('nachfassen')) challenges.push('Follow-up');
  if (message.includes('conversion') || message.includes('abschluss')) challenges.push('Conversion');
  if (message.includes('qualität') || message.includes('qualifizierung')) challenges.push('Lead-Qualität');
  
  if (challenges.length > 0) {
    userData.challenges = [...(userData.challenges || []), ...challenges];
  }
  
  // Mark as having analysis if we have enough data
  if (userData.oldContacts && userData.newContacts && userData.automation !== undefined) {
    userData.hasAnalysis = true;
  }
};

// Enhanced fallback response with better conversation flow
const generateFallbackResponse = (
  userMessage: string, 
  userData: UserData, 
  messageHistory: ChatMessage[]
): string => {
  const message = userMessage.toLowerCase();
  const messageCount = messageHistory.length;
  
  // Initial greeting
  if (messageCount <= 2) {
    return getInitialMessage();
  }
  
  // Progressive data collection
  if (!userData.oldContacts) {
    const contactMatch = message.match(/(\d+)/);
    if (contactMatch) {
      userData.oldContacts = parseInt(contactMatch[1]);
      return `Okay, ${userData.oldContacts} alte Kontakte sind schon mal eine gute Basis.

Und wie viele neue Leads kommen bei dir so pro Monat rein? Also durch Werbung, Empfehlungen oder was auch immer du machst?`;
    }
    return `Um dir die beste Strategie zu zeigen, brauch ich ein paar Zahlen von dir.

Wie viele alte oder unbearbeitete Kontakte hast du ungefähr rumliegen?

Einfach schätzen reicht völlig.`;
  }
  
  // New contacts inquiry
  if (userData.oldContacts && !userData.newContacts) {
    const newContactsMatch = message.match(/(\d+)/);
    if (newContactsMatch) {
      userData.newContacts = parseInt(newContactsMatch[1]);
      return `Alright, ${userData.newContacts} neue Leads pro Monat ist schon mal nicht schlecht.

Woher kommen die meisten? Facebook, Google, Immobilienportale oder eher über Empfehlungen?`;
    }
    return `Und wie viele neue Kontakte kommen bei dir so pro Monat rein?

Auch hier reicht eine grobe Schätzung.`;
  }
  
  // Sources inquiry
  if (userData.oldContacts && userData.newContacts && (!userData.sources || userData.sources.length === 0)) {
    updateUserDataFromConversation(userMessage, userData, []);
    return `${userMessage} - okay, das sind gute Kanäle.

Letzte Frage: Nutzt du schon irgendwelche Automatisierungen für dein Follow-up? Also CRM, E-Mail-Sequenzen oder sowas?

Einfach ja oder nein reicht.`;
  }
  
  // Final analysis
  if (userData.oldContacts && userData.newContacts && userData.sources && userData.automation === undefined) {
    const hasAutomation = message.includes('ja') || message.includes('system') || message.includes('crm');
    userData.automation = hasAutomation;
    userData.hasAnalysis = true;
    
    return generateDetailedAnalysis(userData);
  }
  
  // Post-analysis conversation
  if (userData.hasAnalysis) {
    return generateContextualAdvice(userMessage, userData);
  }
  
  return `Alright, erzähl mir mehr über deine Situation.

Womit kann ich dir konkret helfen?
- Alte Leads reaktivieren
- Conversion verbessern  
- Automatisierungen aufsetzen
- Follow-up optimieren

Beschreib einfach deine größte Baustelle.`;
};

// Generate detailed analysis based on collected data
const generateDetailedAnalysis = (userData: UserData): string => {
  const totalContacts = (userData.oldContacts || 0) + (userData.newContacts || 0);
  const conversionRate = userData.automation ? 0.15 : 0.10;
  const potentialConversions = Math.round(totalContacts * conversionRate);
  const revenueEstimate = potentialConversions * 3500;
  
  return `Okay, hier ist deine Situation:

Du hast ${userData.oldContacts} alte Kontakte rumliegen und ${userData.newContacts} neue kommen pro Monat dazu. ${userData.automation ? 'Du nutzt schon Automatisierungen, das ist gut.' : 'Du machst noch alles manuell.'}

Deine Lead-Quellen: ${userData.sources?.join(', ') || 'Verschiedene'}

Hier ist das Potenzial: Aus deinen ${totalContacts} Kontakten könntest du realistisch ${potentialConversions} Abschlüsse pro Monat machen. Das wären etwa ${revenueEstimate.toLocaleString('de-DE')} Euro Umsatz.

Dein 5-Schritte-Plan:

1. Kontakte sortieren
Teile deine ${userData.oldContacts} alten Kontakte in heiß, warm und kalt ein

2. Personalisierte Reaktivierung
Individuelle Nachrichten je nach letztem Kontakt

3. Multi-Channel nutzen
E-Mail, WhatsApp, Telefon kombinieren

4. Mehrwert bieten
Kostenlose Marktanalysen als Türöffner

5. Follow-up ${userData.automation ? 'optimieren' : 'automatisieren'}
${userData.automation ? 'Deine bestehenden Systeme für bessere Conversion tunen' : 'CRM einführen für systematisches Nachfassen'}

Welchen Schritt willst du zuerst angehen?`;
};

// Generate contextual advice based on user questions
const generateContextualAdvice = (userMessage: string, userData: UserData): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('schritt 1') || message.includes('sortier') || message.includes('segmentier')) {
    return `Alright, Schritt 1: Kontakte sortieren

Teile deine ${userData.oldContacts} Kontakte so auf:

Heiße Leads (etwa 20 Prozent)
Letzter Kontakt unter 3 Monaten, hatten konkretes Interesse
Aktion: Sofort anrufen

Warme Leads (etwa 30 Prozent)  
Letzter Kontakt 3-12 Monate, grundsätzliches Interesse
Aktion: Personalisierte E-Mail plus Follow-up

Kalte Leads (etwa 50 Prozent)
Letzter Kontakt über 12 Monate, wenig Interaktion
Aktion: Mehrwert-Strategie mit kostenlosen Marktanalysen

Mit welcher Kategorie willst du anfangen?`;
  }
  
  if (message.includes('schritt 2') || message.includes('personalisiert') || message.includes('nachricht')) {
    return `Schritt 2: Personalisierte Reaktivierung

Hier ist ein Template für warme Leads:

"Hi [Name],

erinnerst du dich noch an unser Gespräch über [spezifisches Detail]? 

Der Markt in [Gebiet] hat sich seitdem ziemlich entwickelt. Ich hab gerade eine Analyse gemacht, die für dich interessant sein könnte.

Hast du 10 Minuten für ein kurzes Update?

Grüße,
[Dein Name]"

Die wichtigsten Punkte:
- Letztes Gespräch erwähnen
- Aktueller Marktbezug
- Konkreter Mehrwert
- Einfacher Call-to-Action

Brauchst du Templates für die anderen Lead-Kategorien?`;
  }
  
  if (message.includes('automation') || message.includes('crm') || message.includes('system')) {
    if (userData.automation) {
      return `Automation optimieren

Da du schon Automatisierungen nutzt, hier die wichtigsten Stellschrauben:

E-Mail-Sequenzen verbessern:
- Verschiedene Betreffzeilen testen
- Mehr Personalisierung (Name, Ort, Interesse)
- Follow-up-Timing anpassen (Tag 1, 3, 7, 14, 30)

Tracking optimieren:
- Öffnungsraten messen
- Klickraten analysieren
- Antwortquoten tracken

Segmentierung verfeinern:
- Nach Interesse aufteilen
- Nach Aktivität gruppieren
- Nach Kaufbereitschaft sortieren

Welchen Bereich willst du zuerst angehen?`;
    } else {
      return `CRM-System einführen

Für deine ${userData.oldContacts + (userData.newContacts || 0)} Kontakte empfehle ich:

Einsteigerfreundliche Systeme:
- HubSpot (kostenlos für Basics)
- Pipedrive (speziell für Vertrieb)
- Monday.com (visuell und einfach)

Must-Have Features:
- Automatische Follow-up-Erinnerungen
- E-Mail-Integration
- Lead-Scoring
- Pipeline-Tracking

Erste Schritte:
1. Alle Kontakte importieren
2. Lead-Status definieren
3. Follow-up-Sequenzen einrichten
4. Erste Automatisierung testen

Soll ich dir bei der Auswahl helfen?`;
    }
  }
  
  // Default contextual response
  return `Das ist eine gute Frage. Mit deinen ${userData.oldContacts} alten und ${userData.newContacts} neuen Kontakten kann ich dir gezielt helfen.

Wähle deinen Fokus:

Sofortige Umsetzung - Konkrete Schritte für diese Woche
Langfristige Strategie - Systematischer Aufbau über 3 Monate  
Automatisierung - Tools und Systeme einrichten
Conversion optimieren - Mehr Abschlüsse aus bestehenden Leads

Was ist für dich gerade am wichtigsten?`;
};

export const getInitialMessage = (): string => {
  return `Hey! Ich bin NUX und helfe dir dabei, aus deinen alten Kontakten wieder richtige Leads zu machen.

Okay, schauen wir mal drauf. Wie viele alte Kontakte hast du ungefähr rumliegen, mit denen du länger nicht gesprochen hast?

Sind das eher Leads aus Anzeigen oder Empfehlungen?

Sobald ich das weiß, geb ich dir einen klaren Plan, wie du da in den nächsten Tagen wieder Bewegung reinbringst.`;
};