// NUX Response Logic - Kumpel-Stil ohne Formatierungen
export const getNuxResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();

  // Spezifische Antworten auf die 4 Startvorschläge
  if (message.includes('alte leads') && message.includes('weiß nicht')) {
    return `Alles klar. Wie lange liegen die ungefähr schon unangerührt?

Und woher kamen die ursprünglich – Anzeigen, Empfehlungen oder was anderes?

Gib mir kurz das Bild, dann bauen wir direkt einen klaren Plan.`;
  }

  if (message.includes('mehr termine') && message.includes('niemand antwortet')) {
    return `Verstehe. Schreibst du die Leute manuell an oder läuft da schon was automatisch?

Und bei welcher Plattform oder Leadquelle passiert das gerade?

Wenn ich das weiß, helfe ich dir, direkt die Antwortquote zu steigern.`;
  }

  if (message.includes('gar keine leads') && message.includes('durchstarten')) {
    return `Okay, dann bauen wir dich sauber auf. Sag mal: Wen willst du eigentlich erreichen?

Also Zielgruppe – wer genau? Sobald du das hast, helfe ich dir mit einem Starter-Plan für erste Leads in 7 Tagen.`;
  }

  if (message.includes('besser werden') && message.includes('umsetzen')) {
    return `Sauber. Sag mir: Was hält dich aktuell noch davon ab, richtig Gas zu geben?

Fehlt dir Klarheit, Struktur oder einfach Motivation?

Je nachdem, wo du stehst, bekommst du von mir einen Wochenplan – ganz simpel und direkt machbar.`;
  }

  // Zahlen-Erkennung für Kontakte
  const numbers = userMessage.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const contactCount = parseInt(numbers[0]);
    if (contactCount > 0) {
      return `Okay, ${contactCount} Kontakte sind schon mal eine gute Basis.

Und wie viele neue Leads kommen bei dir so pro Monat rein? Also durch Werbung, Empfehlungen oder was auch immer du machst?`;
    }
  }

  // Ja/Nein Antworten
  if (message.includes('ja') || message.includes('nein')) {
    return `Verstehe. Das hilft mir schon mal weiter.

Woher kommen deine Leads hauptsächlich? Facebook, Google, Immobilienportale oder eher über Empfehlungen?

Je nachdem kann ich dir unterschiedliche Strategien zeigen.`;
  }

  // Zeitangaben
  if (message.includes('monat') || message.includes('woche') || message.includes('jahr')) {
    return `Alright, das gibt mir schon ein gutes Bild.

Erzähl mir noch: Nutzt du schon irgendwelche Tools oder Systeme für dein Follow-up? Oder machst du alles manuell?

Dann kann ich dir genau sagen, wo du am meisten rausholen kannst.`;
  }

  // Lead-Quellen
  if (message.includes('facebook') || message.includes('google') || message.includes('portal') || message.includes('empfehlung')) {
    return `${userMessage} – okay, das sind gute Kanäle.

Letzte Frage: Nutzt du schon irgendwelche Automatisierungen für dein Follow-up? Also CRM, E-Mail-Sequenzen oder sowas?

Einfach ja oder nein reicht.`;
  }

  // Default Response
  return `Alright, lass uns das strukturiert angehen.

Ich brauch ein paar Infos von dir:

Wie viele alte Kontakte hast du ungefähr?
Wie viele neue kommen pro Monat dazu?
Woher kommen die meisten?

Dann kann ich dir genau sagen, wo du ansetzen solltest und was am meisten bringt.`;
};

// Erweiterte Logik für Follow-up Fragen
export const getContextualResponse = (
  userMessage: string, 
  conversationHistory: string[]
): string => {
  const message = userMessage.toLowerCase();
  const history = conversationHistory.join(' ').toLowerCase();

  // Wenn schon Kontaktzahlen bekannt sind
  if (history.includes('kontakte') && message.match(/\d+/)) {
    const numbers = userMessage.match(/\d+/g);
    if (numbers) {
      return `Perfekt, ${numbers[0]} neue pro Monat ist schon mal nicht schlecht.

Woher kommen die meisten? Facebook Ads, Google, Immobilienportale oder eher über Empfehlungen?`;
    }
  }

  // Wenn Lead-Quellen bekannt sind
  if (history.includes('facebook') || history.includes('google') || history.includes('portal')) {
    return `Verstehe. Und nutzt du schon Automatisierungen für dein Follow-up?

CRM-System, E-Mail-Sequenzen oder machst du noch alles manuell?`;
  }

  // Wenn Automatisierung geklärt ist
  if (history.includes('automatisierung') || history.includes('crm')) {
    return generateAnalysis(conversationHistory);
  }

  return getNuxResponse(userMessage);
};

// Analyse generieren basierend auf gesammelten Infos
const generateAnalysis = (conversationHistory: string[]): string => {
  const history = conversationHistory.join(' ').toLowerCase();
  
  // Zahlen extrahieren
  const numbers = history.match(/\d+/g);
  const oldContacts = numbers ? parseInt(numbers[0]) : 100;
  const newContacts = numbers && numbers[1] ? parseInt(numbers[1]) : 20;
  
  // Automatisierung prüfen
  const hasAutomation = history.includes('ja') || history.includes('crm') || history.includes('system');
  
  const totalContacts = oldContacts + newContacts;
  const conversionRate = hasAutomation ? 0.15 : 0.10;
  const potentialConversions = Math.round(totalContacts * conversionRate);
  const revenueEstimate = potentialConversions * 3500;

  return `Okay, hier ist deine Situation:

Du hast ${oldContacts} alte Kontakte rumliegen und ${newContacts} neue kommen pro Monat dazu. ${hasAutomation ? 'Du nutzt schon Automatisierungen, das ist gut.' : 'Du machst noch alles manuell.'}

Hier ist das Potenzial: Aus deinen ${totalContacts} Kontakten könntest du realistisch ${potentialConversions} Abschlüsse pro Monat machen. Das wären etwa ${revenueEstimate.toLocaleString('de-DE')} Euro Umsatz.

Dein 5-Schritte-Plan:

1. Kontakte sortieren
Teile deine ${oldContacts} alten Kontakte in heiß, warm und kalt ein

2. Personalisierte Reaktivierung
Individuelle Nachrichten je nach letztem Kontakt

3. Multi-Channel nutzen
E-Mail, WhatsApp, Telefon kombinieren

4. Mehrwert bieten
Kostenlose Marktanalysen als Türöffner

5. Follow-up ${hasAutomation ? 'optimieren' : 'automatisieren'}
${hasAutomation ? 'Deine bestehenden Systeme für bessere Conversion tunen' : 'CRM einführen für systematisches Nachfassen'}

Welchen Schritt willst du zuerst angehen?`;
};