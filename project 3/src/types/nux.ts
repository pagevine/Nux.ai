export interface NuxMode {
  type: 'auto' | 'reaktivierung' | 'coaching' | 'umsetzung';
  confidence: number;
  triggers: string[];
}

export interface UserProfile {
  // Lead situation
  hasOldLeads?: boolean;
  oldLeadsCount?: number;
  newLeadsPerMonth?: number;
  leadSources?: string[];
  
  // Experience level
  isBeginnerInSales?: boolean;
  hasExperience?: boolean;
  
  // Current challenges
  mainChallenge?: 'reaktivierung' | 'lead_generation' | 'conversion' | 'umsetzung' | 'motivation';
  specificProblems?: string[];
  
  // Goals & timeline
  timeAvailableDaily?: number;
  urgencyLevel?: 'low' | 'medium' | 'high';
  primaryGoal?: 'termine' | 'abschlüsse' | 'leads' | 'struktur';
  
  // Tools & automation
  hasAutomation?: boolean;
  usesCRM?: boolean;
  currentTools?: string[];
  
  // Context from conversation
  lastContactTime?: string;
  industry?: string;
  targetAudience?: string;
}

export interface NuxResponse {
  content: string;
  mode: NuxMode;
  nextQuestions?: string[];
  actionItems?: string[];
  followUpSuggestions?: string[];
}

export interface ConversationContext {
  messageCount: number;
  userProfile: UserProfile;
  currentMode: NuxMode;
  keyInsights: string[];
  missingInfo: string[];
}