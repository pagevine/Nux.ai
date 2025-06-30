import { UserProfile, NuxMode, ConversationContext } from '../types/nux';

// Keyword patterns for mode detection
const MODE_PATTERNS = {
  reaktivierung: [
    'alte leads', 'alte kontakte', 'warme leads', 'unbearbeitet', 'reaktivieren',
    'liegen rum', 'nichts draus gemacht', 'länger nicht gesprochen',
    'follow-up', 'nachfassen', 'wieder aktivieren'
  ],
  
  coaching: [
    'keine leads', 'gar keine', 'noch keine', 'will loslegen', 'durchstarten',
    'anfangen', 'neu im vertrieb', 'erste schritte', 'wie fange ich an',
    'lead generation', 'leads generieren'
  ],
  
  umsetzung: [
    'zieh nicht durch', 'schaff es nicht', 'motivation', 'prokrastination',
    'struktur fehlt', 'zeit fehlt', 'nicht konsequent', 'aufschieberitis',
    'weiß was zu tun ist', 'kenne die theorie', 'umsetzung schwer'
  ]
};

// Detect primary mode based on user message
export const detectNuxMode = (
  userMessage: string, 
  conversationHistory: string[],
  currentProfile: UserProfile
): NuxMode => {
  const message = userMessage.toLowerCase();
  const history = conversationHistory.join(' ').toLowerCase();
  
  const scores = {
    reaktivierung: 0,
    coaching: 0,
    umsetzung: 0
  };

  // Score based on keyword matches
  Object.entries(MODE_PATTERNS).forEach(([mode, patterns]) => {
    patterns.forEach(pattern => {
      if (message.includes(pattern)) {
        scores[mode as keyof typeof scores] += 2;
      }
      if (history.includes(pattern)) {
        scores[mode as keyof typeof scores] += 1;
      }
    });
  });

  // Additional scoring based on user profile
  if (currentProfile.hasOldLeads || currentProfile.oldLeadsCount) {
    scores.reaktivierung += 3;
  }
  
  if (currentProfile.isBeginnerInSales || (!currentProfile.hasOldLeads && !currentProfile.newLeadsPerMonth)) {
    scores.coaching += 3;
  }
  
  if (currentProfile.hasExperience && currentProfile.mainChallenge === 'umsetzung') {
    scores.umsetzung += 3;
  }

  // Determine winning mode
  const maxScore = Math.max(...Object.values(scores));
  const winningMode = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'coaching';
  
  const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0.3;
  
  return {
    type: winningMode as 'reaktivierung' | 'coaching' | 'umsetzung',
    confidence,
    triggers: Object.entries(MODE_PATTERNS[winningMode as keyof typeof MODE_PATTERNS] || [])
      .filter(([_, pattern]) => message.includes(pattern))
      .map(([_, pattern]) => pattern)
  };
};

// Extract user profile information from conversation
export const extractUserProfile = (
  userMessage: string,
  conversationHistory: string[],
  currentProfile: UserProfile
): UserProfile => {
  const message = userMessage.toLowerCase();
  const updatedProfile = { ...currentProfile };

  // Extract numbers for lead counts
  const numbers = userMessage.match(/\d+/g);
  if (numbers) {
    const num = parseInt(numbers[0]);
    
    if (message.includes('alte') || message.includes('unbearbeitet')) {
      updatedProfile.oldLeadsCount = num;
      updatedProfile.hasOldLeads = num > 0;
    } else if (message.includes('neue') || message.includes('monat')) {
      updatedProfile.newLeadsPerMonth = num;
    } else if (message.includes('stunden') || message.includes('zeit')) {
      updatedProfile.timeAvailableDaily = num;
    }
  }

  // Detect experience level
  if (message.includes('neu im') || message.includes('anfänger') || message.includes('erste mal')) {
    updatedProfile.isBeginnerInSales = true;
    updatedProfile.hasExperience = false;
  } else if (message.includes('erfahrung') || message.includes('schon mal') || message.includes('kenne mich aus')) {
    updatedProfile.hasExperience = true;
    updatedProfile.isBeginnerInSales = false;
  }

  // Detect lead sources
  const sources = [];
  if (message.includes('facebook') || message.includes('fb')) sources.push('Facebook Ads');
  if (message.includes('google')) sources.push('Google Ads');
  if (message.includes('portal') || message.includes('immoscout')) sources.push('Immobilienportale');
  if (message.includes('empfehlung')) sources.push('Empfehlungen');
  if (message.includes('kalt') || message.includes('cold')) sources.push('Kaltakquise');
  
  if (sources.length > 0) {
    updatedProfile.leadSources = [...(updatedProfile.leadSources || []), ...sources];
  }

  // Detect automation usage
  if (message.includes('crm') || message.includes('system') || message.includes('automatisch')) {
    updatedProfile.hasAutomation = true;
    updatedProfile.usesCRM = true;
  } else if (message.includes('manuell') || message.includes('ohne system')) {
    updatedProfile.hasAutomation = false;
    updatedProfile.usesCRM = false;
  }

  // Detect primary goals
  if (message.includes('termine')) updatedProfile.primaryGoal = 'termine';
  else if (message.includes('abschluss') || message.includes('verkauf')) updatedProfile.primaryGoal = 'abschlüsse';
  else if (message.includes('leads') || message.includes('kontakte')) updatedProfile.primaryGoal = 'leads';
  else if (message.includes('struktur') || message.includes('organisation')) updatedProfile.primaryGoal = 'struktur';

  // Detect urgency
  if (message.includes('sofort') || message.includes('dringend') || message.includes('schnell')) {
    updatedProfile.urgencyLevel = 'high';
  } else if (message.includes('zeit lassen') || message.includes('langfristig')) {
    updatedProfile.urgencyLevel = 'low';
  } else {
    updatedProfile.urgencyLevel = 'medium';
  }

  // Detect industry
  if (message.includes('immobilien') || message.includes('makler')) {
    updatedProfile.industry = 'immobilien';
  }

  return updatedProfile;
};

// Build conversation context
export const buildConversationContext = (
  messages: string[],
  userProfile: UserProfile,
  currentMode: NuxMode
): ConversationContext => {
  const keyInsights = [];
  const missingInfo = [];

  // Analyze what we know
  if (userProfile.hasOldLeads && userProfile.oldLeadsCount) {
    keyInsights.push(`Hat ${userProfile.oldLeadsCount} alte Leads`);
  } else {
    missingInfo.push('Anzahl alter Leads');
  }

  if (userProfile.newLeadsPerMonth) {
    keyInsights.push(`${userProfile.newLeadsPerMonth} neue Leads/Monat`);
  } else {
    missingInfo.push('Neue Leads pro Monat');
  }

  if (userProfile.leadSources && userProfile.leadSources.length > 0) {
    keyInsights.push(`Lead-Quellen: ${userProfile.leadSources.join(', ')}`);
  } else {
    missingInfo.push('Lead-Quellen');
  }

  if (userProfile.hasAutomation !== undefined) {
    keyInsights.push(`Automatisierung: ${userProfile.hasAutomation ? 'Ja' : 'Nein'}`);
  } else {
    missingInfo.push('Automatisierung-Status');
  }

  return {
    messageCount: messages.length,
    userProfile,
    currentMode,
    keyInsights,
    missingInfo
  };
};