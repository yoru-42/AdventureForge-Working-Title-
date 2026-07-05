
import { GoogleGenAI, Type, GenerateContentResponse, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import { ChatMessage, WorldSetting, Character, NPC, UserProfile } from "../types";

export const audioUtils = {
  encode: (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },
  decode: (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },
  decodeAudioData: async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
};

export class GeminiService {
  private static getAI() {
    // Return a mocked ai object that proxies requests to our local full-stack server
    return {
      models: {
        generateContent: async (reqArgs: any) => {
          if (reqArgs.model === 'gemini-2.5-flash-image') {
            const isNsfw = !!reqArgs.config?.safetySettings;
            const prompt = Array.isArray(reqArgs.contents?.parts) 
                ? reqArgs.contents.parts[0]?.text 
                : typeof reqArgs.contents === 'string' ? reqArgs.contents : reqArgs.contents?.text;

            const res = await fetch('/api/gemini/generateImage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, isNsfw })
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(errText);
            }
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              const bodyText = await res.text();
              throw new Error(`Server returned unexpected non-JSON response (${res.status}): ${bodyText.slice(0, 150)}...`);
            }
            const data = await res.json();
            if (data.error) {
              throw new Error(data.error);
            }
            
            let mimeType = 'image/png';
            let b64 = '';
            if (data.imageUrl && typeof data.imageUrl === 'string') {
               const parts = data.imageUrl.split(',');
               if (parts.length > 1) {
                  const match = parts[0].match(/:(.*?);/);
                  if (match) mimeType = match[1];
                  b64 = parts[1];
               }
            }

            return {
              text: '',
              candidates: [
                {
                  content: {
                    parts: [ { inlineData: { mimeType, data: b64 } } ]
                  }
                }
              ]
            };
          }

          // Otherwise handle standard text generation
          const res = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: reqArgs.model,
              contents: reqArgs.contents,
              config: reqArgs.config,
              isNsfw: !!reqArgs.config?.safetySettings
            })
          });
          if (!res.ok) {
            const errText = await res.text();
            let finalError = errText;
            try {
              const parsed = JSON.parse(errText);
              if (parsed.error) {
                finalError = parsed.error;
              } else if (parsed.message) {
                finalError = parsed.message;
              }
            } catch (_) {}
            throw new Error(finalError);
          }
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const bodyText = await res.text();
            throw new Error(`Server returned unexpected non-JSON response (${res.status}): ${bodyText.slice(0, 150)}...`);
          }
          const data = await res.json();
          // We return exactly what the caller code expects: response.text and response.candidates
          const text = typeof data.text === 'string' ? data.text : JSON.stringify(data.text);
          return {
            text,
            candidates: [
              {
                groundingMetadata: { groundingChunks: data.grounding || [] },
                content: { parts: [{ text }] }
              }
            ]
          };
        }
      }
    } as any;
  }

  private static parseJSONSafely(text: string, defaultValue: any) {
    if (!text) return defaultValue;
    try {
      return JSON.parse(text);
    } catch (e: any) {
      console.warn("JSON parse error, attempting to repair JSON. Error:", e.message);
      try {
        const repaired = jsonrepair(text);
        return JSON.parse(repaired);
      } catch (repairErr) {
        console.error("Could not repair JSON:", repairErr);
        return defaultValue;
      }
    }
  }

  private static getSafetySettings() {
    return [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];
  }

  private static async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errMsg = error?.message || (error ? String(error) : '');
      const isRateLimit = errMsg.includes('429') || 
                          errMsg.includes('503') ||
                          errMsg.toLowerCase().includes('high demand') ||
                          errMsg.toLowerCase().includes('temporarily unavailable') ||
                          errMsg.toLowerCase().includes('spikes in demand') ||
                          error?.status === 'RESOURCE_EXHAUSTED' || 
                          error?.status === 'UNAVAILABLE' ||
                          (error?.status && String(error.status).includes('429')) ||
                          (error?.status && String(error.status).includes('503'));
      
      if (retries > 0 && isRateLimit) {
        console.warn(`Rate limit / Overloaded hit, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  static async chat(history: ChatMessage[], systemInstruction: string, isNsfw?: boolean, summaryLog?: string) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      // Optimize token usage: keep the last 12 messages for conversation flow,
      // and append the prologue (the very first chat message) as reference.
      // The systemInstruction already contains all world, player and NPC profile info.
      const maxHistoryCount = 12;
      let historyToPass = history;
      let finalSystemInstruction = systemInstruction;

      if (history.length > maxHistoryCount) {
        if (history[0] && history[0].text) {
          finalSystemInstruction = `${systemInstruction}\n\nPROLOGUE AND STORY START:\n${history[0].text}\n[... Einige Ereignisse übersprungen für Kontext-Optimierung ...]\n`;
        }
        historyToPass = history.slice(-maxHistoryCount);
      }

      if (summaryLog) {
        finalSystemInstruction = `${finalSystemInstruction}\n\nCHRONIK DER BISHERIGEN WICHTIGEN EREIGNISSE (Kompakte Zusammenfassende Erinnerung):\n${summaryLog}\n`;
      }

      const contents = historyToPass.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: finalSystemInstruction,
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });
      
      return {
        text: response.text || '',
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    });
  }

  static async generateImage(prompt: string, isNsfw?: boolean) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    });
  }

  static async generatePrologue(world: WorldSetting, player?: Character): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      let playerContext = "";
      if (player && player.name) {
        playerContext = `
Der Hauptcharakter (Spieler) ist:
- Name: ${player.name}
- Rolle: ${player.role}
- Bio: ${player.bio}
- Aussehen: ${player.appearance?.gender || ''}, ${player.appearance?.age || ''} Jahre, ${player.appearance?.build || ''}
`;
      }

      const contextPrompt = `### WELTBESCHREIBUNG ODER ZEITLINIEN-PROMPT (Kontext für die Erstellung):
Achte STRENGSTENS auf den folgenden Welt- und Zeitlinienkontext für deine Generierung:
- Weltenname/Thema: "${world.title || ''}"
- Ära/Zeitpunkt der Story: "${world.era || ''}"
- Ton/Stimmung: "${world.tone || ''}"
- Welten-Beschreibung/Regeln: "${world.description || ''}"
Falls in der Welten-Beschreibung oder Ära spezielle Zeitpunkte genannt werden (wie z.B. "One Piece vor Thriller Bark Arc" oder "Nach dem Weltkrieg"), MUSS der Prolog historisch und inhaltlich exakt zu DIESEM Zeitpunkt passen! Beziehe dich bei der Generierung exakt auf diesen Story-Stand und diese Gegebenheiten.

${playerContext}

Aufgabe:
Generiere einen fesselnden, atmosphärischen und packenden Prolog für das Abenteuer auf DEUTSCH.
Der Prolog soll die Welt, den aktuellen Stand der Dinge zum angegebenen Zeitpunkt, die Atmosphäre und das Setting beschreiben, um den Spieler perfekt einzustimmen. Er sollte etwa 2-4 Absätze lang sein und im Präteritum oder Präsens verfasst werden. Verwende einen literarischen und ansprechenden Stil, der zum Ton/Stimmung der Welt passt.

WICHTIG:
- Du darfst NIEMALS beschreiben, was der Spieler/sein Charakter fühlt, denkt, spürt, empfindet oder wie sein Körper unwillkürlich reagiert.
- Es ist strengstens verboten zu schreiben: "Du spürst, wie sich eine eisige Kälte in deiner Brust ausbreitet", "lässt dein Herz einen Schlag aussetzen", "Deine Hände umklammern fester...", "Du spürst, wie die Farbe aus deinem Gesicht weicht", "Du musst jetzt reagieren" oder Ähnliches.
- Beschreibe ausschließlich die äußere Welt, die Atmosphäre, die NPCs und die objektiven Umstände. Der Spieler hat die absolute und alleinige Kontrolle über seine Gefühle und Reaktionen!

WICHTIG: Antworte NUR mit dem generierten Prologtext. Keinen JSON-Wrapper, kein "Hier ist dein Prolog", kein Markdown außer normalem Text mit Absätzen.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contextPrompt,
      });

      const text = response.text || '';
      return text.trim();
    });
  }

  static async generateFirstMessage(world: WorldSetting, player: Character, npcs: NPC[], prologue: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      let campaignPowerInstruction = '';
      if (world.campaignPowerSettings) {
        const powerDetails = Object.entries(world.campaignPowerSettings).map(([key, val]) => {
          if (val && typeof val === 'object') {
            const sMax = val.scaleMax ?? 100;
            return `- ${key}: Startwert: ${val.min}/${sMax}, Maximum: ${val.max}/${sMax}. Steigerungs-Logik: ${val.levelUpLogic}`;
          }
          return `- ${key}: ${val}/100`;
        }).join('\n');
        campaignPowerInstruction = `KAMPAGNEN-GRUNDWERTE (Kräftedifferenz):\n${powerDetails}\n`;
      }

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${world.title}".
${campaignPowerInstruction}WELT: ${world.description}

Schreibe die ERSTE Interaktion / Szene für den Spielercharakter (${player.name}).
Der Prolog war: ${prologue}

Deine Aufgabe:
Lass das Spiel beginnen. Sprich den Spieler direkt an, beschreibe, was er in diesem Moment sieht oder wer vor ihm steht, und gib ihm einen klaren Handlungsaufhänger, auf den er sofort reagieren kann. Halte es filmreif und erzähle im Präsens.

ANWEISUNGEN:
- Schreibe aus der Perspektive des Erzählers (Du-Perspektive für den Spieler).
- Lass NPCs agieren, falls anwesend.
- Keine Fragen am Ende wie "Was tust du?".
- Markiere Handlungen und Ausdrücke mit Sternchen (*schaut überrascht*).
- STRENGSTES VERBOT DER BEHERRSCHUNG/VORSCHREIBUNG VON GEFÜHLEN ODER REAKTIONEN DES NUTZERS:
  Du darfst NIEMALS beschreiben oder diktieren, was der Spieler/sein Charakter fühlt, denkt, spürt, empfindet oder wie sein Körper unwillkürlich reagiert. 
  Es ist absolut verboten zu schreiben: "Du spürst eine eisige Kälte", "dein Herz setzt einen Schlag aus", "deine Knöchel werden weiß", "deine Hände umklammern fester", "du spürst, wie die Farbe weicht" oder Ähnliches.
  Beschreibe nur die äußere, objektive Welt und das Verhalten von NPCs. Der Spieler hat die absolute und alleinige Hoheit über seine Gedanken, unwillkürlichen Körperreaktionen, Gefühle und Taten!`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: "Startszene generieren",
        config: {
          systemInstruction,
          temperature: 0.8,
          safetySettings: world.isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return response.text || '';
    });
  }

  static async generateCharacterPortrait(char: Character, world: WorldSetting) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Erstelle ein cineastisches Portrait-Bild für einen Charakter in der Welt "${world.title}".
      Charakter-Details:
      - Name: ${char.name}
      - Rolle: ${char.role}
      - Geschlecht: ${char.appearance.gender}
      - Alter: ${char.appearance.age}
      - Statur: ${char.appearance.build}
      - Haare: ${char.appearance.hairColor}
      - Augen: ${char.appearance.eyeColor}
      - Brust: ${char.appearance.cupSize}
      - Kleidung: ${char.appearance.outfit}
      Stil: Realistisch, detailliert, Fokus auf Gesicht und Oberkörper. Keine Schrift.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          },
          safetySettings: world.isNsfw ? this.getSafetySettings() : undefined
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    });
  }

  
  private static formatAbilities(data: any): string {
    let parts = [];
    if (data.powerSource || data.skills || data.techniques) {
      parts.push(`[Legacy] Quelle: ${data.powerSource || 'Unbekannt'}, Fähigkeiten: ${data.skills || 'Unbekannt'}, Techniken: ${data.techniques || 'Unbekannt'}`);
    }
    if (data.abilities && data.abilities.length > 0) {
      data.abilities.forEach((a: any, i: number) => {
        let techStr = a.techniques || 'Unbekannt';
        if (a.techniqueList && a.techniqueList.length > 0) {
          techStr = a.techniqueList.map((t: any) => `${t.name} [Typ: ${t.type || 'Angriff'}]: ${t.description || ''}`).join(', ');
        }
        parts.push(`[Kraft ${i+1}] Quelle: ${a.source || 'Unbekannt'}, Kosten: ${a.cost || 'Unbekannt'}, Detail: ${a.description || 'Unbekannt'}, Techniken: ${techStr}`);
      });
    }
    if (parts.length === 0) return 'Zufällig';
    return parts.join(' | ');
  }

  private static getCharacterSchema(powerSettings?: any) {
    const schema: any = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Der echte bürgerliche Name des Charakters (z.B. 'Sakazuki' statt 'Akainu', 'Kuzan' statt 'Aokiji', 'Borsalino' statt 'Kizaru', 'Monkey D. Ruffy' statt 'Strohhut')." },
        rufName: { type: Type.STRING, description: "Der kurze Name für Kampf- und Statusanzeigen (z.B. 'Akainu' bei Sakazuki, 'Ruffy' bei Monkey D. Ruffy, 'Garp' bei Monkey D. Garp, 'Mihawk' bei Dracule Mihawk)." },
        nickname: { type: Type.STRING, description: "Spitzname, Alias, Titel, Epitheton oder Codename des Charakters (z.B. 'Akainu' bei Sakazuki, 'Aokiji' bei Kuzan, 'Falkenauge' bei Mihawk, 'Helden-Marine' bei Garp)." },
        role: { type: Type.STRING },
        personality: { type: Type.STRING },
        bio: { type: Type.STRING, description: "Detaillierte Vergangenheit des Charakters. Alles, was hier steht, MUSS in der VERGANGENHEIT (Vorgeschichte vor Beginn des Spiels) liegen. Der Charakter darf KEINERLEI Wissen über das aktuelle Geschehen der Story oder die gegenwärtige Situation des Spielers besitzen." },
        currentSituation: { type: Type.STRING, description: "Was macht die Person gerade, bevor sie dem Spieler begegnet? Dies MUSS sich rein auf ihre eigene Vergangenheit oder ihren eigenen aktuellen Alltag beziehen, VÖLLIG UNABHÄNGIG vom Spieler. Sie darf nichts über die aktuelle Lage des Spielers wissen oder darauf Bezug nehmen!" },
        goal: { type: Type.STRING, description: "Was will die Person erreichen?" },
        powerSource: { type: Type.STRING, description: "Herkunft der Kraft, z.B. Teufelsfrucht, Mana, Chakra, Technologie." },
        powerCost: { type: Type.STRING, description: "Kosten oder Limitierungen der Kraft, z.B. Ausdauer, MP, Lebensenergie, Nebenwirkungen." },
        skills: { type: Type.STRING, description: "Die eigentliche Spezialfähigkeit oder Kraft detailliert beschrieben." },
        techniques: { type: Type.STRING, description: "Konkrete Techniken, Attacken oder Jutsus as kommagetrennte Liste." },
        techniqueList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name der Technik." },
              type: { type: Type.STRING, enum: ["Angriff", "Transformation", "Verteidigung", "Support"], description: "Fähigkeits-Typ: 'Angriff' für direkte Attacken, 'Transformation' für Gestaltwandel/Boosts, 'Verteidigung' für Schilde/Schutz, 'Support' für Heilung/Buffs." },
              description: { type: Type.STRING, description: "Detaillierte Erläuterung, was genau die Technik bewirkt." },
              subtype: { type: Type.STRING, description: "Untertyp, z.B. Einzelschuss, Flächenangriff, Absorber/Schild, Evasion/Ausweichen, Parade/Konter, Vollständig, Teilweise, Formwechsel/Stellung, Heilung/Regen." },
              tier: { type: Type.STRING, enum: ["Tier 1", "Tier 2", "Tier 3", "Tier 4"], description: "Die Stufe der Technik." },
              baseValue: { type: Type.INTEGER, description: "Der numerische Basiswert (z.B. 15 für Schaden, 20 für Heilung, 10 für Barriere)." },
              costFormula: { type: Type.STRING, enum: ["absolut", "proz."], description: "Ob der Ressourcen-Abzug absolut oder prozentual erfolgt." },
              costValue: { type: Type.INTEGER, description: "Die Menge an verbrauchter Ressource für diese Technik." },
              costResourceName: { type: Type.STRING, description: "Name der verbrauchten Ressource (z.B. Mana, Chakra, Ausdauer, Wut)." }
            },
            required: ["name", "type", "description", "subtype", "tier", "baseValue", "costFormula", "costValue", "costResourceName"]
          },
          description: "Eine Liste von konkreten Techniken mit Name, Typ, Untertyp, Tier, Basiswert, Kosten-Formel, Kostenwert und Energiequelle, basierend auf der Fähigkeit."
        },
        campaignPowerLevelsList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              parameterName: { type: Type.STRING, description: "Name des Parameters (z.B. Ninjutsu, Magie, Stärke, Willenskraft, der exakt in der campaignParametersList vorkommt)." },
              value: { type: Type.INTEGER, description: "Aktueller Startwert des Charakters." },
              potentialMax: { type: Type.INTEGER, description: "Das maximale Potenzial des Charakters." }
            },
            required: ["parameterName", "value", "potentialMax"]
          },
          description: "Die Machtstufen des Charakters für jeden der generierten Kampagnen-Parameter."
        },
         appearance: {
          type: Type.OBJECT,
          properties: {
            hairColor: { type: Type.STRING },
            eyeColor: { type: Type.STRING },
            age: { type: Type.STRING },
            build: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ["Männlich", "Weiblich"], description: "Geschlecht (Männlich, Weiblich) - zwingend korrekt setzen." },
            outfit: { type: Type.STRING, description: "Detaillierte Beschreibung der Kleidung." },
            cupSize: { type: Type.STRING, description: "Nur für weibliche Charaktere: Körbchengröße (z.B. 'C', 'D', 'DD', 'J'), bei männlichen '-'. WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Nami, Robin, etc.), verwende zwingend ihre offizielle kanonische Körbchengröße (z.B. 'J', 'I' etc.)!" },
            height: { type: Type.STRING, description: "Größe des Charakters (z.B. '175 cm'). WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Monkey D. Garp, Son Goku, etc.), MUSST du zwingend seine offizielle/kanonische Original-Größe eintragen (z.B. Monkey D. Garp ist '287 cm', Son Goku ist '175 cm', Charlotte Katakuri ist '509 cm', Whitebeard ist '666 cm', Kaido ist '710 cm', Big Mom ist '880 cm', Nico Robin ist '188 cm'). Verwende NIEMALS standardisierte oder geschätzte Werte, sondern immer die echten kanonischen Werte!" },
            measurements: { type: Type.STRING, description: "Körpermaße, z.B. 90-60-90. Bei männlichen '-'. WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Nami, Robin, etc.), verwende zwingend die offiziellen kanonischen Körpermaße (z.B. Nami hat '98-58-88', Nico Robin hat '100-60-90')!" },
            origin: { type: Type.STRING, description: "Herkunftsort oder Land" },
            family: { type: Type.STRING, description: "Familie oder Clan" },
            faction: { type: Type.STRING, description: "Zugehörige Fraktion oder Gilde" },
            race: { type: Type.STRING, description: "Rasse des Charakters, z.B. Mensch, Elf, Vampir" },
            raceFeatures: { type: Type.STRING, description: "Rassemerkmale wie Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe, Muster, Verteilung am Körper), ein Katzenkopf oder andere nicht-menschliche, tierische oder fantastische körperliche Abweichungen von der menschlichen Norm. Falls der Charakter ein gewöhnlicher Mensch ist, trage 'keine' ein." }
          },
          required: ["hairColor", "eyeColor", "age", "build", "gender", "outfit", "cupSize", "height", "measurements", "origin", "family", "faction", "race", "raceFeatures"]
        },
        relationship: { type: Type.STRING, description: "Beziehungen des Charakters zu anderen Charakteren oder Gruppierungen. WICHTIG: Er darf den Hauptcharakter/Spieler noch nicht getroffen haben (es sei denn, sie haben eine gemeinsame Vergangenheit wie Familie). Er darf absolut KEINERLEI Wissen über die aktuelle, gegenwärtige Situation des Spielers haben!" },
        conduct: { type: Type.STRING, description: "Das Verhalten des Charakters, wie er sich anderen gegenüber verhält." },
        relationships: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              targetCharacter: { type: Type.STRING, description: "Name des anderen Codex-Charakters oder NPCs, zu dem eine Beziehung besteht." },
              type: { type: Type.STRING, description: "Die Art der Beziehung (z.B. 'Mutter', 'Vater', 'Gefährte', 'Rivalin')." },
              behavior: { type: Type.STRING, description: "Das Verhalten zu diesem Charakter (z.B. 'Liebevoll und treusorgend', 'Respektvoll aber distanziert')." }
            },
            required: ["targetCharacter", "type", "behavior"]
          },
          description: "Strukturierte Beziehungen zu anderen Charakteren der Welt (Codex-Einträge oder NPCs). WICHTIG: Die Beziehungen beziehen sich rein auf die Vorgeschichte/Vergangenheit. Codex-Charaktere haben den Spieler in der Regel noch nicht getroffen und wissen nichts über seine aktuelle, gegenwärtige Situation!"
        },
        secretsStage1: { type: Type.STRING, description: "Stufe 1 (Öffentliches Wissen): Was ist allgemein über diese Person bekannt? Gerüchte oder oberflächliche Geheimnisse." },
        secretsStage2: { type: Type.STRING, description: "Stufe 2 (Indizien & Verdacht): Welche begründeten Gerüchte, versteckten Motive, Indizien oder Verdachtsmomente umgeben diese Person?" },
        secretsStage3: { type: Type.STRING, description: "Stufe 3 (Absolutes Geheimnis - Blackbox): Was ist das absolute Geheimnis dieser Person (z.B. wahre Herkunft, geheime Mission, Undercover-Identität), das absolut geheim bleiben MUSS?" }
      },
      required: ["name", "nickname", "role", "personality", "bio", "currentSituation", "goal", "powerSource", "powerCost", "skills", "techniques", "techniqueList", "appearance", "relationship", "conduct", "relationships", "secretsStage1", "secretsStage2", "secretsStage3"]
    };
    
    if (powerSettings && Object.keys(powerSettings).length > 0) {
      const powerProps: any = {};
      Object.keys(powerSettings).forEach(key => {
        const p = powerSettings[key];
        const minVal = p?.scaleMin ?? 0;
        const maxVal = p?.scaleMax ?? 100;
        powerProps[key] = {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.INTEGER, description: `Aktueller Wert (min ${minVal}, max ${maxVal})` },
            potentialMax: { type: Type.INTEGER, description: `Potenzielles Maximum (min ${minVal}, max ${maxVal})` }
          },
          required: ["value", "potentialMax"]
        };
      });
      schema.properties.campaignPowerLevels = {
        type: Type.OBJECT,
        properties: powerProps,
        required: Object.keys(powerSettings)
      };
      schema.required.push("campaignPowerLevels");
    }
    return schema;
  }

  static async generatePlayer(world: WorldSetting, existingData: Character, userProfile?: UserProfile, prologue?: string, existingFactions?: string[]) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const profileContext = userProfile ? `
      Der Spieler hinter diesem Charakter bevorzugt normalerweise:
      - Name: ${userProfile.name}
      - Typische Rolle: ${userProfile.preferredRole}
      - Hintergrund des Spielers: ${userProfile.bio}
      - Bevorzugtes Aussehen: ${userProfile.appearance.gender}, ${userProfile.appearance.age} Jahre, ${userProfile.appearance.build}
      - Haare/Augen: ${userProfile.appearance.hairColor} / ${userProfile.appearance.eyeColor}
      - Brust-Maß: ${userProfile.appearance.cupSize}
      ` : "";

      const prologueContext = prologue ? `\nProlog der Geschichte:\n${prologue}` : '';

      let factionInstruction = "";
      if (existingFactions && existingFactions.length > 0) {
        factionInstruction = `\nZugehörige Fraktionen in dieser Welt:\n${existingFactions.map(f => `- "${f}"`).join('\n')}\nWICHTIG: Achte zwingend darauf, für das Feld 'faction' (unter 'appearance') eine passende Fraktion aus der obigen Liste auszuwählen (nutze die EXAKTE Schreibweise), damit der Charakter sofort Mitglied dieser Fraktion wird. Falls absolut keine passt, wähle eine neue passende Fraktion.`;
      } else {
        factionInstruction = `\nWICHTIG: Falls es eine passende Fraktion, Gilde oder Gruppierung gibt, trage diese im Feld 'faction' (unter 'appearance') ein, damit er dieser sofort zugeordnet werden kann.`;
      }

      const prompt = `Vervollständige diesen Hauptcharakter für die Welt "${world.title}" (Epoche/Genre: ${world.era || 'Unbekannt'}, Stimmung: ${world.tone || 'Neutral'}).
      Welthintergrund: ${world.description}. ${prologueContext}
      ${profileContext}
      ${factionInstruction}
      
      Bereits bekannte Charakter-Daten (DIESE MÜSSEN ZWINGEND BEIBEHALTEN UND INTEGRIERT WERDEN):
      - Name: ${existingData.name || 'Unbekannt'}
      - Rolle: ${existingData.role || 'Unbekannt'}
      - Geschlecht: ${existingData.appearance.gender || 'Unbekannt'}
      - Alter: ${existingData.appearance.age || 'Unbekannt'}
      - Statur: ${existingData.appearance.build || 'Schlank'}
      - Haare: ${existingData.appearance.hairColor || 'Unbekannt'}
      - Augen: ${existingData.appearance.eyeColor || 'Unbekannt'}
      - Körbchen: ${existingData.appearance.cupSize || '-'}
      - Rasse: ${existingData.appearance.race || 'Unbekannt'}
      - Rassemerkmale (wie Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell, Fellmuster/farbe, Tierkopf, Flügel, Hörner, Schuppen etc.): ${existingData.appearance.raceFeatures || 'keine'}
      - Kleidung: ${existingData.appearance.outfit || 'Unbekannt'}
      - Persönlichkeit: ${existingData.personality || 'Unbekannt'}
      - Biografie: ${existingData.bio || 'Unbekannt'}
      - Kräfte & Fähigkeiten: ${GeminiService.formatAbilities(existingData)}
      - Ziel: ${existingData.goal || 'Unbekannt'}
      - Aktuelle Situation: ${existingData.currentSituation || 'Unbekannt'}
      
      Ergänze fehlende oder 'Unbekannt' markierte Daten (wie passende Bio, Kleidung, Ziel, Fähigkeiten, Kraftquelle, Techniken, Situation und Persönlichkeit) kreativ auf DEUTSCH und passe den Charakter in die oben genannte Welt und Prolog ein. Achte dabei auf ein korrektes Geschlecht und stimmige Details!
      
      ### WICHTIG FÜR TRANSFORMATIONEN & VERWANDLUNGEN (z.B. Gears, Super-Saiyajin, Bestien-Formen, Dämonen-Formen, Vampir-Metamorphosen):
      Falls dieser Charakter die Fähigkeit besitzt, sich zu verwandeln, seine Gestalt zu ändern oder eine temporäre Transformation zu aktivieren ODER falls die Beschreibung oder Welt eine Formänderung nahelegt:
      1. ERSTELLE EINE SPEZIELLE TECHNIK: Trage diese Verwandlung zwingend als eigenständige Technik/Attacke unter 'techniqueList' (und im Feld 'techniques') ein!
      2. DETAILLIERTE BESCHREIBUNG DER TRANSFORMATION: Beschreibe in dieser Technik extrem detailliert, wie die Verwandlung im Detail aussieht (Visuals, Aura, körperliche Veränderungen während der Transformation) und welche Kräfte/Fähigkeiten sie verleiht oder welche Kosten/Nachteile sie hat.
      3. PHYSISCHES PROFIL & KLEIDUNG UNBERÜHRT LASSEN (STRENGES VERBOT DER VERWECHSLUNG): Die Haupt-Aussehensfelder wie Größe (height), Körpermaße (measurements), Körbchengröße (cupSize), Haare (hairColor), Augen (eyeColor), Statur (build), Rasse (race) sowie das Outfit/Kleidung (outfit) MÜSSEN sich zwingend IMMER auf den NORMALEN, untransformierten Basis-Zustand des Charakters beziehen!
      - Überschreibe diese Felder NIEMALS mit den Attributen oder der Kleidung des transformierten Zustands. Alle körperlichen, visuellen und kleidungstechnischen Abweichungen der Transformation gehören ausschließlich in die Beschreibung der jeweiligen Technik in 'techniqueList'!`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: this.getCharacterSchema(world.campaignPowerSettings),
          safetySettings: world.isNsfw ? this.getSafetySettings() : undefined
        }
      });
      const data = this.parseJSONSafely(response.text || '{}', {});
      if (data.appearance?.gender) {
        data.appearance.gender = data.appearance.gender.charAt(0).toUpperCase() + data.appearance.gender.slice(1).toLowerCase();
      }
      return data;
    });
  }

  static async generateSingleNPC(world: WorldSetting, existingData?: Partial<NPC>, player?: Character, prologue?: string, existingFactions?: string[]) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const heroicContext = world.isHeroic !== false
        ? "Der Spieler ist ein Held. NPCs können ebenfalls außergewöhnlich sein."
        : "Dies ist eine bodenständige Geschichte. NPCs sollten normale Leute sein (Händler, Bauern, Wachen, etc.), keine übermächtigen Wesen.";

      const dramaContext = world.dramaLevel === 'Niedrig' 
        ? "NPCs sind überwiegend freundlich, hilfsbereit und bodenständig. Vermeide exzentrische oder manipulative Charaktere, es sei denn, es ist absolut notwendig."
        : world.dramaLevel === 'Hoch'
        ? "NPCs können exzentrisch, geheimnisvoll oder manipulativ sein. Sie haben oft eigene, komplexe Agenden."
        : "NPCs haben eine gesunde Mischung aus alltäglichen und interessanten Persönlichkeitszügen.";

      const playerContext = player ? `\nHauptcharakter (Spieler) in der Welt: ${player.name} (${player.role}). ${player.bio}` : '';
      const prologueContext = prologue ? `\nProlog der Geschichte:\n${prologue}` : '';
      
      const existingAppearance: any = existingData?.appearance || {};

      let factionInstruction = "";
      if (existingFactions && existingFactions.length > 0) {
        factionInstruction = `\nZugehörige Fraktionen in dieser Welt:\n${existingFactions.map(f => `- "${f}"`).join('\n')}\nWICHTIG: Achte zwingend darauf, für das Feld 'faction' (unter 'appearance') eine passende Fraktion aus der obigen Liste auszuwählen (nutze die EXAKTE Schreibweise), damit der Charakter sofort Mitglied dieser Fraktion wird. Falls absolut keine passt, wähle eine neue passende Fraktion.`;
      } else {
        factionInstruction = `\nWICHTIG: Falls es eine passende Fraktion, Gilde oder Gruppierung gibt, trage diese im Feld 'faction' (unter 'appearance') ein, damit er dieser sofort zugeordnet werden kann.`;
      }

      const prompt = `Vervollständige oder erstelle einen NPC für die Welt "${world.title}" (Epoche/Genre: ${world.era || 'Unbekannt'}, Stimmung: ${world.tone || 'Neutral'}).
      Welthintergrund: ${world.description}. ${prologueContext}${playerContext}
      ${heroicContext}
      ${dramaContext}
      ${factionInstruction}
      
      Bereits vorhandene Daten für diesen NPC (MÜSSEN UNBEDINGT BEIBEHALTEN UND SINNVOLL INTEGRIERT WERDEN):
      - Name: ${existingData?.name || 'Zufällig'}
      - Rolle: ${existingData?.role || 'Zufällig'}
      - Geschlecht: ${existingAppearance.gender || 'Zufällig'}
      - Alter: ${existingAppearance.age || 'Zufällig'}
      - Statur: ${existingAppearance.build || 'Zufällig'}
      - Haare: ${existingAppearance.hairColor || 'Zufällig'}
      - Augen: ${existingAppearance.eyeColor || 'Zufällig'}
      - Körbchen: ${existingAppearance.cupSize || '-'}
      - Kleidung: ${existingAppearance.outfit || 'Zufällig'}
      - Größe: ${existingAppearance.height || 'Zufällig'}
      - Maße: ${existingAppearance.measurements || '-'}
      - Herkunft: ${existingAppearance.origin || 'Zufällig'}
      - Familie: ${existingAppearance.family || 'Zufällig'}
      - Fraktion: ${existingAppearance.faction || 'Zufällig'}
      - Rasse: ${existingAppearance.race || 'Zufällig'}
      - Rassemerkmale (wie Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell, Fellmuster/farbe, Tierkopf, Flügel, Hörner, Schuppen etc.): ${existingAppearance.raceFeatures || 'keine'}
      - Gesinnung: ${existingData?.isHostile ? 'Feindselig' : 'Freundlich'}
      - Persönlichkeit: ${existingData?.personality || 'Zufällig'}
      - Biografie: ${existingData?.bio || 'Zufällig'}
      - Kräfte & Fähigkeiten: ${existingData ? GeminiService.formatAbilities(existingData) : 'Zufällig'}
      
      Falls bei den vorhandenen Daten 'Zufällig' oder leere Werte (bzw. '-') stehen, fülle diese kreativ, aber passend zum Rest (und zur Welt) aus.
      Erfinde dazu passende Kleidung, eine spannende Bio, eine aktuelle Situation, eine Persönlichkeit, besondere Fähigkeiten/Kräfte, Kraftquelle, Techniken, ein Ziel, das richtige Geschlecht (Männlich oder Weiblich), und (falls der Charakter weiblich ist oder gender 'Weiblich' ist) eine passende Körbchengröße (cupSize) auf DEUTSCH. Bei männlichen Charakteren setze bei cupSize '-' ein.
      
      ### STRENGSTES VERBOT VON WISSEN ÜBER DEN SPIELER (CODEX IST VERGANGENHEIT):
      - Alles im Codex und die Biografie des NPCs repräsentieren ausschließlich die VERGANGENHEIT (Vorgeschichte vor dem Abenteuer).
      - Der NPC darf unter 'currentSituation', 'bio', 'relationship', 'relationships' oder Geheimnissen absolut KEINERLEI Wissen über die gegenwärtige/aktuelle Situation des Spielers oder seine aktuellen Aktivitäten besitzen! Er hat ihn in der Regel noch nie getroffen und weiß unmöglich über seine aktuelle Lage Bescheid. Ihre Beziehungen/Begegnungen fangen erst im Hier und Jetzt an.
      
      ### WICHTIG FÜR TRANSFORMATIONEN & VERWANDLUNGEN (z.B. Gears, Super-Saiyajin, Bestien-Formen, Dämonen-Formen, Vampir-Metamorphosen):
      Falls dieser Charakter die Fähigkeit besitzt, sich zu verwandeln, seine Gestalt zu ändern oder eine temporäre Transformation zu aktivieren ODER falls die Beschreibung oder Welt eine Formänderung nahelegt:
      1. ERSTELLE EINE SPEZIELLE TECHNIK: Trage diese Verwandlung zwingend als eigenständige Technik/Attacke unter 'techniqueList' (und im Feld 'techniques') ein!
      2. DETAILLIERTE BESCHREIBUNG DER TRANSFORMATION: Beschreibe in dieser Technik extrem detailliert, wie die Verwandlung im Detail aussieht (Visuals, Aura, körperliche Veränderungen während der Transformation) und welche Kräfte/Fähigkeiten sie verleiht oder welche Kosten/Nachteile sie hat.
      3. PHYSISCHES PROFIL & KLEIDUNG UNBERÜHRT LASSEN (STRENGES VERBOT DER VERWECHSLUNG): Die Haupt-Aussehensfelder wie Größe (height), Körpermaße (measurements), Körbchengröße (cupSize), Haare (hairColor), Augen (eyeColor), Statur (build), Rasse (race) sowie das Outfit/Kleidung (outfit) MÜSSEN sich zwingend IMMER auf den NORMALEN, untransformierten Basis-Zustand des Charakters beziehen!
      - Überschreibe diese Felder NIEMALS mit den Attributen oder der Kleidung des transformierten Zustands. Alle körperlichen, visuellen und kleidungstechnischen Abweichungen der Transformation gehören ausschließlich in die Beschreibung der jeweiligen Technik in 'techniqueList'!`;

      const charSchema = this.getCharacterSchema(world.campaignPowerSettings);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            ...charSchema,
            properties: {
              ...charSchema.properties,
              isHostile: { type: Type.BOOLEAN }
            },
            required: [...charSchema.required, "isHostile"]
          },
          safetySettings: world.isNsfw ? this.getSafetySettings() : undefined
        }
      });
      const data = this.parseJSONSafely(response.text || '{}', {});
      if (data.appearance?.gender) {
        data.appearance.gender = data.appearance.gender.charAt(0).toUpperCase() + data.appearance.gender.slice(1).toLowerCase();
      }
      return data;
    });
  }

  static async generateNPCs(world: WorldSetting, count: number, player?: Character, prologue?: string, existingFactions?: string[]) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const heroicContext = world.isHeroic !== false
        ? "Die Geschichte ist heroisch. NPCs können vielfältig und mächtig sein."
        : "Die Geschichte ist bodenständig. Erstelle normale Leute aus dem Alltag (z.B. ein Schmied, eine Marktfrau, ein alter Soldat), die in diese Welt passen.";

      const dramaContext = world.dramaLevel === 'Niedrig' 
        ? "Erstelle bodenständige, normale Bürger. Sie sollten nicht unnötig exzentrisch oder manipulativ sein."
        : world.dramaLevel === 'Hoch'
        ? "Einige NPCs können exzentrisch sein oder eigene, verborgene Pläne verfolgen."
        : "Eine gute Mischung aus normalen Bürgern und interessanten Charakteren.";

      const playerContext = player ? `\nHauptcharakter (Spieler) in der Welt: ${player.name} (${player.role}). ${player.bio}` : '';
      const prologueContext = prologue ? `\nProlog der Geschichte:\n${prologue}` : '';

      let factionInstruction = "";
      if (existingFactions && existingFactions.length > 0) {
        factionInstruction = `\nZugehörige Fraktionen in dieser Welt:\n${existingFactions.map(f => `- "${f}"`).join('\n')}\nWICHTIG: Achte zwingend darauf, für das Feld 'faction' (unter 'appearance') bei den erstellten NPCs eine passende Fraktion aus der obigen Liste auszuwählen (nutze die EXAKTE Schreibweise), damit die NPCs sofort Mitglieder dieser Fraktion werden. Falls absolut keine passt, wähle eine neue passende Fraktion.`;
      } else {
        factionInstruction = `\nWICHTIG: Falls es eine passende Fraktion, Gilde oder Gruppierung gibt, trage diese im Feld 'faction' (unter 'appearance') der NPCs ein, damit diese sofort zugeordnet werden können.`;
      }

      const prompt = `Erstelle ${count} verschiedene NPCs für die Welt "${world.title}" (Epoche/Genre: ${world.era || 'Unbekannt'}, Stimmung: ${world.tone || 'Neutral'}).
      Welthintergrund: ${world.description}. ${prologueContext}${playerContext}
      ${heroicContext}
      ${dramaContext}
      ${factionInstruction}
      Jeder NPC braucht Kleidung, Bio, Situation, Fähigkeiten/Kräfte, Kraftquelle, Kraftkosten, Techniken, eine Persönlichkeit, ein Ziel, das Genaue Geschlecht (Männlich oder Weiblich), und (falls der Charakter weiblich ist oder gender 'Weiblich' ist) eine passende Körbchengröße (cupSize). Bei männlichen Charakteren setze bei cupSize '-' ein. Zudem MUSS jeder NPC eine definierte Beziehung zu anderen (relationship) sowie ein Verhaltensmuster anderen gegenüber (conduct) besitzen. Alles auf DEUTSCH.
      
      ### STRENGSTES VERBOT VON WISSEN ÜBER DEN SPIELER (CODEX IST VERGANGENHEIT):
      - Alles in der Bio, den Beziehungen und der Situation der NPCs repräsentiert die VERGANGENHEIT vor Beginn des Spiels. Sie dürfen den Spieler noch nicht getroffen haben (außer es gibt eine gemeinsame Vergangenheit wie Familie) und dürfen KEINERLEI Wissen über die gegenwärtige Situation des Spielers besitzen. Sie dürfen nicht über seine aktuelle Lage oder seine aktuellen Aktivitäten Bescheid wissen!
      
      ### WICHTIG FÜR TRANSFORMATIONEN & VERWANDLUNGEN (z.B. Gears, Super-Saiyajin, Bestien-Formen, Dämonen-Formen, Vampir-Metamorphosen):
      Falls ein NPC die Fähigkeit besitzt, sich zu verwandeln, seine Gestalt zu ändern oder eine temporäre Transformation zu aktivieren ODER falls die Beschreibung oder Welt eine Formänderung nahelegt:
      1. ERSTELLE EINE SPEZIELLE TECHNIK: Trage diese Verwandlung zwingend als eigenständige Technik/Attacke unter 'techniqueList' (und im Feld 'techniques') bei diesem NPC ein!
      2. DETAILLIERTE BESCHREIBUNG DER TRANSFORMATION: Beschreibe in dieser Technik extrem detailliert, wie die Verwandlung im Detail aussieht (Visuals, Aura, körperliche Veränderungen während der Transformation) und welche Kräfte/Fähigkeiten sie verleiht oder welche Kosten/Nachteile sie hat.
      3. PHYSISCHES PROFIL & KLEIDUNG UNBERÜHRT LASSEN (STRENGES VERBOT DER VERWECHSLUNG): Die Haupt-Aussehensfelder wie Größe (height), Körpermaße (measurements), Körbchengröße (cupSize), Haare (hairColor), Augen (eyeColor), Statur (build), Rasse (race) sowie das Outfit/Kleidung (outfit) MÜSSEN sich zwingend IMMER auf den NORMALEN, untransformierten Basis-Zustand des NPCs beziehen!
      - Überschreibe diese Felder NIEMALS mit den Attributen oder der Kleidung des transformierten Zustands. Alle körperlichen, visuellen und kleidungstechnischen Abweichungen der Transformation gehören ausschließlich in die Beschreibung der jeweiligen Technik in 'techniqueList'!`;

      const charSchema = this.getCharacterSchema(world.campaignPowerSettings);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              ...charSchema,
              properties: {
                ...charSchema.properties,
                isHostile: { type: Type.BOOLEAN }
              },
              required: [...charSchema.required, "isHostile"]
            }
          },
          safetySettings: world.isNsfw ? this.getSafetySettings() : undefined
        }
      });
      const data = this.parseJSONSafely(response.text || '[]', []);
      return data.map((n: any) => {
        if (n.appearance?.gender) {
          n.appearance.gender = n.appearance.gender.charAt(0).toUpperCase() + n.appearance.gender.slice(1).toLowerCase();
        }
        return n;
      });
    });
  }

  static async autofillAdventure(tags: string[], existingTitle?: string, existingDesc?: string, userProfile?: UserProfile, isNsfw?: boolean, playerBasis?: Character, isHeroic: boolean = true, dramaLevel: 'Niedrig' | 'Mittel' | 'Hoch' = 'Mittel') {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      const nsfwContext = isNsfw ? "NSFW-MODUS: Die Welt und die Charaktere können erwachsene Themen, explizite Beschreibungen und Romantik enthalten." : "";
      const heroicContext = isHeroic 
        ? "Der Spieler ist der HELD und das ZENTRUM der Geschichte. Die Welt dreht sich um ihn. NPCs können ebenfalls heroisch oder außergewöhnlich sein." 
        : "Der Spieler ist ein GEWÖHNLICHER BÜRGER (z.B. Bauernjunge, Wache, Schmied). Er ist NICHT das Zentrum der Welt. Auch die NPCs sollten überwiegend normale, bodenständige Leute sein, die ihren Alltag bestreiten. Die Geschichte sollte bodenständig und alltäglich beginnen.";

      const dramaContext = dramaLevel === 'Niedrig'
        ? "Konflikte sind minimal oder sehr bodenständig. NPCs sind überwiegend ehrlich und nicht manipulativ. Vermeide Klischees von exzentrischen Gelehrten, die den Spieler ausnutzen wollen."
        : dramaLevel === 'Hoch'
        ? "Viel Drama, Intrigen und exzentrische Charaktere. NPCs haben oft verborgene Motive."
        : "Ausgewogenes Drama mit einer Mischung aus ehrlichen und komplexen Charakteren.";

      let profileContext = "";
      if (playerBasis && playerBasis.name) {
        profileContext = `
        Der Hauptcharakter (Spieler) sollte auf diesen bereits eingegebenen Daten basieren:
        - Name: ${playerBasis.name}
        - Rolle: ${playerBasis.role}
        - Bio: ${playerBasis.bio}
        - Aussehen: ${playerBasis.appearance.gender}, ${playerBasis.appearance.age} Jahre, ${playerBasis.appearance.build}, Haare: ${playerBasis.appearance.hairColor}, Augen: ${playerBasis.appearance.eyeColor}, Körbchen: ${playerBasis.appearance.cupSize}
        `;
      } else if (userProfile) {
        profileContext = `
        Der Hauptcharakter (Spieler) sollte auf folgendem Profil basieren:
        - Name: ${userProfile.name}
        - Rolle: ${userProfile.preferredRole}
        - Hintergrund: ${userProfile.bio}
        - Aussehen: ${userProfile.appearance.gender}, ${userProfile.appearance.age} Jahre, ${userProfile.appearance.build}, Haare: ${userProfile.appearance.hairColor}, Augen: ${userProfile.appearance.eyeColor}, Körbchen: ${userProfile.appearance.cupSize}
        `;
      }

      let contextPrompt = `Generiere ein komplettes Textabenteuer-Setup auf DEUTSCH.
      Tags: ${tags.join(', ')}.
      Titel: ${existingTitle || 'Zufällig'}.
      Beschreibung: ${existingDesc || 'Zufällig'}. 
      ${nsfwContext}
      ${heroicContext}
      ${dramaContext}
      
      ${profileContext}
      
      WICHTIG: 
      1. Erfinde für jeden Charakter eine packende Vergangenheit (Bio), eine markante Persönlichkeit, ein klares Ziel, besondere Fähigkeiten/Jutsus (skills), das exakte Geschlecht (Männlich oder Weiblich), eine detaillierte Beschreibung der Kleidung (Outfit) und (falls weiblich) eine passende Körbchengröße (cupSize z.B. 'C', 'D'). Bei männlichen Charakteren setze bei cupSize '-' ein. Ebenso MUSS bei nicht-menschlichen Rassen (wie Tiermenschen, Elfen, Dämonen etc.) das Feld 'raceFeatures' (Rassemerkmale) detailreich befüllt werden (z.B. Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell, Fellmuster/farbe, Tierkopf, Flügel, Hörner, Schuppen etc. - also alle physischen Abweichungen von der menschlichen Norm). Bei normalen Menschen trage 'keine' ein.
      2. Der "player" Charakter MUSS die oben genannten Daten (Name, Aussehen etc.) übernehmen, aber passend in die Welt einbetten.
         - WICHTIG: Erstelle für den Hauptcharakter (player) KEINEN zusätzlichen Eintrag in der 'npcs'-Liste oder in der 'loreDatabase' unter der Kategorie 'Charaktere'! Er wird exklusiv separat im "player"-Feld definiert.
      3. Generiere nur genau so viele NPCs, wie in der Welten-Beschreibung erwähnt werden. Falls dort keine expliziten Charaktere vorkommen, erfinde ca. 1-3 passende NPCs.
         - WICHTIG: Der Hauptcharakter (player) darf niemals in der 'npcs'-Liste vorkommen!
      4. Generiere einen atmosphärischen Prolog, der die Szene setzt und die Welt beschreibt.
         - DER PROLOG DARF NIEMALS GEHEIMPLÄNE, SPOILER ODER DIE ECHTEN IDENTITÄTEN VON TARN-CHARAKTEREN VORWEGNEHMEN!
         - Falls die Geschichte von einer verdeckten Mission, einer Infiltration, Entführung oder Geheimagenten handelt, beschreibe im Prolog nur die sichtbare, scheinbar friedliche oder normale Atmosphäre (z.B. den prunkvollen Ball, die anderen Gäste, die Musik), ohne dem Leser/Spieler sofort zu verraten, wer getarnt ist und was geplant ist. Der Prolog muss für den Leser völlig spoilerfrei sein!
         - STRENGSTES VERBOT DER BEHERRSCHUNG/VORSCHREIBUNG VON GEFÜHLEN ODER UNWILLKÜRLICHEN KÖRPERREAKTIONEN DES NUTZERS:
           Sowohl im Prolog als auch in der Startszene ist es absolut verboten vorzuschreiben, was der Spieler/sein Charakter empfindet, denkt, fühlt oder wie sein Körper unwillkürlich reagiert. 
           Schreibe niemals Sätze wie: "lässt dein Herz einen Schlag aussetzen", "Deine Hände umklammern fester das Lehrbuch", "deine Knöchel werden weiß", "du spürst, wie die Farbe aus deinem Gesicht weicht", "du spürst, wie sich eine eisige Kälte in deiner Brust ausbreitet", "Du musst jetzt reagieren".
           Der Spieler hat die absolute und alleinige Hoheit über seine Gedanken, inneren Reaktionen, Gefühle, unwillkürlichen Reflexe und Taten! Beschreibe nur die äußere Umwelt, die Atmosphäre und das Verhalten von NPCs.
      5. Generiere "firstMessage", die allererste KI-Antwort nach dem Prolog, die den Spieler anredet oder eine erste direkte Interaktionsmöglichkeit in der Szene bietet (als Game Master geschrieben). Sie muss sich ebenfalls strikt an das Verbot der Fremdbestimmung von Gefühlen und unwillkürlichen Körperreaktionen halten!
      6. Befülle die "loreDatabase" (Lore-Datenbank) mit mindestens 6-10 Einträgen für diese Welt. EXTRAHIERE ZWINGEND ALLE in der Beschreibung genannten Charaktere (AUSSER dem Hauptcharakter "player"!), Orte, Fraktionen, Gegenstände und Konzepte als detaillierte Einträge. Jeder erwähnte Charakter (AUSSER dem Hauptcharakter "player") MUSS in der Lore-Datenbank als Kategorie "Charaktere" landen! Die Kategorien müssen exakt einer der vordefinierten Werte sein.
         WICHTIG: Wenn du Charaktere (im player-Feld, npcs-Feld oder in der loreDatabase unter der Kategorie 'Charaktere') erstellst, weise ihnen für das Feld 'faction' zwingend den exakten Namen einer der Fraktionen zu, die du in der 'loreDatabase' unter der Kategorie 'Fraktionen' erstellst! Dadurch werden sie sofort Mitglied dieser Fraktion.
      7. ZEITLICHE TRENNUNG (CODEX IST VERGANGENHEIT, WELTBESCHREIBUNG IST GEGENWART):
         - Der Codex (loreDatabase) sowie die 'npcs'-Liste beschreiben AUSSCHLIESSLICH die Vergangenheit (die Vorgeschichte vor Beginn des Spiels).
         - Die Welten-Beschreibung (existingDesc) und der Prolog setzen das HIER UND JETZT (den aktuellen Zeitpunkt und Anfang der Geschichte).
         - NPCs und Codex-Charaktere dürfen KEINERLEI Wissen über die aktuelle gegenwärtige Situation des Spielers besitzen oder darauf Bezug nehmen! Sie haben ihn in der Regel noch nie getroffen und wissen unmöglich über seine aktuelle Lage, Erlebnisse oder Pläne Bescheid. Ihre Biografien, 'currentSituation' und Beziehungen müssen sich vollkommen unabhängig vom aktuellen Story-Geschehen des Spielers gestalten.
      8. Generiere ein vollständiges Kampagnen-Regelsystem (Campaign Settings), das perfekt auf diese Welt abgestimmt ist!
         - Generiere 4-6 passende Kampagnen-Parameter (campaignParametersList) mit passenden Werten, Skalenbereichen (scaleMin/scaleMax, min/max), Level-Up-Logiken und Kategorien (physical oder supernatural).
         - Weise diesen Parametern konkrete Haupt-Kampfressourcen für Gesundheit (healthPowerNames) und Kosten-Ressourcen (costPowerNames) zu, und vergebe passende Labels für die Ressourcen (healthLabel und costLabel).
         - Erstelle 1-2 registrierte Spezial-Ressourcen (costResources) mit Start-Maximum (baseMax) und Zuweisung zu den speisenden Parametern.
         - Erstelle 1-2 Custom-Ressourcen-Effekte (customResourceMappings) mit Emojis und Kampfeffekten (z.B. Wut, Schild).
         - Definiere das Entwicklungstempo und die Logik für Techniken (techniqueProgressionLogic und techniqueProgressionRate).
         - Definiere 4-6 balancierte Technik-Regeln (techniqueRulesList) im Datenblatt für die verschiedenen Typen und Tiers, damit sie perfekt mit der Kraftquelle der Charaktere übereinstimmen!
         - Weise dem Spieler und allen NPCs im 'campaignPowerLevelsList'-Feld passende, realistische Startwerte für alle generierten Kampagnen-Parameter zu!`;

      const charSchema = this.getCharacterSchema();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tone: { type: Type.STRING },
              prologue: { type: Type.STRING },
              firstMessage: { type: Type.STRING },
              campaignParametersList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name des Parameters, z.B. Ninjutsu, Magie, Stärke, Willenskraft." },
                    min: { type: Type.INTEGER, description: "Der voreingestellte Startwert (Von) für Charaktere, z.B. 10." },
                    max: { type: Type.INTEGER, description: "Das voreingestellte Limit (Bis) für Charaktere, z.B. 80." },
                    scaleMin: { type: Type.INTEGER, description: "Das absolute Skala-Minimum des Systems, z.B. 0." },
                    scaleMax: { type: Type.INTEGER, description: "Das absolute Skala-Maximum des Systems, z.B. 100 oder 1000." },
                    levelUpLogic: { type: Type.STRING, description: "Muss exakt einer dieser Werte sein: 'EP-basiert (Gegnerstärke)', 'Nutzungsbasiert (Training)', 'Meilensteine', 'Statisch (Konstant)'" },
                    category: { type: Type.STRING, enum: ["physical", "supernatural"], description: "Kategorie des Attributs: 'physical' für körperliche/physische Stats, 'supernatural' für übernatürliche/magische Stats." }
                  },
                  required: ["name", "min", "max", "scaleMin", "scaleMax", "levelUpLogic", "category"]
                }
              },
              healthLabel: { type: Type.STRING, description: "Name der Lebensenergie-Anzeige, z.B. HP, LP, Vitalität, Gesundheit." },
              costLabel: { type: Type.STRING, description: "Name der Hauptkosten-Anzeige, z.B. Mana, Chakra, Ausdauer, Energie." },
              healthPowerNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Welche der Parameter-Namen die Gesundheit bestimmen." },
              costPowerNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Welche der Parameter-Namen die Kosten/Energie bestimmen." },
              costResources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name der Spezial-Ressource, z.B. Mana, Chakra, Ausdauer." },
                    sourcePowers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Welche der Parameter-Namen diese speisen." },
                    baseMax: { type: Type.INTEGER, description: "Standard-Maximalwert, z.B. 100." }
                  },
                  required: ["name", "sourcePowers", "baseMax"]
                }
              },
              customResourceMappings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name des Stat-Effekts, z.B. Wut, Schild, Fokus." },
                    icon: { type: Type.STRING, description: "Ein passendes Emoji-Icon, z.B. ⚡, 🛡️, 🌀." },
                    sourcePowers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Zugeordnete Parameter-Namen." },
                    baseMax: { type: Type.INTEGER },
                    effect: { type: Type.STRING, enum: ["regen", "shield", "dmg_buff", "cost_reduction", "rage", "evade", "power_source"] },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "icon", "sourcePowers", "baseMax", "effect", "description"]
                }
              },
              techniqueProgressionLogic: { type: Type.STRING, enum: ["ep", "training", "milestone", "static"] },
              techniqueProgressionRate: { type: Type.STRING, enum: ["slow", "normal", "fast", "extreme"] },
              techniqueRulesList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["Angriff", "Verteidigung", "Transformation", "Support"] },
                    subtype: { type: Type.STRING, description: "Der Untertyp, z.B. Einzelschuss, Flächenangriff, Absorber/Schild, Evasion/Ausweichen, Parade/Konter, Vollständig, Teilweise, Heilung/Regen." },
                    costResourceName: { type: Type.STRING, description: "Name der Kosten-Ressource (z.B. Mana, Chakra, Ausdauer)." },
                    costFormula: { type: Type.STRING, enum: ["absolut", "proz."] },
                    tier: { type: Type.STRING, enum: ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] },
                    baseValue: { type: Type.INTEGER, description: "Basis-Wert (z.B. Schaden, Heilung, Schildstärke)." },
                    scalingAndEffect: { type: Type.STRING, description: "Kurzer Text zum Balancing-Effekt." }
                  },
                  required: ["type", "subtype", "costResourceName", "costFormula", "tier", "baseValue", "scalingAndEffect"]
                }
              },
              player: charSchema,
              npcs: {
                type: Type.ARRAY,
                items: {
                  ...charSchema,
                  properties: {
                    ...charSchema.properties,
                    isHostile: { type: Type.BOOLEAN }
                  },
                  required: [...charSchema.required, "isHostile"]
                }
              },
              loreDatabase: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { 
                      type: Type.STRING, 
                      description: "Muss exakt einer dieser Werte sein: 'Charaktere', 'Orte', 'Fraktionen', 'Gegenstände', 'Fähigkeiten', 'Events', 'Weltregeln'" 
                    },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    details: {
                      type: Type.OBJECT,
                      description: "Je nach Kategorie passende Details, z.B. für Charaktere: role, gender, age, build, origin",
                        properties: {
                          role: { type: Type.STRING },
                          personality: { type: Type.STRING, description: "Persönlichkeit und Charaktereigenschaften des Charakters." },
                          currentSituation: { type: Type.STRING, description: "Was macht die Person zum aktuellen Zeitpunkt? Dies MUSS sich rein auf ihre eigene Vergangenheit oder ihren eigenen aktuellen Alltag beziehen (Vorgeschichte vor Beginn des Spiels), VÖLLIG UNABHÄNGIG vom Spieler. Sie darf nichts über die aktuelle Lage des Spielers wissen!" },
                          gender: { type: Type.STRING },
                          age: { type: Type.STRING },
                          build: { type: Type.STRING },
                          hairColor: { type: Type.STRING },
                          outfit: { type: Type.STRING },
                          goal: { type: Type.STRING },
                          skills: { type: Type.STRING },
                          height: { type: Type.STRING },
                          measurements: { type: Type.STRING },
                          cupSize: { type: Type.STRING },
                          origin: { type: Type.STRING },
                          family: { type: Type.STRING },
                          faction: { type: Type.STRING },
                          race: { type: Type.STRING },
                          type: { type: Type.STRING },
                          climate: { type: Type.STRING },
                          landmarks: { type: Type.STRING },
                          leader: { type: Type.STRING }
                        }
                    },
                    isUnlocked: { type: Type.BOOLEAN },
                    order: { type: Type.INTEGER },
                    secretsStage1: { type: Type.STRING, description: "Stufe 1 (Öffentliches Wissen): Was ist allgemein über diesen Eintrag bekannt?" },
                    secretsStage2: { type: Type.STRING, description: "Stufe 2 (Indizien & Verdacht): Gerüchte, Indizien oder Verdachtsmomente." },
                    secretsStage3: { type: Type.STRING, description: "Stufe 3 (Absolutes Geheimnis): Was ist das absolute Geheimnis (Blackbox), das anfangs geheim bleiben muss?" }
                  },
                  required: ["category", "title", "description", "isUnlocked", "secretsStage1", "secretsStage2", "secretsStage3"]
                }
              }
            },
            required: [
              "title", "description", "tone", "player", "npcs", "prologue", "firstMessage", "loreDatabase",
              "campaignParametersList", "healthLabel", "costLabel", "healthPowerNames", "costPowerNames",
              "costResources", "customResourceMappings", "techniqueProgressionLogic", "techniqueProgressionRate",
              "techniqueRulesList"
            ]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      const data = this.parseJSONSafely(response.text || '{}', {});
      if (data.player?.appearance?.gender) {
        data.player.appearance.gender = data.player.appearance.gender.charAt(0).toUpperCase() + data.player.appearance.gender.slice(1).toLowerCase();
      }
      if (data.npcs && Array.isArray(data.npcs)) {
        data.npcs = data.npcs.map((n: any) => {
          if (n.appearance?.gender) {
            n.appearance.gender = n.appearance.gender.charAt(0).toUpperCase() + n.appearance.gender.slice(1).toLowerCase();
          }
          return n;
        });
      }
      return data;
    });
  }

  static async autofillCampaignAndBalancingSettings(
    tags: string[],
    title: string,
    description: string,
    dramaLevel: 'Niedrig' | 'Mittel' | 'Hoch' = 'Mittel',
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();

      const nsfwContext = isNsfw ? "NSFW-MODUS: Erlaube reife Themen." : "";

      const contextPrompt = `Analysiere die folgende Rollenspielwelt und erstelle ein perfekt abgestimmtes, hochgradig balanciertes Kampagnen-Regelsystem (Campaign Settings) für die Schritte 2 und 3 der Welterstellung auf DEUTSCH.
      
      ### WELT DETAILS:
      - Titel: ${title || 'Zufällig'}
      - Genres / Tags: ${tags.join(', ')}
      - Beschreibung: ${description || 'Zufällig'}
      - Drama-Level / Konflikt-Intensität: ${dramaLevel}
      ${nsfwContext}

      ### GENERIERUNGS-REGELN & BALANCING:
      1. Generiere 4-6 passende Kampagnen-Parameter (campaignParametersList), die das Attribut-System definieren (z.B. Physische Stärke, Willenskraft, Magie-Konzentration, Geschicklichkeit, Konstitution, Seelenkraft, etc.). Weise jedem Parameter passendes min/max (Startwerte z.B. 10 bis 80) und das absolute Minimum/Maximum der Skala (z.B. scaleMin: 0, scaleMax: 100 oder 1000) sowie eine Kategorie ('physical' oder 'supernatural') und eine Level-Up-Logik ("EP-basiert (Gegnerstärke)", "Nutzungsbasiert (Training)", "Meilensteine", "Statisch (Konstant)") zu.
      2. Bestimme ein passendes Label für die Lebensenergie-Anzeige (healthLabel, z.B. HP, LP, Vitalität) und eines für die Hauptkosten-Anzeige (costLabel, z.B. MP, Mana, Chakra, Ausdauer, Energie).
      3. Weise diesen Ressourcen die speisenden Parameter zu (healthPowerNames und costPowerNames). Das müssen exakte Übereinstimmungen mit den Namen der generierten Kampagnen-Parameter sein.
      4. Erstelle 1-2 registrierte Spezial-Ressourcen (costResources) mit Start-Maximum (baseMax) und Zuweisung zu den speisenden Parametern.
      5. Erstelle 1-2 Custom-Ressourcen-Effekte (customResourceMappings) mit Emojis und Kampfeffekten (z.B. Wut, Schild, Fokus).
      6. Bestimme die optimale Progression-Logik für Techniken (techniqueProgressionLogic) und das Progression-Tempo (techniqueProgressionRate).
      7. Definiere 4-6 balancierte Technik-Regeln (techniqueRulesList) im Datenblatt für die verschiedenen Typen und Tiers (Angriff, Verteidigung, Transformation, Support), damit sie perfekt mit der Kraftquelle der Welt übereinstimmen! Bestimme vernünftige Werte für die Basiswerte (baseValue, z.B. Schaden, Heilung, Schildstärke) und formuliere kurze Erklärungen zum Balancing-Effekt (scalingAndEffect).
      
      Die Generierung muss inhaltlich hochqualitativ, spielmechanisch schlüssig und perfekt auf das Genre (Fantasy, Sci-Fi, Cyberpunk, Slice of Life, etc.) abgestimmt sein!`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              campaignParametersList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name des Parameters, z.B. Ninjutsu, Magie, Stärke, Willenskraft." },
                    min: { type: Type.INTEGER, description: "Der voreingestellte Startwert (Von) für Charaktere, z.B. 10." },
                    max: { type: Type.INTEGER, description: "Das voreingestellte Limit (Bis) für Chareraktere, z.B. 80." },
                    scaleMin: { type: Type.INTEGER, description: "Das absolute Skala-Minimum des Systems, z.B. 0." },
                    scaleMax: { type: Type.INTEGER, description: "Das absolute Skala-Maximum des Systems, z.B. 100 oder 1000." },
                    levelUpLogic: { type: Type.STRING, description: "Muss exakt einer dieser Werte sein: 'EP-basiert (Gegnerstärke)', 'Nutzungsbasiert (Training)', 'Meilensteine', 'Statisch (Konstant)'" },
                    category: { type: Type.STRING, enum: ["physical", "supernatural"], description: "Kategorie des Attributs: 'physical' für körperliche/physische Stats, 'supernatural' für übernatürliche/magische Stats." }
                  },
                  required: ["name", "min", "max", "scaleMin", "scaleMax", "levelUpLogic", "category"]
                }
              },
              healthLabel: { type: Type.STRING, description: "Name der Lebensenergie-Anzeige, z.B. HP, LP, Vitalität, Gesundheit." },
              costLabel: { type: Type.STRING, description: "Name der Hauptkosten-Anzeige, z.B. Mana, Chakra, Ausdauer, Energie." },
              healthPowerNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Welche der Parameter-Namen die Gesundheit bestimmen." },
              costPowerNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Welche der Parameter-Namen die Kosten/Energie bestimmen." },
              costResources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name der Spezial-Ressource, z.B. Mana, Chakra, Ausdauer." },
                    sourcePowers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Welche der Parameter-Namen diese speisen." },
                    baseMax: { type: Type.INTEGER, description: "Standard-Maximalwert, z.B. 100." }
                  },
                  required: ["name", "sourcePowers", "baseMax"]
                }
              },
              customResourceMappings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name des Stat-Effekts, z.B. Wut, Schild, Fokus." },
                    icon: { type: Type.STRING, description: "Ein passendes Emoji-Icon, z.B. ⚡, 🛡️, 🌀." },
                    sourcePowers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Zugeordnete Parameter-Namen." },
                    baseMax: { type: Type.INTEGER },
                    effect: { type: Type.STRING, enum: ["regen", "shield", "dmg_buff", "cost_reduction", "rage", "evade", "power_source"] },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "icon", "sourcePowers", "baseMax", "effect", "description"]
                }
              },
              techniqueProgressionLogic: { type: Type.STRING, enum: ["ep", "training", "milestone", "static"] },
              techniqueProgressionRate: { type: Type.STRING, enum: ["slow", "normal", "fast", "extreme"] },
              techniqueRulesList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["Angriff", "Verteidigung", "Transformation", "Support"] },
                    subtype: { type: Type.STRING, description: "Der Untertyp, z.B. Einzelschuss, Flächenangriff, Absorber/Schild, Evasion/Ausweichen, Parade/Konter, Vollständig, Teilweise, Heilung/Regen." },
                    costResourceName: { type: Type.STRING, description: "Name der Kosten-Ressource (z.B. Mana, Chakra, Ausdauer)." },
                    costFormula: { type: Type.STRING, enum: ["absolut", "proz."] },
                    tier: { type: Type.STRING, enum: ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] },
                    baseValue: { type: Type.INTEGER, description: "Basis-Wert (z.B. Schaden, Heilung, Schildstärke)." },
                    scalingAndEffect: { type: Type.STRING, description: "Kurzer Text zum Balancing-Effekt." }
                  },
                  required: ["type", "subtype", "costResourceName", "costFormula", "tier", "baseValue", "scalingAndEffect"]
                }
              }
            },
            required: [
              "campaignParametersList", "healthLabel", "costLabel", "healthPowerNames", "costPowerNames",
              "costResources", "customResourceMappings", "techniqueProgressionLogic", "techniqueProgressionRate",
              "techniqueRulesList"
            ]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async autofillCharacter(
    text: string, 
    powerSettings?: any, 
    existingCharacter?: any, 
    worldContext?: any, 
    existingFactions?: string[],
    existingCodexCharacters?: any[]
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      let contextPrompt = `Leite aus dem folgenden Freitext die Charakter-Werte für ein RPG ab.
WICHTIGSTE DIRECTIVE: Erfinde detailreich alle Details, Kräfte und Fähigkeiten, die fehlen oder nicht genau im Freitext beschrieben sind, passend für ein RPG. Jedes einzelne Feld MUSS befüllt werden!

### BEZIEHUNGEN & VERHALTEN (MANDATORISCH):
Befülle zwingend die Felder "relationship" (Beziehungen zu anderen Charakteren oder Gilden) und "conduct" (Verhalten anderen gegenüber). Erfinde hierbei emotionale Bezüge, Kameradschaften oder Fehden, damit der Charakter lebendig wirkt!

### RASSEMERKMALE / KÖRPERLICHE ABWEICHUNGEN (MANDATORISCH BEI FANTASY-RASSEN):
Achte extrem genau auf alle körperlichen Merkmale und Rasse-Eigenschaften, die nicht der menschlichen Norm entsprechen (z.B. Katzenohren, Schweif/Schwanz, Krallen, geschlitzte Augen, Fell, Fellfarbe oder Fellmuster am ganzen Körper oder an bestimmten Stellen, Tierkopf, tierisches Gesicht/Nase, Flügel, Hörner, Schuppen etc.).
- Trage all diese Merkmale zwingend detailgetreu und anschaulich in das Feld 'raceFeatures' (unter 'appearance') ein!
- Wenn der Charakter ein normaler Mensch ohne fantastische, tierische oder unnormale physische Eigenschaften ist, trage 'keine' ein.

### CODEX-ZEITLINIE & VERBOT VON GEGENWARTS-WISSEN (STRENGSTE DIRECTIVE):
- Alles in der Bio, der Situation (currentSituation) und den Beziehungen dieses Codex-Charakters repräsentiert ausschließlich die VERGANGENHEIT (die Vorgeschichte vor Beginn des Spiels).
- Der Charakter darf absolut KEINERLEI Wissen über die aktuelle gegenwärtige Situation des Nutzers/Spielers besitzen, darf ihn in der Regel noch nicht getroffen haben (außer es gibt eine explizite gemeinsame Familien- oder Vorgeschichte) und darf unmöglich über seine gegenwärtigen Aktivitäten Bescheid wissen! Alle Angaben müssen sich rein auf seinen eigenen Alltag und seine eigene Vorgeschichte beziehen.

### WICHTIG FÜR BEKANNTE FRANCHISE-CHARAKTERE (z.B. One Piece, Naruto, Dragon Ball, etc.):
Falls es sich bei der Person um einen bekannten fiktiven/Franchise-Charakter handelt (z.B. Sakazuki/Akainu, Monkey D. Garp, Monkey D. Ruffy, Dracule Mihawk, Nami, Nico Robin, Boa Hancock, Son Goku, Naruto Uzumaki, Sasuke Uchiha, etc.), MUSST du zwingend seine echten, offiziellen, kanonischen Original-Eigenschaften und kanonischen Beziehungsstrukturen verwenden!
- NAME VS SPITZNAME/ALIAS: Trage als eigentlichen Namen ('name' oder 'title') UNBEDINGT den bürgerlichen, echten Namen des Charakters ein (z.B. 'Sakazuki' statt 'Akainu', 'Kuzan' statt 'Aokiji', 'Borsalino' statt 'Kizaru', 'Dracule Mihawk' statt 'Falkenauge'). Trage den Codename/Spitzname (z.B. 'Akainu', 'Aokiji', 'Kizaru', 'Falkenauge') ausschließlich im Feld 'nickname' ein! Der 'rufName' is der am häufigsten verwendete Name (z.B. 'Akainu' bei Sakazuki, 'Mihawk' bei Dracule Mihawk). Bring das niemals durcheinander!
- GRÖSSE (height): Trage zwingend die exakte offizielle kanonische Größe ein (z.B. Sakazuki/Akainu ist '306 cm', Monkey D. Garp ist '287 cm', Dracule Mihawk ist '198 cm', Son Goku ist '175 cm', Whitebeard ist '666 cm', Kaido ist '710 cm', Big Mom ist '880 cm', Nico Robin ist '188 cm'). Erfinde oder schätze keine Standardgrößen wie 178 cm für diese Riesen!
- KÖRPERMASSE (measurements): Verwende zwingend die offiziellen Maße (z.B. Nami ist '98-58-88', Boa Hancock is '111-61-91', Nico Robin ist '100-60-90'). Bei männlichen Charakteren setze die korrekten, muskulösen Werte (z.B. bei einem riesigen Hünen wie Sakazuki/Akainu oder Garp setze muskulöse Proportionen wie '160-110-120', verwende auf keinen Fall schmale Normalwerte!).
- KÖRBCHENGRÖSSE (cupSize): Verwende die offizielle kanonische Körbchengröße (z.B. Nami ist 'J-Cup' oder 'J', Boa Hancock ist 'J-Cup' oder 'J', Nico Robin ist 'I-Cup' oder 'I'). Bei männlichen Charakteren setze '-'.
- ALTER (age), RASSE (race), Haare/Augen, Persönlichkeit & Bio: Alles muss präzise auf den echten kanonischen Stand gebracht werden!
- STRUKTURIERTE BEZIEHUNGEN & RÄNGE (relationships): Achte peinlichst genau darauf, wer wem weisungsbefugt oder überlegen ist! Garp ist ein Vizeadmiral (Vice Admiral) und Sakazuki (Akainu) als Admiral bzw. Großadmiral (Fleet Admiral) im Rang UNTERGEBEN. Garp ist also ein respektierter Kollege oder Untergebener, NIEMALS ein Vorgesetzter von Sakazuki! Mihawk ist ein Pirat und Shichibukai (Samurai der Meere) und steht absolut außerhalb der Marine-Hierarchie, er ist auf keinen Fall ein Vorgesetzter von Sakazuki oder der Marine! Überprüfe deine gesamte Wissensdatenbank zu dem jeweiligen Franchise, um extrem authentische, kanonisch korrekte Beziehungen zu erzeugen!

Erfinde spannende Fähigkeiten & Kräfte (skills), Herkunft der Kraft (powerSource) und Kosten/Limitierung (powerCost).

### WICHTIG FÜR TRANSFORMATIONEN & VERWANDLUNGEN (z.B. Gears, Super-Saiyajin, Bestien-Formen, Dämonen-Formen, Vampir-Metamorphosen):
Falls ein Charakter die Fähigkeit besitzt, sich zu verwandeln, seine Gestalt zu ändern oder eine temporäre Transformation zu aktivieren (wie z.B. Ruffy's Gears, Son Goku's Super-Saiyajin, Choppers Points, Narutos Kyuubi-Formen, Vampir-Fledermaus/Bestien-Gestalten, Werwolf-Transformationen, etc.) ODER falls der Eingabetext eine Formänderung, Verwandlung oder einen Power-Up-Zustand beschreibt:
1. ERSTELLE EINE SPEZIELLE TECHNIK: Trage diese Verwandlung zwingend als eigenständige Technik/Attacke unter 'techniqueList' (und im Feld 'techniques') ein!
2. DETAILLIERTE BESCHREIBUNG DER TRANSFORMATION: Beschreibe in dieser Technik extrem detailliert, wie die Verwandlung im Detail aussieht (Visuals, Aura, körperliche Veränderungen während der Transformation) und welche Kräfte/Fähigkeiten sie verleiht oder welche Kosten/Nachteile sie hat.
3. PHYSISCHES PROFIL & KLEIDUNG UNBERÜHRT LASSEN (STRENGES VERBOT DER VERWECHSLUNG): Die Haupt-Aussehensfelder wie Größe (height), Körpermaße (measurements), Körbchengröße (cupSize), Haare (hairColor), Augen (eyeColor), Statur (build), Rasse (race) sowie das Outfit/Kleidung (outfit) MÜSSEN sich zwingend IMMER auf den NORMALEN, untransformierten Basis-Zustand des Charakters beziehen!
- Überschreibe diese Felder NIEMALS mit den Attributen oder der Kleidung des transformierten Zustands (z.B. trage bei Ruffy seine normale Größe 174cm und seine normale Weste/Hose ein, und NICHT die kolossalen Maße oder den Dampfkranz von Gear 4; trage bei Goku seine normalen schwarzen Haare ein und NICHT die goldenen Super-Saiyajin-Haare).
- Alle körperlichen, visuellen und kleidungstechnischen Abweichungen der Transformation gehören ausschließlich in die Beschreibung der jeweiligen Technik in 'techniqueList'!

Erfinde zudem eine Liste von konkreten Techniken/Attacken (techniqueList) - für JEDE Technik gib einen prägnanten Namen und eine genaue Erklärung (Effekt, was genau die Technik macht) an! Erstelle mindestens 2 bis 4 coole Techniken.
Zusätzlich befülle das Feld 'techniques' mit den Namen dieser Techniken als kommagetrennte Liste.`;

      if (worldContext) {
        contextPrompt = `### WELTBESCHREIBUNG ODER ZEITLINIEN-PROMPT (Kontext für die Erstellung):
Achte STRENGSTENS auf den folgenden Welt- und Zeitlinienkontext für deine Generierung:
- Weltenname/Thema: "${worldContext.title || ''}"
- Ära/Zeitpunkt der Story: "${worldContext.era || ''}"
- Ton/Stimmung: "${worldContext.tone || ''}"
- Welten-Beschreibung/Regeln: "${worldContext.description || ''}"
Falls in der Welten-Beschreibung oder Ära spezielle Zeitpunkte genannt werden (wie z.B. "One Piece vor Thriller Bark Arc" oder "Nach dem Weltkrieg"), MUSS der Charakter, seine Kräfte, seine Kleidung sowie alle Lore-Einträge historisch und inhaltlich exakt zu DIESEM Zeitpunkt passen! Beziehe dich bei der Generierung von RPG-Lore oder Charakter-Fakten (und falls es bekannte Franchises sind, bei Details wie Ruffy oder anderen) genau auf diesen Story-Stand und diese Gegebenheiten. Schreibe alle Kräfte, Kleidung, Zugehörigkeiten und Charakteristiken so, wie sie für diesen Zeitpunkt korrekt waren.

` + contextPrompt;
      }

      let factionInstruction = "";
      if (existingFactions && existingFactions.length > 0) {
        factionInstruction = `\n\n### ZUGEHÖRIGE FRAKTIONEN IN DIESER WELT:
${existingFactions.map(f => `- "${f}"`).join('\n')}
WICHTIG: Achte zwingend darauf, für das Feld 'faction' (unter 'appearance') eine passende Fraktion aus der obigen Liste auszuwählen (nutze die EXAKTE Schreibweise), damit der Charakter sofort Mitglied dieser Fraktion wird. Falls absolut keine passt, wähle eine neue passende Fraktion.`;
      } else {
        factionInstruction = `\n\nWICHTIG: Falls es eine passende Fraktion, Gilde oder Gruppierung gibt, trage diese im Feld 'faction' (unter 'appearance') ein, damit er dieser sofort zugeordnet werden kann.`;
      }
      contextPrompt += factionInstruction;

      if (existingCharacter) {
        contextPrompt += `\n\n### BESTEHENDE DATEN (Ergänzungs-Modus aktiv):
Es existieren bereits Charakter-Daten. Integriere/behalte diese Werte weitestgehend bei und ergänze/erweitere sie um die neuen Informationen aus dem Text. Überschreibe KEINE bestehenden, ausgefüllten und sinnvollen Werte (z.B. Bio, Rolle, Name, Aussehen, Kräfte), außer der neue Freitext verlangt dies explizit. Führe bestehende und neue Informationen (wie neue Techniken oder neue Details in der Bio) elegant auf Deutsch zusammen!
Aktuelle Werte:
- Name: "${existingCharacter.name || ''}"
- Rolle: "${existingCharacter.role || ''}"
- Persönlichkeit: "${existingCharacter.personality || ''}"
- Bio: "${existingCharacter.bio || ''}"
- Aktuelle Situation: "${existingCharacter.currentSituation || ''}"
- Ziel: "${existingCharacter.goal || ''}"
- Kraftquelle: "${existingCharacter.powerSource || ''}"
- Kraftkosten: "${existingCharacter.powerCost || ''}"
- Spezialfähigkeit (skills): "${existingCharacter.skills || ''}"
- Techniken: "${existingCharacter.techniques || ''}"
- Beziehung: "${existingCharacter.relationship || ''}"
- Verhalten: "${existingCharacter.conduct || ''}"
- Aussehen: Rasse "${existingCharacter.appearance?.race || ''}", Alter "${existingCharacter.appearance?.age || ''}", Gender "${existingCharacter.appearance?.gender || ''}", Statur "${existingCharacter.appearance?.build || ''}", Haare "${existingCharacter.appearance?.hairColor || ''}", Augen "${existingCharacter.appearance?.eyeColor || ''}", Kleidung "${existingCharacter.appearance?.outfit || ''}"`;
      }

      if (powerSettings && Object.keys(powerSettings).length > 0) {
        contextPrompt += `\n\nBefülle ebenfalls ALLE folgenden Macht-Attribute (campaignPowerLevels) mit passenden, realistischen Werten (value und potentialMax) für diesen Charakter:`;
        Object.entries(powerSettings).forEach(([key, val]: [string, any]) => {
          const minVal = val?.scaleMin ?? 0;
          const maxVal = val?.scaleMax ?? 100;
          contextPrompt += `\n- Attribut "${key}": Wert zwischen ${minVal} und ${maxVal}, und maximales Potenzial ebenfalls zwischen ${minVal} und ${maxVal}.`;
        });
      }

      if (existingCodexCharacters && existingCodexCharacters.length > 0) {
        contextPrompt += `\n\n### BEREITS EXISTIERENDE CHARAKTERE IM CODEX / NPCs (WICHTIG FÜR BEZIEHUNGEN & VERGANGENHEIT):
Es gibt bereits registrierte Charaktere/NPCs in dieser Welt. Analysiere diese sorgfältig!
Falls einer dieser Charaktere als Familie des Spielers deklariert ist (z.B. im Feld "family" steht sowas wie "Mutter von [Name]" oder im Name/Beschreibung steht eine Verwandtschaft wie "Mutter") ODER falls du aus dem neuen Eingabetext ("${text}") eine Verwandtschaft oder Beziehung erkennst:
- Integriere diese Verwandten (z.B. Mutter, Vater, Schwester, etc.) zwingend und detailreich in die Vergangenheit/Vorgeschichte (Feld "bio") des Spielers. Erwähne, wer diese Person ist, wie das Verhältnis war und welchen Einfluss sie hatte.
- Erstelle IMMER einen ausgefüllten Eintrag für diese Charaktere in den Feldern "relationship" (Beziehungen zu anderen) und "conduct" (Verhalten zu anderen). Beschreibe konkret, wie das Verhältnis zu ihnen ist (z.B. liebevoll, distanziert, respektvoll, feindselig).
- Verwende die Namen der bestehenden Codex-Charaktere exakt so, wie sie hier gelistet sind.

Hier sind die bestehenden Charaktere:
${existingCodexCharacters.map(c => `- Name: "${c.name}"
  * RPG-Rolle: "${c.role || 'Unbekannt'}"
  * Familie/Zugehörigkeit: "${c.family || 'Keine'}"
  * Beziehung/Verhalten/Details: "${c.relation || c.description || 'Keine Angabe'}"`).join('\n')}`;
      }

      contextPrompt += `\n\nText: "${text}"\n`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: this.getCharacterSchema(powerSettings)
        }
      });

      const data = this.parseJSONSafely(response.text || '{}', {});
      if (data.appearance?.gender) {
        data.appearance.gender = data.appearance.gender.charAt(0).toUpperCase() + data.appearance.gender.slice(1).toLowerCase();
      }
      return data;
    });
  }

  static async autofillLoreEntry(
    text: string, 
    category: string, 
    powerSettings?: any, 
    playerName?: string, 
    existingNames?: string[],
    existingEntry?: any,
    worldContext?: any,
    existingFactions?: string[]
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      let contextPrompt = `Erstelle einen hochpräzisen, packenden und detailreichen RPG-Lore-Eintrag aus dem folgenden Text für die Kategorie "${category}".
WICHTIGSTE DIRECTIVEN:
1. Der 'title' MUSS ausschließlich der kurze Name des Eintrags sein (z. B. 'Torben' bei einem Charakter, 'Katana des Winds' bei einem Gegenstand). Niemals den ganzen Text oder eine lange Beschreibung in das Feld 'title' kopieren!
2. Die 'description' MUSS eine packend geschriebene, detailreiche Hintergrundgeschichte oder Ausarbeitung auf Deutsch sein (mindestens 1-2 Absätze). Kopiere hier nicht den rohen Ausgangstext, sondern formuliere eine fesselnde Beschreibung dritter Personen oder historischer Art.
3. Befülle unter 'details' ausnahmslos ALLE angeforderten Attribute! Falls bestimmte Werte im Text nicht vorhanden sind, ERFINDE fantastische, kreative und passende RPG-Details, die zur Kategorie passen! Lass kein einziges Feld der angeforderten Details leer oder unvollständig.
4. Schreibe alle Antworten auf Deutsch.`;

      if (worldContext) {
        contextPrompt = `### WELTBESCHREIBUNG ODER ZEITLINIEN-PROMPT (Kontext für die Erstellung):
Achte STRENGSTENS auf den folgenden Welt- und Zeitlinienkontext für deine Generierung:
- Weltenname/Thema: "${worldContext.title || ''}"
- Ära/Zeitpunkt der Story: "${worldContext.era || ''}"
- Ton/Stimmung: "${worldContext.tone || ''}"
- Welten-Beschreibung/Regeln: "${worldContext.description || ''}"
Falls in der Welten-Beschreibung oder Ära spezielle Zeitpunkte genannt werden (wie z.B. "One Piece vor Thriller Bark Arc" oder "Nach dem Weltkrieg"), MUSS der Charakter, seine Kräfte, seine Kleidung sowie alle Lore-Einträge historisch und inhaltlich exakt zu DIESEM Zeitpunkt passen! Beziehe dich bei der Generierung von RPG-Lore oder Charakter-Fakten (und falls es bekannte Franchises sind, bei Details wie Ruffy oder anderen) genau auf diesen Story-Stand und diese Gegebenheiten. Schreibe alle Kräfte, Kleidung, Zugehörigkeiten und Charakteristiken so, wie sie für diesen Zeitpunkt korrekt waren.

` + contextPrompt;
      }

      if (existingEntry) {
        contextPrompt += `\n\n### BESTEHENDE DATEN (Ergänzungs-Modus aktiv):
Es existiert bereits ein Lore-Eintrag mit folgenden Werten. Integriere/behalte diese Werte weitestgehend bei und ergänze/erweitere sie um die neuen Informationen aus dem Text. Überschreibe KEINE bestehenden, sinnvollen und ausgefüllten Werte, außer der neue Freitext verlangt dies explizit. Führe bestehende und neue Informationen elegant auf Deutsch zusammen!
Aktuelle Werte:
- Titel (title): "${existingEntry.title || ''}"
- Beschreibung (description): "${existingEntry.description || ''}"`;
        if (existingEntry.details) {
          contextPrompt += `\n- Vorhandene Details:\n${JSON.stringify(existingEntry.details)}`;
        }
      }

      if (category === 'Charaktere') {
        contextPrompt += `
Für Charaktere:
- STRENGSTES VERBOT VON GEGENWARTS-WISSEN (CODEX IST VERGANGENHEIT):
  Die Biografie, Geheimnisse, Beziehungen und Situation dieses Codex-Charakters repräsentieren ausschließlich die VERGANGENHEIT (Vorgeschichte vor Beginn des Spiels).
  Er darf absolut KEINERLEI Wissen über die aktuelle, gegenwärtige Situation des Spielers besitzen oder darauf Bezug nehmen! Er hat den Spieler in der Regel noch nie getroffen und weiß unmöglich über seine aktuelle Lage Bescheid. Alle Angaben müssen sich rein auf seinen eigenen Alltag und seine eigene Vorgeschichte beziehen.
- WICHTIG FÜR BEKANNTE FRANCHISE-CHARAKTERE (z.B. Monkey D. Garp, Nami, Boa Hancock, Nico Robin, Son Goku, Naruto Uzumaki, Sasuke Uchiha, etc.): Falls es sich bei der Person um einen bekannten fiktiven/Franchise-Charakter handelt, MUSST du zwingend seine echten, offiziellen, kanonischen Original-Eigenschaften verwenden!
  * Größe (height): z.B. '287 cm' für Monkey D. Garp, '175 cm' für Goku, '188 cm' für Robin, '170 cm' für Nami, '191 cm' für Boa Hancock. Verwende niemals Standard-Durchschnittswerte!
  * Körpermaße (measurements): z.B. '98-58-88' für Nami, '100-60-90' für Robin. Bei männlichen Charakteren '-'.
  * Körbchengröße (cupSize): z.B. 'J' oder 'J-Cup' für Nami, 'I' oder 'I-Cup' für Robin. Bei männlichen Charakteren '-'.
  * Alter, Rasse, Bio & Persönlichkeit müssen ebenfalls genau den kanonischen Fakten entsprechen!
- Erfinde detailreiche Fähigkeiten/Kräfte (skills), Kraftquellen (powerSource), Kosten/Limitierungen (powerCost).
- Erfinde eine Liste von konkreten Techniken (techniqueList) - für JEDE Technik gib einen prägnanten Namen und eine genaue Erklärung (Effekt, was genau die Technik macht) an! Erstelle mindestens 2 bis 4 coole Techniken.
- Befülle das Feld 'techniques' ebenfalls mit einer kommagetrennten Liste der Techniknamen.`;

        if (existingFactions && existingFactions.length > 0) {
          contextPrompt += `\n- Zugehörige Fraktionen in dieser Welt: ${existingFactions.map(f => `"${f}"`).join(', ')}.
  WICHTIGSTES GEBOT FÜR DIE FRAKTIONSMITGLIEDSCHAFT:
  Wähle für das Feld 'faction' (unter 'details') unbedingt eine passende Fraktion aus der obigen Liste aus (nutze die EXAKTE Schreibweise), damit dieser Charakter sofort als Mitglied dieser Fraktion zugeordnet wird! Falls absolut keine passt, kannst du eine neue passende Fraktion erfinden.`;
        } else {
          contextPrompt += `\n- Falls der Charakter einer Fraktion, Gilde oder Gruppierung angehört, trage diese im Feld 'faction' (unter 'details') ein.`;
        }

        if (playerName) {
          contextPrompt += `\n- Der Name des Hauptcharakters/Spielers lautet: "${playerName}".
  WICHTIGSTE REGEL ZUM PERSONENBEZUG:
  Wenn der eingegebene Text beschreibt, dass dieser neue Charakter mit "${playerName}" verwandt ist (z. B. "er ist der Großvater von ${playerName}", "mein Vater", "mein Großvater", etc.) oder ein Freund von ihm ist, darf der Name "${playerName}" NIEMALS als Name ('title') dieses neuen Eintrags verwendet werden!
  Bestimme den Namen der anderen Person (z.B. des Großvaters/Freundes), die den eigentlichen Inhalt dieser neuen Karte darstellt. Falls im Text kein Name für diese andere Person genannt wird, ERFINDE einen passenden RPG-Vornamen (z.B. 'Albus', 'Garrick', 'Valerius' oder 'Sariel') für diese Person und verwende ihn als 'title'.
  
- WICHTIG FÜR STRUKTURIERTE BEZIEHUNGEN (relationships):
  Falls im Text Beziehungen beschrieben werden (z.B. "Mutter von ${playerName}" oder "Mutter vom Nutzer"), erstelle zwingend einen Eintrag im Array 'relationships'. Setze 'targetCharacter' auf den exakten Namen des Hauptcharakters ("${playerName}") oder des anderen Charakters, 'type' auf die Beziehungsart (z.B. 'Mutter') und 'behavior' auf das Verhalten (z.B. 'Liebevoll, beschützerisch').`;
        }

        if (existingNames && existingNames.length > 0) {
          contextPrompt += `\n- Folgende andere Charaktere/Codex-Einträge existieren bereits in der Welt: ${existingNames.map(n => `"${n}"`).join(', ')}. Achte darauf, diese bestehenden Namen nicht versehentlich als Namen (title) für diesen neuen Charakter zu wählen, falls sie nur als Beziehung im Text erwähnt werden.`;
        }
        
        if (powerSettings && Object.keys(powerSettings).length > 0) {
          contextPrompt += `\n- Befülle ebenfalls ALLE statistischen Macht-Werte (campaignPowerLevels) mit passenden RPG-Werten (value & potentialMax) für diesen Charakter:`;
          Object.entries(powerSettings).forEach(([key, val]: [string, any]) => {
            const minVal = val?.scaleMin ?? 0;
            const maxVal = val?.scaleMax ?? 100;
            contextPrompt += `\n  * Attribut "${key}": Wert zwischen ${minVal} und ${maxVal}, Potenzial ebenfalls zwischen ${minVal} und ${maxVal}.`;
          });
        }
      } else if (category === 'Events') {
        contextPrompt += `
Für Events/Kapitel:
- Zerlege den Story-Ablauf in chronologische Teilschritte (Stationen) im Array 'eventSteps'.
- Jede Station MUSS einen prägnanten Titel ("title") und eine genaue Beschreibung des Ablaufs ("description") haben.
- Setze den Status ("status") jeder Station auf 'planned'.`;
      }

      contextPrompt += `\n\nText: "${text}"\n`;

      const detailsProperties: any = {};
      const requiredFields: string[] = [];

      if (category === 'Charaktere') {
        Object.assign(detailsProperties, {
          rufName: { type: Type.STRING, description: "Der kurze Name oder Rufname des Charakters für Kampf- und Statusanzeigen (z.B. 'Akainu' bei Sakazuki, 'Ruffy' bei Monkey D. Ruffy, 'Goku' bei Son Goku, 'Garp' bei Monkey D. Garp)." },
          role: { type: Type.STRING, description: "Beruf oder RPG-Rolle (z. B. 'Söldner', 'Eismagierin', 'Dieb')." },
          nickname: { type: Type.STRING, description: "Spitzname, Alias, Titel, Epitheton oder Codename des Charakters (z. B. 'Akainu' bei Sakazuki, 'Aokiji' bei Kuzan, 'Falkenauge' bei Mihawk, 'Helden-Marine' bei Garp)." },
          personality: { type: Type.STRING, description: "Persönlichkeit und Charaktereigenschaften des Charakters." },
          currentSituation: { type: Type.STRING, description: "Was macht die Person zum aktuellen Zeitpunkt?" },
          gender: { type: Type.STRING, description: "Geschlecht (MUSS exakt einer dieser Werte sein: 'Männlich', 'Weiblich', 'Divers', 'Nicht-Binär', 'Androgyn', 'Unbekannt')." },
          age: { type: Type.STRING, description: "Alter als Zahl oder Angabe (z. B. '23', 'Über 100')." },
          build: { type: Type.STRING, description: "Körperbau (MUSS exakt einer dieser Werte sein: 'Schlank', 'Sportlich', 'Muskulös', 'Kräftig', 'Zierlich', 'Drahtig', 'Kurvig', 'Stämmig', 'Hager', 'Unbekannt')." },
          hairColor: { type: Type.STRING, description: "Haare (z. B. 'Langes, silbernes Haar' oder 'Kurze schwarze Locken')." },
          eyeColor: { type: Type.STRING, description: "Augenfarbe (z. B. 'Stechend rot' oder 'Tiefblau')." },
          outfit: { type: Type.STRING, description: "Kleidung/Rüstung (z. B. 'Edler weißer Magier-Umhang' oder 'Lederpanzer')." },
          height: { type: Type.STRING, description: "Größe (z. B. '175cm'). WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Monkey D. Garp, Son Goku, etc.), MUSST du zwingend seine offizielle/kanonische Original-Größe eintragen (z.B. Monkey D. Garp ist '287 cm', Son Goku ist '175 cm', Charlotte Katakuri ist '509 cm', Whitebeard ist '666 cm', Kaido ist '710 cm', Big Mom ist '880 cm', Nico Robin ist '188 cm')." },
          measurements: { type: Type.STRING, description: "Körpermaße (z. B. '90-60-90' oder 'Unbekannt'). Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Nami, Robin, etc.), verwende zwingend die offiziellen kanonischen Körpermaße (z.B. Nami hat '98-58-88', Nico Robin hat '100-60-90')!" },
          cupSize: { type: Type.STRING, description: "Körbchengröße bei weiblichen/androgynen Charakteren (MUSS exakt einer dieser Werte sein: '-', 'AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K' oder höher. Bei bekannten Charakteren nimm deren offizielle Körbchengröße wie 'J' oder 'I')." },
          race: { type: Type.STRING, description: "Rasse/Spezies des Charakters (z. B. 'Elf', 'Mensch', 'Vampir')." },
          raceFeatures: { type: Type.STRING, description: "Rassemerkmale wie Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe, Muster, Verteilung am Körper), ein Katzenkopf oder andere fantastische oder tierische Abweichungen von der menschlichen Norm. Falls gewöhnlicher Mensch, trage 'keine' ein." },
          origin: { type: Type.STRING, description: "Herkunft oder Heimatland (z. B. 'Nordland', 'Kaiserreich')." },
          family: { type: Type.STRING, description: "Adelshaus, Familie, Clan oder Zugehörigkeit (z. B. 'Haus Arryn')." },
          faction: { type: Type.STRING, description: "Fraktion, Gilde oder Bündnis (z. B. 'Abenteurergilde')." },
          goal: { type: Type.STRING, description: "Lebensziel oder primäre Motivation." },
          skills: { type: Type.STRING, description: "Fähigkeiten/Kräftebeschreibung (z. B. 'Erschaffung von Eiswaffen')." },
          powerSource: { type: Type.STRING, description: "Quelle der Macht (z. B. 'Manaschwankungen', 'Antike Runen')." },
          powerCost: { type: Type.STRING, description: "Limitierungen oder Energiekosten (z. B. 'Erhöhte Herztätigkeit', 'MP-Abzug')." },
          techniques: { type: Type.STRING, description: "Liste der Techniken als kommagetrennte Namen-Liste." },
          techniqueList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name der Technik." },
                description: { type: Type.STRING, description: "Effekt und Ablauf dieser Kampf- oder Magie-Technik." }
              },
              required: ["name", "description"]
            },
            description: "Liste von konkreten Spezialtechniken."
          },
          relationship: { type: Type.STRING, description: "Die Beziehungen dieses Charakters zu anderen Charakteren oder Gruppierungen (z. B. 'Sohn von König Arthur', 'Zweifelt an der Gilde')." },
          conduct: { type: Type.STRING, description: "Das Verhalten des Charakters gegenüber anderen Charakteren und Situationen (z. B. 'Misstrauisch, wird schnell wütend bei Provokation')." },
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                targetCharacter: { type: Type.STRING, description: "Name des anderen Codex-Charakters, NPCs oder Hauptcharakters, zu dem eine Beziehung besteht." },
                type: { type: Type.STRING, description: "Die Art der Beziehung (z.B. 'Mutter', 'Vater', 'Gefährte', 'Erzfeind')." },
                behavior: { type: Type.STRING, description: "Das Verhalten zu diesem Charakter (z.B. 'Liebevoll und treusorgend', 'Respektvoll aber distanziert')." }
              },
              required: ["targetCharacter", "type", "behavior"]
            },
            description: "Strukturierte Beziehungen zu anderen Charakteren der Welt (Codex-Einträge oder NPCs) inklusive des Spielers."
          }
        });
        requiredFields.push(
          "role", "nickname", "personality", "currentSituation", "gender", "age", "build", "hairColor", "eyeColor", "outfit", "height", "measurements", "cupSize", "race", "raceFeatures", "origin", "family", "faction", "goal", "skills", "powerSource", "powerCost", "techniques", "techniqueList", "relationship", "conduct", "relationships"
        );
        
        if (powerSettings && Object.keys(powerSettings).length > 0) {
          const powerProps: any = {};
          Object.keys(powerSettings).forEach(key => {
            const p = powerSettings[key];
            const minVal = p?.scaleMin ?? 0;
            const maxVal = p?.scaleMax ?? 100;
            powerProps[key] = {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.INTEGER, description: `Aktueller Wert (min ${minVal}, max ${maxVal})` },
                potentialMax: { type: Type.INTEGER, description: `Potenzielles Maximum (min ${minVal}, max ${maxVal})` }
              },
              required: ["value", "potentialMax"]
            };
          });
          detailsProperties.campaignPowerLevels = {
            type: Type.OBJECT,
            properties: powerProps,
            required: Object.keys(powerSettings)
          };
          requiredFields.push("campaignPowerLevels");
        }
      } else if (category === 'Orte') {
        Object.assign(detailsProperties, {
          type: { type: Type.STRING, description: "Typ des Ortes (z. B. 'Stadt', 'Ruine', 'Dungeon', 'Wald')." },
          climate: { type: Type.STRING, description: "Klima und Atmosphäre (z. B. 'Dauerhafter Nebel', 'Tropisch warm')." },
          landmarks: { type: Type.STRING, description: "Interessante Orte oder Landmarken (z. B. 'Ein verlassener Leuchtturm')." }
        });
        requiredFields.push("type", "climate", "landmarks");
      } else if (category === 'Fraktionen') {
        Object.assign(detailsProperties, {
          leader: { type: Type.STRING, description: "Gründer, Anführer oder Ratsvorsitzender." },
          status: { type: Type.STRING, description: "Bündnisstatus oder Beziehung zu Abenteurern (z. B. 'Neutral', 'Verbündet', 'Verfeindet')." },
          philosophy: { type: Type.STRING, description: "Gemeinsame Ideologie oder Philosophie." }
        });
        requiredFields.push("leader", "status", "philosophy");
      } else if (category === 'Gegenstände') {
        Object.assign(detailsProperties, {
          itemType: { type: Type.STRING, description: "Gegenstandsklasse (z. B. 'Waffe', 'Heilmittel', 'Artefakt')." },
          rarity: { type: Type.STRING, description: "Seltenheitswert (z. B. 'Legendär', 'Episch', 'Gewöhnlich')." },
          effects: { type: Type.STRING, description: "Wirkungen / Magische Effekte (z. B. '+12 Angriff, Lichtaura')." }
        });
        requiredFields.push("itemType", "rarity", "effects");
      } else if (category === 'Fähigkeiten') {
        Object.assign(detailsProperties, {
          abilityType: { type: Type.STRING, description: "Fähigkeitsklasse (z. B. 'Magie', 'Physischer Skill', 'Passiv')." },
          cost: { type: Type.STRING, description: "Verbrauch/Aktivierungskosten (z. B. '25 Mana', '5% Leben')." },
          impact: { type: Type.STRING, description: "Wirkung und angerichteter Schaden / Statusveränderung." }
        });
        requiredFields.push("abilityType", "cost", "impact");
      } else if (category === 'Events') {
        Object.assign(detailsProperties, {
          eventSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING, description: "Kurzer, prägnanter Name dieses Meilensteins/Ablaufs." },
                description: { type: Type.STRING, description: "Detaillierte Beschreibung dieses Ereignisses." },
                status: { type: Type.STRING, description: "Muss 'planned' sein." }
              },
              required: ["title", "description", "status"]
            },
            description: "Chronologische Liste von Storybook-Abläufen."
          }
        });
        requiredFields.push("eventSteps");
      }

      const schema: any = {
        type: Type.OBJECT,
        properties: {
          title: { 
            type: Type.STRING, 
            description: "Ein extrem kurzer und präziser Name des RPG-Eintrags (NUR der Eigenname, z. B. 'Torben' oder 'Die Schwarze Feste'). Maximal 3-4 Wörter! Niemals den ganzen Text kopieren!" 
          },
          description: { 
            type: Type.STRING, 
            description: "Ein detaillierter, packend geschriebener Fließtext als Hintergrundgeschichte, Herkunft und Legenden auf Deutsch (mindestens 1-2 Absätze)." 
          },
          details: {
            type: Type.OBJECT,
            properties: detailsProperties,
            required: requiredFields.length > 0 ? requiredFields : undefined
          },
          secretsStage1: {
            type: Type.STRING,
            description: "Stufe 1 (Öffentliches Wissen): Was ist allgemein über diesen Lore-Eintrag / dieses Subjekt bekannt? Gerüchte oder oberflächliche Geheimnisse."
          },
          secretsStage2: {
            type: Type.STRING,
            description: "Stufe 2 (Indizien & Verdacht): Welche begründeten Gerüchte, versteckten Motive, Indizien oder Verdachtsmomente umgeben diesen Eintrag / dieses Subjekt?"
          },
          secretsStage3: {
            type: Type.STRING,
            description: "Stufe 3 (Absolutes Geheimnis - Blackbox): Was ist das absolute Geheimnis dieses Eintrags / Subjekts (z.B. wahre Natur, geheime Pläne, verborgene Zugehörigkeiten), das absolut geheim bleiben MUSS?"
          }
        },
        required: ["title", "description", "details", "secretsStage1", "secretsStage2", "secretsStage3"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async extractStructuredInventory(character: Character, world: WorldSetting): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Du bist ein Item-Extraktions-Modul für ein RPG-Spiel. 
Hier ist die Beschreibung des Hauptcharakters (Held):
- Name: ${character.name}
- Rolle: ${character.role}
- Outfit/Kleidung (WICHTIG): ${character.appearance?.outfit || 'Unbekannt'}
- Biografie/Hintergrund: ${character.bio || 'Unbekannt'}
- Spezialfähigkeiten & Skills: ${character.skills || 'Keine'}
- Techniken: ${character.techniques || 'Keine'}

Analysiere diese Informationen gründlich und extrahiere alle Ausrüstungsgegenstände, Kleidungsteile, Waffen, Schmuckstücke, Accessoires und sonstigen tragbaren Gegenstände, die der Charakter standardmäßig besitzt, trägt oder mit sich führt. 

Ordne die extrahierten Gegenstände streng nach folgenden Kategorien zu:
1. weapons (Waffen): Liste aller konkreten Waffen oder Kampfwerkzeuge (z.B. ["Stahlschwert", "Wurfdolche"]). Falls er waffenlos kämpft (z.B. nur Fäuste), lasse die Liste leer.
2. armor (Kleidung & Rüstung):
   - head: Kopfbedeckung (z.B. Strohhut, Bandana, Helm)
   - chest: Oberbekleidung/Rüstung (z.B. Rotes Hemd, Lederrüstung)
   - hands: Handschuhe/Bandagen/Unterarmtattoos (z.B. Lederhandschuhe)
   - legs: Beinkleidung/Hosen (z.B. Blaue Shorts, Beinschienen)
   - feet: Schuhwerk (z.B. Sandalen, Stiefel)
3. accessories (Schmuck & Accessoires):
   - finger: Ringe (z.B. Goldener Siegelring)
   - wrist: Armbänder/Uhren/Gelenkschutz (z.B. Log-Port, Silberner Armreif)
   - waist: Gürtel/Schärpen (z.B. Gelbe Schärpe, Ledergürtel)
   - back: Umhänge/Flaggen/Rückenhalterungen (z.B. Strohhut-Flagge, Roter Umhang)
   - neck: Halsbekleidung/Ketten/Halsbänder/Amulette (z.B. Goldkette, Amulett). Alles, was am Hals getragen wird, gehört zwingend in diesen Slot und nicht in 'generalItems'
4. generalItems (Sonstige Gegenstände): Alle anderen Gegenstände, Tascheninhalte, Vorräte oder Alltagsutensilien (z.B. ["Kompass", "Heiltrank", "Proviantbeutel"]).

Achte darauf, Gegenstände nicht doppelt einzutragen. Sei präzise und nenne konkrete Bezeichnungen aus dem Text oder leite sie sinnvoll ab (z.B. wenn er ein "rotes Hemd" trägt, trage "Rotes Hemd" bei chest ein). Falls ein Feld nicht im Text erwähnt ist, lasse es leer.

Gib ein strukturiertes JSON-Objekt zurück, das dem geforderten Schema entspricht.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          money: { type: Type.INTEGER, description: "Startgeld des Charakters (z.B. 100)" },
          currencyLabel: { type: Type.STRING, description: "Währungsbezeichnung, passend zum Setting (z.B. Berry, Goldstücke, Credits)" },
          weapons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Liste aller Waffen des Charakters"
          },
          armor: {
            type: Type.OBJECT,
            properties: {
              head: { type: Type.STRING },
              chest: { type: Type.STRING },
              hands: { type: Type.STRING },
              legs: { type: Type.STRING },
              feet: { type: Type.STRING }
            },
            required: ["head", "chest", "hands", "legs", "feet"]
          },
          accessories: {
            type: Type.OBJECT,
            properties: {
              finger: { type: Type.STRING },
              wrist: { type: Type.STRING },
              waist: { type: Type.STRING },
              back: { type: Type.STRING },
              neck: { type: Type.STRING }
            },
            required: ["finger", "wrist", "waist", "back", "neck"]
          },
          generalItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Liste sonstiger Gegenstände in der Tasche"
          }
        },
        required: ["money", "currencyLabel", "weapons", "armor", "accessories", "generalItems"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async scanCombatant(
    world: WorldSetting,
    opponentName: string,
    player?: Character,
    existingFactions?: string[]
  ): Promise<{
    role: string;
    description: string;
    powerSource: string;
    powerCost: string;
    techniques: { name: string; description: string }[];
    campaignPowerLevels: Record<string, { value: number; potentialMax: number }>;
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const powerSettings = world.campaignPowerSettings || {};
      const powerKeys = Object.keys(powerSettings);
      
      const powerKeysStr = powerKeys.length > 0 
        ? `In dieser Kampagne existieren folgende Werte-Skalen:\n${powerKeys.map(k => {
            const p = powerSettings[k];
            const minVal = (p && typeof p === 'object') ? (p.scaleMin ?? p.min ?? 0) : 0;
            const maxVal = (p && typeof p === 'object') ? (p.scaleMax ?? p.max ?? 100) : (typeof p === 'number' ? p : 100);
            return `- ${k} (min: ${minVal}, max: ${maxVal})`;
          }).join('\n')}`
        : "Es existieren keine spezifischen Kampagnen-Parameter.";

      const prompt = `Analysiere den Gegner/Widersacher/Verbündeten "${opponentName}" in der Welt "${world.title}" (Genre: ${world.era || 'Fantasy'}, Welthintergrund: ${world.description}).
      Erstelle für diesen generic No-Name eine passende Rolle, eine detailreiche Beschreibung (wie er aussieht, Ausrüstung, Kampfverhalten), seine magische/physische Kraftquelle, Energielimitierungen (Kosten) und 2 bis 3 charakteristische Techniken/Abilitäten für den Kampf sowie passende Macht-Werte für die Werte-Skalen der Kampagne.
      
      ${powerKeysStr}
      
      Gib die Antwort als strukturiertes JSON-Objekt zurück mit folgendem Schema:
      {
        "role": "Die Kampfrolle oder Klassifizierung (z.B. 'Schwerer Gardist', 'Wassertentakel-Bestie', 'Schatten-Ninja')",
        "description": "Eine packende, detailreiche Beschreibung seines Äußeren, seiner Bewaffnung und seiner Kampfweise auf Deutsch.",
        "powerSource": "Die Quelle seiner Macht (z.B. 'Physische Kraft', 'Mondlicht-Mana', 'Chakra', 'Götterzorn')",
        "powerCost": "Energiekosten oder Einschränkungen (z.B. 'Ausdauer-Abzug', 'Mana-Verbrauch', 'Körperliche Erschöpfung')",
        "techniques": [
          {
            "name": "Name der Technik (z.B. 'Schildwall', 'Eisenfresser', 'Frostbiss')",
            "description": "Ausführliche Beschreibung des Effekts und des Ablaufs der Technik im Kampf auf Deutsch."
          }
        ],
        "campaignPowerLevels": {
          "ParameterName": {
            "value": 50,
            "potentialMax": 100
          }
        }
      }
      
      WICHTIG: Die Keys in 'campaignPowerLevels' MÜSSEN exakt mit den oben genannten existierenden Parametern übereinstimmen! Wenn keine existieren, lass das Feld leer.`;

      const powerLevelProps: any = {};
      powerKeys.forEach(k => {
        const p = powerSettings[k];
        const minVal = (p && typeof p === 'object') ? (p.scaleMin ?? p.min ?? 0) : 0;
        const maxVal = (p && typeof p === 'object') ? (p.scaleMax ?? p.max ?? 100) : (typeof p === 'number' ? p : 100);
        powerLevelProps[k] = {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.INTEGER, description: `Aktueller Wert (min ${minVal}, max ${maxVal})` },
            potentialMax: { type: Type.INTEGER, description: `Potenzielles Maximum (min ${minVal}, max ${maxVal})` }
          },
          required: ["value", "potentialMax"]
        };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              description: { type: Type.STRING },
              powerSource: { type: Type.STRING },
              powerCost: { type: Type.STRING },
              techniques: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              campaignPowerLevels: {
                type: Type.OBJECT,
                properties: powerLevelProps,
                required: powerKeys
              }
            },
            required: ["role", "description", "powerSource", "powerCost", "techniques", "campaignPowerLevels"]
          },
          safetySettings: world.isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {
        role: 'Bedrohung',
        description: 'Ein geheimnisvoller Widersacher.',
        powerSource: 'Unbekannt',
        powerCost: 'Keine',
        techniques: [],
        campaignPowerLevels: {}
      });
    });
  }

  static async extractChronicle(prologue: string, currentChronicle: string, recentMessages: ChatMessage[], isNsfw?: boolean): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      const prompt = `Du bist ein literarischer Chronist. Deine Aufgabe ist es, eine kurze, prägnante Chronik (Zusammenfassung der wichtigsten Ereignisse auf Deutsch) des bisherigen Spielgeschehens zu erstellen oder eine vorhandene mit den neuesten Ereignissen zu aktualisieren.

PROLOG:
${prologue || ''}

BISHERIGE CHRONIK:
${currentChronicle || '(Keine bisherige Chronik vorhanden, erstelle eine neue)'}

NEUE EREIGNISSE (Letzte Nachrichten):
${recentMessages.map(m => `${m.role === 'user' ? 'Spieler' : 'DM'}: ${m.text}`).join('\n\n')}

Schreibe die aktualisierte Chronik als zusammenhängenden, packenden Text auf Deutsch. Halte sie kurz (maximal 150-200 Wörter). Konzentriere dich nur auf wichtige Enthüllungen, getroffene Entscheidungen, bereiste Orte oder dramatische Wendungen. Nenne niemals geheime Rollen oder Tarnungen, bevor sie nicht im Text absolut zweifelsfigurlich und zweifelsfrei enthüllt wurden! Antworte NUR mit dem reinen Text der Chronik (kein Intro, kein Outro, keine Einleitung wie "Hier ist die Chronik...").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return (response.text || '').trim();
    });
  }
}