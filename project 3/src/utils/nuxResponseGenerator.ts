import { UserProfile, NuxMode, NuxResponse, ConversationContext } from '../types/nux';

// Generate mode-specific responses
export const generateNuxResponse = (
  userMessage: string,
  context: ConversationContext
): NuxResponse => {
  const { currentMode, userProfile, messageCount, missingInfo } = context;

  switch (currentMode.type) {
    case 'reaktivierung':
      return generateReaktivierungResponse(userMessage, userProfile, messageCount, missingInfo);
    
    case 'coaching':
      return generateCoachingResponse(userMessage, userProfile, messageCount, missingInfo);
    
    case 'umsetzung':
      return generateUmsetzungResponse(userMessage, userProfile, messageCount, missingInfo);
    
    default:
      return generateAutoResponse(userMessage, userProfile, messageCount);
  }
};

// Reaktivierungs-Modus responses
const generateReaktivierungResponse = (
  userMessage: string,
  profile: UserProfile,
  messageCount: number,
  missingInfo: string[]
): NuxResponse => {
  
  // Initial reaktivierung questions
  if (messageCount <= 2) {
    return {
      content: `Alles klar. Wie lange liegen die ungefähr schon unangerührt?

Und woher kamen die ursprünglich – Anzeigen, Empfehlungen oder was anderes?

Gib mir kurz das Bild, dann bauen wir direkt einen klaren Plan.`,
      mode: { type: 'reaktivierung', confidence: 0.9, triggers: ['alte leads'] },
      nextQuestions: ['Zeitraum seit letztem Kontakt', 'Lead-Quellen', 'Anzahl der Kontakte']
    };
  }

  // Collect missing information
  if (missingInfo.includes('Anzahl alter Leads')) {
    return {
      content: `Okay, verstehe. Wie viele alte Kontakte sind das ungefähr? Einfach schätzen reicht.

Je nachdem kann ich dir verschiedene Strategien zeigen.`,
      mode: { type: 'reaktivierung', confidence: 0.8, triggers: [] },
      nextQuestions: ['Kontaktanzahl']
    };
  }

  if (missingInfo.includes('Lead-Quellen')) {
    return {
      content: `Woher kommen deine Leads hauptsächlich? Facebook, Google, Immobilienportale oder eher über Empfehlungen?

Das ist wichtig für die richtige Reaktivierungs-Strategie.`,
      mode: { type: 'reaktivierung', confidence: 0.8, triggers: [] },
      nextQuestions: ['Lead-Quellen']
    };
  }

  if (missingInfo.includes('Automatisierung-Status')) {
    return {
      content: `Letzte Frage: Nutzt du schon irgendwelche Automatisierungen für dein Follow-up? Also CRM, E-Mail-Sequenzen oder sowas?

Einfach ja oder nein reicht.`,
      mode: { type: 'reaktivierung', confidence: 0.8, triggers: [] },
      nextQuestions: ['Automatisierung']
    };
  }

  // Generate detailed reaktivierung strategy
  if (profile.oldLeadsCount && profile.leadSources && profile.hasAutomation !== undefined) {
    const strategy = generateReaktivierungStrategy(profile);
    return {
      content: strategy,
      mode: { type: 'reaktivierung', confidence: 1.0, triggers: [] },
      actionItems: [
        'Kontakte segmentieren (heiß/warm/kalt)',
        'Personalisierte Nachrichten erstellen',
        'Multi-Channel-Ansatz implementieren',
        'Follow-up-System optimieren'
      ],
      followUpSuggestions: [
        'Welchen Schritt willst du zuerst angehen?',
        'Brauchst du Templates für die Nachrichten?',
        'Soll ich dir bei der Segmentierung helfen?'
      ]
    };
  }

  // Default reaktivierung response
  return {
    content: `Lass uns systematisch vorgehen. Ich brauche noch ein paar Details:

${missingInfo.map(info => `- ${info}`).join('\n')}

Dann kann ich dir eine maßgeschneiderte Reaktivierungs-Strategie geben.`,
    mode: { type: 'reaktivierung', confidence: 0.7, triggers: [] }
  };
};

// Coaching-Modus responses
const generateCoachingResponse = (
  userMessage: string,
  profile: UserProfile,
  messageCount: number,
  missingInfo: string[]
): NuxResponse => {
  
  if (messageCount <= 2) {
    return {
      content: `Okay, dann bauen wir dich sauber auf. Sag mal: Wen willst du eigentlich erreichen?

Also Zielgruppe – wer genau? Sobald du das hast, helfe ich dir mit einem Starter-Plan für erste Leads in 7 Tagen.`,
      mode: { type: 'coaching', confidence: 0.9, triggers: ['keine leads'] },
      nextQuestions: ['Zielgruppe', 'Verfügbare Zeit', 'Budget', 'Erfahrung']
    };
  }

  // Time availability
  if (!profile.timeAvailableDaily) {
    return {
      content: `Wie viel Zeit willst du täglich investieren? 1 Stunde, 3 Stunden oder mehr?

Das bestimmt, welche Strategie am besten passt.`,
      mode: { type: 'coaching', confidence: 0.8, triggers: [] },
      nextQuestions: ['Zeitaufwand']
    };
  }

  // Experience level
  if (profile.isBeginnerInSales === undefined) {
    return {
      content: `Hast du schon mal Anzeigen geschaltet oder Kaltakquise gemacht? Oder ist das komplettes Neuland?

Dann kann ich dir den richtigen Einstieg zeigen.`,
      mode: { type: 'coaching', confidence: 0.8, triggers: [] },
      nextQuestions: ['Erfahrungslevel']
    };
  }

  // Generate coaching plan
  const coachingPlan = generateCoachingPlan(profile);
  return {
    content: coachingPlan,
    mode: { type: 'coaching', confidence: 1.0, triggers: [] },
    actionItems: [
      'Zielgruppe definieren',
      'Lead-Magnet erstellen',
      'Erste Kampagne starten',
      'Follow-up-System aufbauen'
    ]
  };
};

// Umsetzungs-Modus responses
const generateUmsetzungResponse = (
  userMessage: string,
  profile: UserProfile,
  messageCount: number,
  missingInfo: string[]
): NuxResponse => {
  
  if (messageCount <= 2) {
    return {
      content: `Sauber. Sag mir: Was hält dich aktuell noch davon ab, richtig Gas zu geben?

Fehlt dir Klarheit, Struktur oder einfach Motivation?

Je nachdem, wo du stehst, bekommst du von mir einen Wochenplan – ganz simpel und direkt machbar.`,
      mode: { type: 'umsetzung', confidence: 0.9, triggers: ['umsetzen'] },
      nextQuestions: ['Haupthindernis', 'Tagesstruktur', 'Motivation']
    };
  }

  // Identify main obstacle
  const message = userMessage.toLowerCase();
  let mainObstacle = '';
  
  if (message.includes('zeit') || message.includes('zeitaufwand')) {
    mainObstacle = 'Zeit';
  } else if (message.includes('struktur') || message.includes('plan')) {
    mainObstacle = 'Struktur';
  } else if (message.includes('motivation') || message.includes('durchhalten')) {
    mainObstacle = 'Motivation';
  }

  if (mainObstacle) {
    const umsetzungsPlan = generateUmsetzungsPlan(mainObstacle, profile);
    return {
      content: umsetzungsPlan,
      mode: { type: 'umsetzung', confidence: 1.0, triggers: [] },
      actionItems: [
        'Tagesplan erstellen',
        'Prioritäten setzen',
        'Tracking-System einführen',
        'Belohnungssystem etablieren'
      ]
    };
  }

  return {
    content: `Verstanden. Lass uns konkret werden: Was ist gerade dein größtes Hindernis – Zeit, Struktur oder Motivation?

Dann gebe ich dir einen klaren Wochenplan mit dem du heute noch anfangen kannst.`,
    mode: { type: 'umsetzung', confidence: 0.8, triggers: [] }
  };
};

// Auto-mode for initial detection
const generateAutoResponse = (
  userMessage: string,
  profile: UserProfile,
  messageCount: number
): NuxResponse => {
  return {
    content: `Hey! Ich bin NUX und helfe dir dabei, aus deinen alten Kontakten wieder richtige Leads zu machen.

Erzähl mir kurz: Wo stehst du gerade? Hast du schon Kontakte oder willst du komplett neu durchstarten?`,
    mode: { type: 'auto', confidence: 0.5, triggers: [] },
    nextQuestions: ['Aktuelle Situation', 'Ziele', 'Herausforderungen']
  };
};

// Strategy generators
const generateReaktivierungStrategy = (profile: UserProfile): string => {
  const totalContacts = (profile.oldLeadsCount || 0) + (profile.newLeadsPerMonth || 0);
  const conversionRate = profile.hasAutomation ? 0.15 : 0.10;
  const potentialConversions = Math.round(totalContacts * conversionRate);
  const revenueEstimate = potentialConversions * 3500;

  return `Okay, hier ist deine Situation:

Du hast ${profile.oldLeadsCount} alte Kontakte rumliegen und ${profile.newLeadsPerMonth || 0} neue kommen pro Monat dazu. ${profile.hasAutomation ? 'Du nutzt schon Automatisierungen, das ist gut.' : 'Du machst noch alles manuell.'}

Lead-Quellen: ${profile.leadSources?.join(', ') || 'Verschiedene'}

Hier ist das Potenzial: Aus deinen ${totalContacts} Kontakten könntest du realistisch ${potentialConversions} Abschlüsse pro Monat machen. Das wären etwa ${revenueEstimate.toLocaleString('de-DE')} Euro Umsatz.

Dein 5-Schritte-Reaktivierungsplan:

1. Kontakte segmentieren
Teile deine ${profile.oldLeadsCount} alten Kontakte in heiß, warm und kalt ein

2. Personalisierte Reaktivierung
Individuelle Nachrichten je nach letztem Kontakt

3. Multi-Channel nutzen
E-Mail, WhatsApp, Telefon kombinieren

4. Mehrwert bieten
Kostenlose Marktanalysen als Türöffner

5. Follow-up ${profile.hasAutomation ? 'optimieren' : 'automatisieren'}
${profile.hasAutomation ? 'Deine bestehenden Systeme für bessere Conversion tunen' : 'CRM einführen für systematisches Nachfassen'}

Welchen Schritt willst du zuerst angehen?`;
};

const generateCoachingPlan = (profile: UserProfile): string => {
  const timeDaily = profile.timeAvailableDaily || 2;
  const isBeginnerText = profile.isBeginnerInSales ? 'Anfänger-freundlich' : 'Fortgeschritten';

  return `Alright, hier ist dein ${isBeginnerText} 7-Tage-Starter-Plan:

Verfügbare Zeit: ${timeDaily} Stunden täglich
Zielgruppe: ${profile.targetAudience || 'Noch zu definieren'}

Tag 1-2: Fundament legen
- Zielgruppe scharf definieren
- Avatar erstellen (Alter, Probleme, Wünsche)
- Erste Marktrecherche

Tag 3-4: Lead-Magnet erstellen
- Kostenloses Angebot entwickeln
- Landing Page aufsetzen
- Erste Inhalte produzieren

Tag 5-6: Erste Kampagne
- ${profile.isBeginnerInSales ? 'Facebook Ads für Einsteiger' : 'Multi-Channel-Kampagne'}
- Budget: 50-100 Euro für Tests
- Tracking einrichten

Tag 7: Optimierung & Skalierung
- Erste Ergebnisse auswerten
- Follow-up-System testen
- Nächste Schritte planen

Pro Tag brauchst du etwa ${timeDaily} Stunden. Machbar?

Womit willst du anfangen?`;
};

const generateUmsetzungsPlan = (obstacle: string, profile: UserProfile): string => {
  switch (obstacle) {
    case 'Zeit':
      return `Zeit-Optimierungs-Plan:

Dein Problem: Zu wenig Zeit für konsequente Umsetzung

Die Lösung: 90-Minuten-Blöcke

Morgen-Block (30 Min):
- 10 Min: Tagesplanung
- 20 Min: Wichtigste Aufgabe

Mittag-Block (30 Min):
- Follow-ups bearbeiten
- Termine vereinbaren

Abend-Block (30 Min):
- Nachbereitung
- Nächsten Tag vorbereiten

Das sind nur 90 Minuten täglich, aber konsequent. Schaffst du das?`;

    case 'Struktur':
      return `Struktur-Plan für mehr Klarheit:

Dein Problem: Weißt nicht, was wann zu tun ist

Die Lösung: Wochenplan mit festen Zeiten

Montag: Lead-Generierung
Dienstag: Follow-ups
Mittwoch: Termine führen
Donnerstag: Nachbereitung & Planung
Freitag: Optimierung & Lernen

Jeden Tag gleiche Uhrzeiten, gleiche Abläufe. Routine schafft Erfolg.

Welchen Tag willst du zuerst strukturieren?`;

    case 'Motivation':
      return `Motivations-System:

Dein Problem: Fängst an, hörst aber wieder auf

Die Lösung: Micro-Wins & Belohnungen

Tägliche Mini-Ziele:
- 5 Kontakte bearbeiten = 1 Punkt
- 1 Termin vereinbaren = 3 Punkte
- 1 Abschluss = 10 Punkte

Belohnungen:
- 10 Punkte = Lieblings-Essen
- 25 Punkte = Freier Abend
- 50 Punkte = Größere Belohnung

Plus: Tägliches 2-Minuten-Journal für Erfolge.

Klingt machbar?`;

    default:
      return `Lass uns systematisch vorgehen. Sag mir konkret: Was ist dein größtes Hindernis beim Umsetzen?

Dann bekommst du einen maßgeschneiderten Plan.`;
  }
};