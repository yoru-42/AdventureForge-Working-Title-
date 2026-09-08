import { GoogleGenAI, Type, GenerateContentResponse, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import { ChatMessage, WorldSetting, Character, NPC, UserProfile, LoreEntry, EconomyHolding, EconomyLogEntry, Territory, EconomyTask, EconomyDuty, EconomyOrder } from "../types";
import { ACTION_AND_TIMESKIP_DIRECTIVE, CANON_PROTECTION_DIRECTIVE, GROUNDED_WORLD_AND_CHARACTER_DIRECTIVE, WORLD_INTEGRATION_DIRECTIVE, WorldKnowledgeService } from "./worldKnowledgeService";
import {
  executeDrawingPlan,
  validateDrawingPlanAndGeometries,
  DrawingPlan,
  DrawingAction,
  DrawingExecutionResult
} from "../components/worldmap/worldMapDrawingEngine";

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

export const CHARACTER_BIO_8_QUESTIONS_PROMPT = `
### STRUKTUR DER VERGANGENHEIT / BIOGRAFIE ('bio' bzw. 'description' bei Charakteren):
Die Biografie des Charakters beantwortet fließend, atmosphärisch und zusammenhängend auf Deutsch die folgenden Fragen (jeweils ca. 2 bis 3 Sätze pro Punkt):
1. Wo und in welchen Verhältnissen bist du aufgewachsen? (Herkunft, Familie, soziale Verhältnisse)
2. Wie würdest du deine Kindheit beschreiben? (glücklich, schwierig, behütet, gewöhnlich etc.)
3. Welche Menschen waren in deiner Kindheit und Jugend besonders wichtig für dich? (Eltern, Geschwister, Freunde, Meister etc.)
4. Was war ein wichtiges Ereignis, das dein Leben beeinflusst hat? (ein normales oder prägendes Ereignis)
5. Wie bist du zu deinem heutigen Leben / Beruf / deiner Rolle gekommen? (Übergang von Vergangenheit zu Gegenwart)
6. Welche Erlebnisse oder Erfahrungen haben dich besonders geprägt? (relevante prägende Punkte)
7. Gibt es etwas aus deiner Vergangenheit, das du bereust, verloren hast oder gerne ändern würdest? (emotionale Tiefe)
8. Gibt es etwas aus deiner Vergangenheit, das du anderen verschweigst? (EIN GEHEIMNIS IST VOLLKOMMEN OPTIONAL: Wenn aus Rolle, Beruf, Welt oder Beziehungen kein natürliches Geheimnis hervorgeht, wird KEINES erzeugt. Beschreibe stattdessen einen bodenständigen Aspekt des bisherigen Lebens).

STRENGSTE REGELN FÜR DIE BIOGRAFIE & CHARAKTERERSTELLUNG:
- GEWÖHNLICH VOR AUSSERGEWÖHNLICH: Bevorzuge stets bodenständige, alltägliche Hintergründe. Außergewöhnliche Merkmale oder Geheimnisse sind NUR erlaubt, wenn der Charakter eine explizite Schlüsselrolle (Anführer, Hauptgegner, zentraler Questgeber) hat oder der Nutzer es vorgegeben hat.
- PRIORITÄTSKETTE: Kontext → Welt/Ort/Beruf/Rolle → Beziehungen → Motivation → bisherige Ereignisse → Bedeutung des Charakters → erst danach außergewöhnliche Elemente.
- HARTER GRUNDSATZ: AdventureForge soll keine Welt voller Hauptcharaktere erzeugen. Die meisten Bewohner sind gewöhnliche Menschen mit alltäglichen Problemen und Berufen.
- Alles in der Biografie repräsentiert ausschließlich die HISTORISCHE VERGANGENHEIT (Vorgeschichte vor Beginn des aktuellen Spiels).
- Der Charakter darf KEINERLEI Wissen über das aktuelle Geschehen der Story oder die gegenwärtige Situation des Spielers besitzen.`;

export const CHARACTER_BIO_7_QUESTIONS_PROMPT = CHARACTER_BIO_8_QUESTIONS_PROMPT;

export class GeminiService {
  private static async fetchWithRetry(url: string, options: RequestInit, maxRetries = 2, initialDelay = 1500): Promise<Response> {
    let attempt = 0;
    let delay = initialDelay;
    while (true) {
      try {
        attempt++;
        const res = await fetch(url, options);
        if (!res.ok && (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) && attempt <= maxRetries) {
          console.warn(`[Gemini Client Fetch] HTTP ${res.status}, retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        return res;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (attempt <= maxRetries) {
          console.warn(`[Gemini Client Fetch] Network error (${errMsg}), retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 1.5;
          continue;
        }
        throw err;
      }
    }
  }

  private static getAI() {
    // Return a mocked ai object that proxies requests to our local full-stack server
    return {
      models: {
        generateContent: async (reqArgs: any) => {
          if (reqArgs.model === 'gemini-3.1-flash-lite-image' || reqArgs.model === 'gemini-3.1-flash-image' || (typeof reqArgs.model === 'string' && reqArgs.model.includes('image'))) {
            const isNsfw = !!reqArgs.config?.safetySettings;
            const prompt = Array.isArray(reqArgs.contents?.parts) 
                ? reqArgs.contents.parts[0]?.text 
                : typeof reqArgs.contents === 'string' ? reqArgs.contents : reqArgs.contents?.text;

            const res = await this.fetchWithRetry('/api/gemini/generateImage', {
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
            if (data.error || !data.imageUrl) {
              throw new Error(data.error || "Bild konnte nicht generiert werden.");
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
          const res = await this.fetchWithRetry('/api/gemini/generate', {
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
    
    let cleanedText = text.trim();

    // 1. Strip markdown code block fences (e.g., ```json ... ``` or ``` ... ```)
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    // 2. Direct JSON parse
    try {
      return JSON.parse(cleanedText);
    } catch (_) {}

    // 3. Extract JSON object or array substring if conversational text surrounds it
    const jsonMatch = cleanedText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const candidateText = jsonMatch ? jsonMatch[0] : cleanedText;

    try {
      return JSON.parse(candidateText);
    } catch (e: any) {
      console.warn("JSON parse error, attempting to repair JSON. Error:", e.message);
      try {
        const repaired = jsonrepair(candidateText);
        return JSON.parse(repaired);
      } catch (repairErr) {
        console.error("Could not repair JSON:", repairErr, "Raw text:", text.slice(0, 150));
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

  private static async callWithRetry<T>(fn: () => Promise<T>, retries = 1, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errMsg = error?.message || (error ? String(error) : '');
      const lowerMsg = errMsg.toLowerCase();
      
      const isNetworkError = lowerMsg.includes('networkerror') ||
                             lowerMsg.includes('failed to fetch') ||
                             lowerMsg.includes('fetch failed') ||
                             lowerMsg.includes('network error') ||
                             lowerMsg.includes('load failed') ||
                             lowerMsg.includes('socket hang up') ||
                             lowerMsg.includes('econnreset') ||
                             lowerMsg.includes('etimedout') ||
                             lowerMsg.includes('deadline') ||
                             lowerMsg.includes('timeout') ||
                             error?.name === 'TypeError' ||
                             error instanceof TypeError;

      const isRateLimitOrBusy = lowerMsg.includes('429') || 
                                lowerMsg.includes('502') ||
                                lowerMsg.includes('503') ||
                                lowerMsg.includes('504') ||
                                lowerMsg.includes('high demand') ||
                                lowerMsg.includes('temporarily unavailable') ||
                                lowerMsg.includes('spikes in demand') ||
                                error?.status === 'RESOURCE_EXHAUSTED' || 
                                error?.status === 'UNAVAILABLE' ||
                                (error?.status && String(error.status).includes('429')) ||
                                (error?.status && String(error.status).includes('503')) ||
                                (error?.status && String(error.status).includes('502'));
      
      if (retries > 0 && (isRateLimitOrBusy || isNetworkError)) {
        console.warn(`[Gemini Retry] Transient network or rate limit error hit (${errMsg}), retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 1.5);
      }
      throw error;
    }
  }

  static async chat(history: ChatMessage[], systemInstruction: string, isNsfw?: boolean, summaryLog?: string) {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      const playerPowerAutonomyDirective = `
### ABSOLUTES VERBOT DES SELBSTSTÄNDIGEN / PASSIVEN LOSGEHENS VON FÄHIGKEITEN & KRÄFTEN DES NUTZERS (SPIELER-KRAFTKONTROLLE & AKTIVIERUNGSMONOPOL):
- Die Fähigkeiten, Magie, Elementarkräfte (wie Kälte, Eis, Hitze, Feuer, Wind, Schatten, Licht etc.), Teufelskräfte, Transformationen, Auren oder Fertigkeiten des Spielers/Nutzers gehen NIEMALS von alleine los, lecken nicht passiv aus dem Körper heraus, entweichen nicht versehentlich und brechen niemals unkontrolliert aus!
- Beschreibe NIEMALS, dass sich durch die bloße Anwesenheit, Emotionen oder Gedanken des Spielers von selbst Raureif, Frost, Kälte, Flammen, Hitze, Blitze, Funken oder Auren in der Umgebung (z. B. auf Tischen, Werkbänken, Wänden, Böden, Fenstern oder an Gegenständen) bilden oder absetzen!
- Der Spieler besitzt die 100%ige und unerschütterliche Kontrolle über seine Fähigkeiten. Seine Kräfte, Magie oder Teufelskräfte aktivieren, entfalten oder manifestieren sich AUSSCHLIESSLICH DANN, wenn der Spieler dies in seinem eigenen Spielzug / Beitrag EXPLIZIT und aktiv anordnet oder einsetzt!
- Weder der Erzähler noch NPCs dürfen beschreiben oder behaupten, dass die Kräfte des Spielers sich verselbstständigen, unkontrolliert fließen, "gebändigt/beruhigt werden müssen", unter der Haut prickeln oder die Umwelt unbeabsichtigt kühlen, erhitzen oder verändern.
- NPCs dürfen den Spieler nicht belehren, ermahnen oder behandeln, als hätte er seine Kräfte nicht im Griff (z. B. keine Dialoge wie „diese Kälte will kontrolliert werden“ oder „lass die Hitze das Eis in deinen Adern besänftigen“), es sei denn, der Spieler selbst hat im Chat ausdrücklich geschrieben, dass sein Charakter die Beherrschung verliert.
- Es ist strengstens verboten, passive körperliche Krafteffekte im Körper des Spielers zu erfinden (wie z. B. „ein kühles Prickeln unter deiner Haut“, „das Eis in deinen Adern“, „Hitze lodert unbemerkt in dir auf“).
`;

      // Optimize token usage: keep the last 12 messages for conversation flow,
      // and append the prologue (the very first chat message) as reference.
      // The systemInstruction already contains all world, player and NPC profile info.
      const maxHistoryCount = 12;
      let historyToPass = history;
      let finalSystemInstruction = `${systemInstruction}\n${playerPowerAutonomyDirective}\n${CANON_PROTECTION_DIRECTIVE}\n${GROUNDED_WORLD_AND_CHARACTER_DIRECTIVE}\n${WORLD_INTEGRATION_DIRECTIVE}\n${ACTION_AND_TIMESKIP_DIRECTIVE}`;

      if (history.length > maxHistoryCount) {
        if (history[0] && history[0].text) {
          finalSystemInstruction = `${systemInstruction}\n${playerPowerAutonomyDirective}\n${CANON_PROTECTION_DIRECTIVE}\n${GROUNDED_WORLD_AND_CHARACTER_DIRECTIVE}\n${WORLD_INTEGRATION_DIRECTIVE}\n${ACTION_AND_TIMESKIP_DIRECTIVE}\n\nPROLOGUE AND STORY START:\n${history[0].text}\n[... Einige Ereignisse übersprungen für Kontext-Optimierung ...]\n`;
        }
        historyToPass = history.slice(-maxHistoryCount);
      }

      if (summaryLog) {
        finalSystemInstruction = `${finalSystemInstruction}\n\nCHRONIK DER BISHERIGEN WICHTIGEN EREIGNISSE (Kompakte Zusammenfassende Erinnerung):\n${summaryLog}\n`;
      }

      let contents = historyToPass.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Trim trailing model turns so request always ends with a user turn
      while (contents.length > 0 && contents[contents.length - 1].role === 'model') {
        contents.pop();
      }

      if (contents.length === 0) {
        contents = [{ role: 'user', parts: [{ text: 'Setze die Geschichte fort.' }] }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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

  static compressImageBase64(base64Str: string, maxWidth: number = 512, quality: number = 0.65): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(base64Str);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  }

  static async generateImage(prompt: string, isNsfw?: boolean, aspectRatio: string = "1:1"): Promise<string | null> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          const rawUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          try {
            return await this.compressImageBase64(rawUrl);
          } catch (e) {
            return rawUrl;
          }
        }
      }
      return null;
    } catch (e: any) {
      console.error("GeminiService.generateImage Error:", e);
      throw e;
    }
  }  static async generatePrologue(world: WorldSetting, player?: Character, tags?: string[], loreDatabase?: LoreEntry[]): Promise<string> {
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
${player.appearance?.currentLocation ? `- Aktueller Standort (Startpunkt): ${player.appearance.currentLocation}\n` : ''}`;
      }

      let tagsContext = "";
      if (tags && tags.length > 0) {
        tagsContext = `\n- Genre / Tags / Themen: ${tags.join(', ')}`;
      }

      let storyContext = "";
      let secretsContext = "";
      if (loreDatabase && loreDatabase.length > 0) {
        const secretEntries = loreDatabase.filter(l => l.category === 'Verbotenes Wissen' || (l.category as string) === 'Geheimnisse & Verborgenes Wissen' || (l.category as string) === 'Verhüllung');
        if (secretEntries.length > 0) {
          secretsContext = `\n\n### STRENGSTES GEHEIMNIS- UND SPOILERVERBOT ("GEHEIMNISSE & VERBORGENES WISSEN"):
Folgende Informationen sind als verbotenes/geheimes Wissen eingestuft. Sie sind eine absolute BLACKBOX und dürfen unter KEINEN UMSTÄNDEN im Prolog, in der Weltenbeschreibung oder in Charakterbeschreibungen verraten, erwähnt oder angedeutet werden! Die Geheimnisse dürfen im Spiel erst durch spätere Taten des Spielers enthüllt werden:
${secretEntries.map(s => `- GEHEIMNIS (BLACKBOX): "${s.title}": ${s.description}`).join('\n')}
HINWEIS: Halte den gesamten Prolog zu 100% frei von Erwähnungen, Anspielungen oder Spoilern dieser Geheimnisse! Verrate niemals geheime Abstammungen (z. B. Kuja-Kriegerinnen), unaufgedeckte Herkünfte oder verborgenes Wissen.\n`;
        }

        const events = loreDatabase.filter(l => l.category === 'Story & Quests' || (l.category as string) === 'Events');
        if (events.length > 0) {
          storyContext = "\n\n### GEPLANTE STORY & ROTER FADEN DER KAMPAGNE (Zwingend zu beachten):\n";
          events.forEach((evt, idx) => {
            storyContext += `Kampagnen-Abschnitt #${idx + 1}: ${evt.title || 'Geschichte & Roter Faden'}\n`;
            storyContext += `Beschreibung des Handlungsfadens: ${evt.description || 'Keine nähere Beschreibung.'}\n`;
            if (evt.details?.eventSteps && Array.isArray(evt.details.eventSteps)) {
              storyContext += "Geplante chronologische Story-Schritte (Timeline):\n";
              evt.details.eventSteps.forEach((step: any, sIdx: number) => {
                const triggerText = step.trigger ? ` | Auslöser: ${step.trigger}` : '';
                const castText = step.cast ? ` | Besetzung: ${step.cast}` : '';
                const settingText = step.setting ? ` | Kulisse: ${step.setting}` : '';
                const conflictText = step.conflict ? ` | Konflikt: ${step.conflict}` : '';
                storyContext += `  Schritt ${sIdx + 1}: [${step.title || 'Unbenannt'}] ${step.description || ''}${triggerText}${castText}${settingText}${conflictText}\n`;
                if (step.unlockConditions) {
                  storyContext += `    Freischaltbedingungen: ${step.unlockConditions}\n`;
                }
              });
            }
          });
          storyContext += "\nACHTUNG: Der Prolog MUSS inhaltlich, thematisch und atmosphärisch exakt auf diese geplante Story und diesen Roten Faden abgestimmt sein! Leite die Weltbeschreibung und den Prolog so her, dass sie reibungslos in den ersten geplanten Story-Schritt übergehen.\n";
        }
      }

      const contextPrompt = `### WELTBESCHREIBUNG ODER ZEITLINIEN-PROMPT (Kontext für die Erstellung):
Achte STRENGSTENS auf den folgenden Welt- und Zeitlinienkontext für deine Generierung:
- Weltenname/Thema: "${world.title || ''}"
- Ära/Zeitpunkt der Story: "${world.era || ''}"
- Ton/Stimmung: "${world.tone || ''}"
- Welten-Beschreibung/Regeln: "${world.description || ''}"${tagsContext}${storyContext}${secretsContext}
Falls in der Welten-Beschreibung oder Ära spezielle Zeitpunkte, relative Angaben oder vergangene Ereignisse genannt werden (wie z.B. "One Piece vor Thriller Bark Arc", "Nach dem Weltkrieg" oder wenn ein zentrales Katalysator-Ereignis wie ein Unfall, Kräfteerhalt, eine Verwandlung, eine Katastrophe oder Amnesie erst "gestern", "letzte Nacht" oder "vor Kurzem" stattfand), MUSS der Prolog historisch und inhaltlich exakt zu DIESEM Zeitpunkt passen! 
Wenn das Ereignis erst gestern oder vor Kurzem passiert ist, MUSS der Prolog genau diese Vorgeschichte (den gestrigen Vorfall, z.B. den Kampf mit dem Dämon und die erste Verwandlung) packend in der Vergangenheitsform (Präteritum) schildern. Der Prolog dient somit als die "Vorgeschichte", damit das eigentliche Spiel in der Gegenwart starten kann. Beziehe dich bei der Generierung exakt auf diesen Story-Stand und diese Gegebenheiten.
${player?.appearance?.currentLocation ? `
Falls ein Aktueller Standort (Startpunkt) angegeben ist (wie z. B. ein Wald, ein Schiff, eine Ruine, eine Akademie oder eine Stadt), MUSS dieser Ort am Ende des Prologs atmosphärisch eingeführt und beschrieben werden, damit die anschließende erste Spielszene nahtlos genau an diesem Startort beginnen kann.\n` : ''}
${playerContext}

### Aufgabe:
Generiere einen fesselnden, atmosphärischen und packenden Prolog für das Abenteuer auf DEUTSCH.
Der Prolog soll die Welt, den aktuellen Stand der Dinge zum angegebenen Zeitpunkt, die Atmosphäre, das Genre und das Setting beschreiben, um den Spieler perfekt einzustimmen. Wenn ein Catalyst-Ereignis (wie z. B. eine Verwandlung oder ein Vorfall gestern Abend) existiert, schildere dieses Ereignis im Prolog als abgeschlossene Vorgeschichte in der Vergangenheitsform. Er muss den ersten Schritt des "Roten Fadens der Kampagne" (falls oben angegeben) elegant einleiten, so dass der Spielstart nahtlos daran anknüpfen kann. Er sollte etwa 2-4 Absätze lang sein. Verwende einen literarischen und ansprechenden Stil, der zum Ton/Stimmung der Welt passt.

WICHTIG (SPIELER-AUTONOMIE & KRAFTAUSBRUCHS-VERBOT):
- KEIN OVER-ENGINEERING ODER BLUMIGES DRAMATISIEREN VON VORGESCHICHTS-EREIGNISSEN: Wenn ein Vorgeschichts-Ereignis (wie z. B. das Finden eines Gegenstands oder der Erhalt von Kräften) erwähnt wird, schildere dies vollkommen schlicht, sachlich und knapp in 1-2 Sätzen.
- Erfinde NIEMALS melodramatische Ausschmückungen, epische innere Kämpfe, innere Wesen, magische Entfesselungen oder übertriebene Gefühlsutopien dazu! Nenne einfach nüchtern die Fakten und fahre direkt mit der eigentlichen Umgebung, der Lage und der Story fort.
- ABSOLUTES VERBOT DES SELBSTSTÄNDIGEN/PASSIVEN LOSGEHENS VON FÄHIGKEITEN & KRÄFTEN DES NUTZERS:
  Du darfst NIEMALS beschreiben oder entscheiden, dass die Kräfte, Magie, Elementarkräfte (wie Kälte, Eis, Hitze, Feuer, Wind etc.), Teufelskräfte, Dämonenmächte oder Fähigkeiten des Spielers von alleine losgehen, passiv lecken, unkontrolliert ausbrechen, versagen, wild werden oder ohne seinen expliziten Willen die Umgebung (z. B. Tische, Werkbänke, Wände, Böden) einfrieren, mit Raureif überziehen, verbrennen, verändern oder gefährden!
- Teufelskräfte, Magie und besondere Fähigkeiten brechen nicht einfach so heraus und gehen NIEMALS von alleine los. Ob der Spieler seine Kraft kontrollieren kann, wann er sie einsetzt und wie er sie führt, bestimmt EINZIG UND ALLEIN DER SPIELER in seinen eigenen Beiträgen.
- Du darfst NIEMALS beschreiben, was der Spieler/sein Charakter fühlt, denkt, spürt, empfindet oder wie sein Körper unwillkürlich reagiert (z. B. kein "kühles Prickeln unter der Haut", kein "Eis in deinen Adern").
- Es ist strengstens verboten zu schreiben: "Du spürst, wie sich eine eisige Kälte in deiner Brust ausbreitet", "lässt dein Herz einen Schlag aussetzen", "Deine Hände umklammern fester...", "Du spürst, wie die Farbe aus deinem Gesicht weicht", "deine Kräfte brechen unkontrolliert heraus" oder Ähnliches.
- Beschreibe ausschließlich die äußere Welt, die Lage der Umgebung, die Atmosphäre, die NPCs und die objektiven Umstände. Der Spieler hat die absolute und alleinige Kontrolle über seine Gefühle, seinen Körper, seine Mächte und seine Reaktionen!
- GLAUBWÜRDIGKEIT, ALLTÄGLICHKEIT & BODENSTÄNDIGKEIT (KI-REGEL):
  Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe. Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
  Nicht jeder Charakter benötigt eine persönliche Geschichte, die für den Spieler relevant ist. Die meisten Bewohner dürfen ein gewöhnliches Leben führen. Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.

WICHTIG: Antworte NUR mit dem generierten Prologtext. Keinen JSON-Wrapper, kein "Hier ist dein Prolog", kein Markdown außer normalem Text mit Absätzen.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
      });

      const text = response.text || '';
      return text.trim();
    });
  }

  static async generateFirstMessage(
    world: WorldSetting,
    player: Character,
    npcs: NPC[],
    prologue: string,
    tags?: string[],
    loreDatabase?: LoreEntry[]
  ): Promise<string> {
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

      let tagsContext = "";
      if (tags && tags.length > 0) {
        tagsContext = `GENRE / TAGS / THEMEN:\n${tags.join(', ')}\n\n`;
      }

      let storyContext = "";
      let secretsContext = "";
      if (loreDatabase && loreDatabase.length > 0) {
        const secretEntries = loreDatabase.filter(l => l.category === 'Verbotenes Wissen' || (l.category as string) === 'Geheimnisse & Verborgenes Wissen' || (l.category as string) === 'Verhüllung');
        if (secretEntries.length > 0) {
          secretsContext = `STRENGSTES GEHEIMNIS- UND SPOILERVERBOT ("GEHEIMNISSE & VERBORGENES WISSEN"):
Folgende Informationen sind als verbotenes/geheimes Wissen eingestuft. Sie sind eine absolute BLACKBOX und dürfen unter KEINEN UMSTÄNDEN in dieser ersten Spielszene verraten, erwähnt oder angedeutet werden!
${secretEntries.map(s => `- GEHEIMNIS (BLACKBOX): "${s.title}": ${s.description}`).join('\n')}
HINWEIS: Erwähne keines dieser Geheimnisse unaufgefordert!\n\n`;
        }

        const events = loreDatabase.filter(l => l.category === 'Story & Quests' || (l.category as string) === 'Events');
        if (events.length > 0) {
          storyContext = "GEPLANTE STORY & ROTER FADEN DER KAMPAGNE:\n";
          events.forEach((evt, idx) => {
            storyContext += `Handlungsfaden: ${evt.title || 'Geschichte & Roter Faden'}\n`;
            storyContext += `Beschreibung: ${evt.description || ''}\n`;
            if (evt.details?.eventSteps && Array.isArray(evt.details.eventSteps)) {
              storyContext += "Geplante Story-Schritte:\n";
              evt.details.eventSteps.forEach((step: any, sIdx: number) => {
                const triggerText = step.trigger ? ` | Auslöser: ${step.trigger}` : '';
                const castText = step.cast ? ` | Besetzung: ${step.cast}` : '';
                const settingText = step.setting ? ` | Kulisse: ${step.setting}` : '';
                const conflictText = step.conflict ? ` | Konflikt: ${step.conflict}` : '';
                storyContext += `  Schritt ${sIdx + 1}: [${step.title || 'Unbenannt'}] ${step.description || ''}${triggerText}${castText}${settingText}${conflictText}\n`;
              });
            }
          });
          storyContext += "\nACHTUNG: Die erste Interaktion/Szene MUSS den Spieler direkt in die Situation des ALLERERSTEN Story-Schrittes (bzw. des Beginns des Roten Fadens) versetzen! Sorge dafür, dass der Spielstart, die erste Szene, die Umgebung, NPCs und die Handlungsoptionen perfekt mit diesem ersten Schritt der Kampagne und den angegebenen Genre-Tags harmonieren.\n\n";
        }
      }

      const startLocation = player.appearance?.currentLocation || 'Startgebiet';

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${world.title}".
${campaignPowerInstruction}WELT: ${world.description}
${tagsContext}${storyContext}${secretsContext}
SPIELER-CHARAKTER:
- Name: ${player.name}
- Rolle: ${player.role}
- Aussehen: ${player.appearance?.gender || ''}, ${player.appearance?.age || ''} Jahre, ${player.appearance?.build || ''}
- Aktueller Standort (Zwingender Startort für diese Szene): ${startLocation}

Der Prolog war: ${prologue}

Deine Aufgabe:
Lass das Spiel genau am aktuellen Standort des Spielers ("${startLocation}") beginnen.
Die erste Szene MUSS zwingend und unmittelbar an diesem Ort spielen! Beschreibe die unmittelbare Umgebung detailreich und atmosphärisch (z. B. das Rascheln der Blätter im dichten Wald, die salzige Brise an Deck des Schiffes, das Kopfsteinpflaster und die Fachwerkhäuser der Stadt).
Sprich den Spieler direkt an, beschreibe, was er in diesem Moment an diesem Ort sieht oder wer vor ihm steht, und gib ihm einen klaren Handlungsaufhänger, auf den er sofort reagieren kann. Halte es filmreif und erzähle im Präsens.

ANWEISUNGEN:
- Schreibe aus der Perspektive des Erzählers (Du-Perspektive für den Spieler).
- Lass NPCs agieren, falls anwesend.
- Keine Fragen am Ende wie "Was tust du?".
- Markiere Handlungen und Ausdrücke mit Sternchen (*schaut überrascht*).
- ABSOLUTES VERBOT DES AUSGEBENS VON KAMPAGNEN-WERTEN ODER STATS:
  Gib NIEMALS, unter keinen Umständen, Kampagnen-Werte, Attribute, Statuslisten, Progress-Bars, Werteveränderungen oder Status-Meldungen (wie "**KAMPAGNEN-WERTE**", "Haki: 0/5000" etc.) im ausgegebenen Text aus! Diese Werte werden rein im Hintergrund für dich als Richtwert übermittelt. Dein Text darf ausschließlich die cineastische Erzählung, Dialoge und atmosphärische Beschreibungen enthalten – komplett frei von technischen Wertelisten.
- STRENGE ZEITLICHE TRENNUNG (VERGANGENHEITS-PROLOG VS. GEGENWARTS-SPIELSTART):
  Wenn die Welten-Beschreibung oder der Prolog ein Catalyst-Event beschreibt, das gestern oder vor Kurzem stattfand (z.B. der gestrige Dämonenangriff und die erste Verwandlung zum Magical Girl), dann MUSS der Spielstart / die erste Szene zwingend in der GEGENWART ansetzen (z.B. am darauffolgenden Tag, während du in der Schule sitzt und versuchst, dich völlig normal zu verhalten, während die gestrigen Ereignisse noch in dir nachwirken).
  Die erste Szene darf auf keinen Fall das gestrige Ereignis wiederholen oder so tun, als würde der Angriff gerade erst beginnen, sondern schildert die unmittelbaren, heutigen Auswirkungen dieses Ereignisses (z.B. der normale Alltag, der nun durch das Erlebte und die neuen Kräfte überschattet wird).
- ZEITLICHE KONSISTENZ & ANTI-ANACHRONISMUS (DOPPELTES TIMING-GEBOT):
  NPCs dürfen in Dialogen oder Gedanken NIEMALS unlogische Behauptungen aufstellen wie "Du hast dich in letzter Zeit verändert" (da das Ereignis erst gestern war und sie eine so kurzfristige Veränderung unmöglich über Wochen beobachtet haben können!). Sie dürfen sich auch nicht so verhalten, als ob diese Veränderung schon wochenlang herrscht. Sorge für eine absolut lückenlose und nachvollziehbare zeitliche Logik!
- STRENGES KONTROLL- UND HANDLUNGSVERBOT ÜBER SPIELER-KRÄFTE (SPIELER-AUTONOMIE & KEIN SELBSTSTÄNDIGES LOSGEHEN VON FÄHIGKEITEN):
  Die Fähigkeiten, Magie, Elementarkräfte (wie Kälte, Eis, Hitze, Feuer etc.), Teufelskräfte, Dämonenmächte oder Fertigkeiten des Spielers gehen NIEMALS von alleine los, lecken nicht passiv aus dem Körper heraus und brechen niemals unkontrolliert aus!
  Beschreibe NIEMALS, dass sich durch die Präsenz oder Emotionen des Spielers von selbst Raureif, Frost, Hitze, Flammen oder Funken in der Umgebung (auf Tischen, Werkbänken, Böden, Fenstern etc.) bilden!
  Der Spieler besitzt die 100%ige Kontrolle über seine Kräfte. Ob und wann er seine Kraft einsetzt, bestimmt EINZIG UND ALLEIN DER SPIELER in seinen eigenen Beiträgen.
  NPCs dürfen den Spieler nicht belehren oder behandeln, als hätte er seine Kräfte nicht im Griff (z.B. keine Sätze wie „diese Kälte will kontrolliert werden“ oder „lass die Hitze das Eis in deinen Adern besänftigen“).
- KEIN OVER-ENGINEERING ODER BLUMIGES DRAMATISIEREN VON VORGESCHICHTS-EREIGNISSEN: Wenn Vorgeschichts-Ereignisse erwähnt werden, schildere sie vollkommen schlicht, sachlich und knapp in 1-2 Sätzen. Erfinde NIEMALS melodramatische Ausschmückungen, epische innere Kämpfe oder mystische Geisterwesen dazu. Nenne nüchtern die Fakten und fahre direkt mit der eigentlichen Gegenwarts-Szene fort.
- STRENGSTES VERBOT DER BEHERRSCHUNG/VORSCHREIBUNG VON GEFÜHLEN ODER REAKTIONEN DES NUTZERS:
  Du darfst NIEMALS beschreiben oder diktieren, was der Spieler/sein Charakter fühlt, denkt, spürt, empfindet oder wie sein Körper unwillkürlich reagiert (kein "kühles Prickeln unter deiner Haut", kein "Eis in deinen Adern"). 
  Es ist absolut verboten zu schreiben: "Du spürst eine eisige Kälte", "dein Herz setzt einen Schlag aus", "deine Knöchel werden weiß", "deine Hände umklammern fester", "du spürst, wie die Farbe weicht", "deine Kräfte brechen heraus" oder Ähnliches.
  Beschreibe nur die äußere, objektive Welt und das Verhalten von NPCs. Der Spieler hat die absolute und alleinige Hoheit über seine Gedanken, unwillkürlichen Körperreaktionen, Gefühle, Mächte und Taten!
- ABSOLUTES ZITIERVERBOT DES NUTZERS:
  Du als Erzähler darfst NIEMALS wörtliche Zitate oder Aussagen des Spielers/Nutzers in deiner Beschreibung oder Narration wiederholen oder nachplappern. NPCs dürfen den Spieler jedoch in ihren eigenen Dialogen (in wörtlicher Rede) zitieren oder sich darauf beziehen.
- GLAUBWÜRDIGKEIT, ALLTÄGLICHKEIT & BODENSTÄNDIGKEIT (KI-REGEL):
  Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe. Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
  Nicht jeder Charakter benötigt eine persönliche Geschichte, die für den Spieler relevant ist. Die meisten Bewohner dürfen ein gewöhnliches Leben führen. Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
        model: 'gemini-3.1-flash-lite-image',
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
          const rawUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          try {
            return await this.compressImageBase64(rawUrl);
          } catch (e) {
            console.error("Fehler bei der Bildkomprimierung:", e);
            return rawUrl;
          }
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

  private static getRelationshipItemSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        targetCharacter: { type: Type.STRING, description: "Name des anderen Codex-Charakters, NPCs oder Hauptcharakters, zu dem eine Beziehung besteht." },
        type: { type: Type.STRING, description: "Die Art der Beziehung (z.B. 'Freund / Freundin', 'Rivale / Rivalin', 'Geschwister', 'Mentor / Schüler', 'Feind / Gegenspieler', 'Partner / Geliebte(r)', 'Erzfeind')." },
        relationshipStatus: { type: Type.STRING, description: "Aktueller Beziehungsstatus oder Phase (z.B. 'Erstes Kennenlernen', 'Wachsendes Vertrauen', 'Enge Verbündete', 'Angespannter Frieden', 'Verdeckter Konflikt', 'Erbitterte Fehde')." },
        isPotential: { type: Type.BOOLEAN, description: "Gibt an, ob es sich um eine hypothetische / mögliche zukünftige Dynamik handelt (true) oder um eine bereits bestehende, aktiv gelebte Beziehung (false)." },
        duration: { type: Type.STRING, description: "Dauer der Beziehung (z.B. 'Seit 3 Jahren', '10 Jahre', 'Wenige Wochen'). ACHTUNG: 'Seit der Kindheit' NUR verwenden, wenn beide Charaktere ein ähnliches Alter haben! Bei großem Altersunterschied ist 'Seit der Kindheit' als gleichaltrige Freunde unmöglich." },
        currentStance: { type: Type.STRING, description: "Aktuelle innere Haltung gegenüber dem Gegenüber (z.B. 'Tiefes Wohlwollen und Fürsorge', 'Wachsame Skepsis', 'Versteckte Eifersucht')." },
        dependency: { type: Type.STRING, description: "Art der Abhängigkeit oder Eigenständigkeit (z.B. 'Finanziell angewiesen', 'Emotionale Stütze', 'Völlig autark')." },
        fearIntimidation: { type: Type.STRING, description: "Furcht, Einschüchterung oder Respekt-Gefälle (z.B. 'Fürchtet dessen Zorn', 'Keinerlei Einschüchterung möglich', 'Machtdemonstrationen wirken')." },
        addressFromSelfToTarget: { type: Type.STRING, description: "Wie dieser Charakter den Zielcharakter direkt anspricht oder nennt (z.B. Spitzname, formelle Anrede, Kosename)." },
        addressFromTargetToSelf: { type: Type.STRING, description: "Wie der Zielcharakter diesen Charakter im Gegenzug nennt oder anspricht." },
        behavior: { type: Type.STRING, description: "Verhalten und Dynamik gegenüber diesem Charakter (z.B. 'Beschützend, stichelnd im Gespräch, stellt sich im Kampf sofort vor ihn')." },
        aiDirectives: { type: Type.STRING, description: "Verbindliche Story-KI Regieanweisungen für diese Beziehung (z.B. 'Darf ihn NIEMALS siezen. Verwendet immer den Spitznamen. Reagiert hochempfindlich bei Kritik von ihm.')." },
        perceptionSelfToTarget: { type: Type.STRING, description: "Persönliche Wahrnehmung dieses Charakters gegenüber dem Zielcharakter (Wie sieht er ihn innerlich?)." },
        perceptionTargetToSelf: { type: Type.STRING, description: "Persönliche Wahrnehmung des Zielcharakters gegenüber diesem Charakter." },
        secretsAndMotives: { type: Type.STRING, description: "Geheimnisse, verdeckte Gefühle oder verborgene Absichten bezüglich dieser Beziehung." },
        boundariesAndTaboos: { type: Type.STRING, description: "Unverrückbare Grenzen und Tabus zwischen den beiden (Worüber sprechen sie nie? Welche roten Linien existieren?)." },
        sharedPast: { type: Type.STRING, description: "Gemeinsame Vorgeschichte und Vergangenheit. STRENGSTENS AUF ALTER UND ORTE ACHTEN: Bei großem Altersunterschied KEINE gemeinsame Kindheit als Gleichaltrige erfinden. Das erste Kennenlernen muss zwingend zu den realen Heimatorten / Taverne / Standorten der Charaktere passen." },
        keyMemories: { type: Type.STRING, description: "Wichtige gemeinsame Erinnerungen und Schlüsselmomente (z.B. Erstes Kennenlernen am realen Heimatort/Taverne, gemeinsame Prüfungen)." },
        valuesSelfToTarget: {
          type: Type.OBJECT,
          properties: {
            affection: { type: Type.INTEGER, description: "Zuneigung von Selbst zu Ziel (-100 bis +100)" },
            trust: { type: Type.INTEGER, description: "Vertrauen von Selbst zu Ziel (0 bis 100)" },
            respect: { type: Type.INTEGER, description: "Respekt von Selbst zu Ziel (0 bis 100)" },
            loyalty: { type: Type.INTEGER, description: "Loyalität von Selbst zu Ziel (0 bis 100)" },
            familiarity: { type: Type.INTEGER, description: "Vertrautheit von Selbst zu Ziel (0 bis 100)" },
            fear: { type: Type.INTEGER, description: "Angst/Furcht von Selbst zu Ziel (0 bis 100)" },
            bond: { type: Type.INTEGER, description: "Emotionale Bindung von Selbst zu Ziel (0 bis 100)" },
            hostility: { type: Type.INTEGER, description: "Feindseligkeit von Selbst zu Ziel (0 bis 100)" }
          },
          required: ["affection", "trust", "respect", "loyalty", "familiarity", "fear", "bond", "hostility"]
        },
        valuesTargetToSelf: {
          type: Type.OBJECT,
          properties: {
            affection: { type: Type.INTEGER, description: "Zuneigung von Ziel zu Selbst (-100 bis +100)" },
            trust: { type: Type.INTEGER, description: "Vertrauen von Ziel zu Selbst (0 bis 100)" },
            respect: { type: Type.INTEGER, description: "Respekt von Ziel zu Selbst (0 bis 100)" },
            loyalty: { type: Type.INTEGER, description: "Loyalität von Ziel zu Selbst (0 bis 100)" },
            familiarity: { type: Type.INTEGER, description: "Vertrautheit von Ziel zu Selbst (0 bis 100)" },
            fear: { type: Type.INTEGER, description: "Angst/Furcht von Ziel zu Selbst (0 bis 100)" },
            bond: { type: Type.INTEGER, description: "Emotionale Bindung von Ziel zu Selbst (0 bis 100)" },
            hostility: { type: Type.INTEGER, description: "Feindseligkeit von Ziel zu Selbst (0 bis 100)" }
          },
          required: ["affection", "trust", "respect", "loyalty", "familiarity", "fear", "bond", "hostility"]
        },
        keyEvents: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Titel des Schlüsselereignisses." },
              dateOrChapter: { type: Type.STRING, description: "Zeitpunkt, Ära oder Kapitel des Ereignisses." },
              description: { type: Type.STRING, description: "Genaue Schilderung, was passiert ist." },
              impact: { type: Type.STRING, description: "Auswirkung auf die Beziehung (z.B. '+20 Vertrauen', 'Verdeckte Rivalität begründet')." }
            },
            required: ["title", "description"]
          },
          description: "Chronologische Liste von 1 bis 3 prägenden Schlüsselereignissen oder Wendepunkten."
        }
      },
      required: [
        "targetCharacter", "type", "relationshipStatus"
      ]
    };
  }

  private static getMotivationCoreSchema() {
    return {
      type: Type.OBJECT,
      description: "Motivationskern und Entscheidungsantrieb des Charakters",
      properties: {
        mainGoal: { type: Type.STRING, description: "Übergeordnetes Hauptziel / Bestrebung." },
        whyGoal: { type: Type.STRING, description: "Persönlicher Antrieb / Warum will der Charakter dieses Ziel erreichen? (z.B. Macht, Sicherheit, Freiheit, Rache, Anerkennung, Schutz)." },
        currentPriorities: { type: Type.STRING, description: "Was beschäftigt den Charakter momentan besonders?" },
        needs: { type: Type.STRING, description: "Bedürfnisse (z.B. Nahrung, Geld, Sicherheit, soziale Anerkennung, Einfluss, Schutz, Informationen)." },
        fears: { type: Type.STRING, description: "Ängste / Gefahren und Situationen, die Entscheidungen leiten oder vermieden werden sollen." },
        valuesPrinciples: { type: Type.STRING, description: "Werte und moralische Grundsätze, die das Verhalten bestimmen." },
        methodsAndMeans: { type: Type.STRING, description: "Bevorzugte Mittel und Vorgehensweisen (z.B. Diplomatie, List, Gewalt, Verhandlung, Täuschung)." },
        changeTriggers: { type: Type.STRING, description: "Welche Ereignisse oder Enthüllungen können Ziele oder Prioritäten verändern?" }
      },
      required: ["mainGoal", "whyGoal", "currentPriorities", "needs", "fears", "valuesPrinciples", "methodsAndMeans", "changeTriggers"]
    };
  }

  private static getPersonalityTraitsSchema() {
    return {
      type: Type.OBJECT,
      description: "Persönlichkeitsmerkmale auf einer Skala von 0 bis 100",
      properties: {
        freundlichkeit: { type: Type.INTEGER, description: "0 (unfreundlich) bis 100 (herzlich)" },
        geselligkeit: { type: Type.INTEGER, description: "0 (einzelgängerisch) bis 100 (gesellig)" },
        schuechternheit: { type: Type.INTEGER, description: "0 (selbstsicher) bis 100 (schüchtern)" },
        selbstvertrauen: { type: Type.INTEGER, description: "0 (unsicher) bis 100 (selbstsicher)" },
        geduld: { type: Type.INTEGER, description: "0 (ungeduldig) bis 100 (geduldig)" },
        temperament: { type: Type.INTEGER, description: "0 (ruhig) bis 100 (hitzköpfig)" },
        mut: { type: Type.INTEGER, description: "0 (ängstlich) bis 100 (mutig)" },
        risikobereitschaft: { type: Type.INTEGER, description: "0 (vorsichtig) bis 100 (risikofreudig)" },
        empathie: { type: Type.INTEGER, description: "0 (gefühllos) bis 100 (einfühlsam)" },
        ehrlichkeit: { type: Type.INTEGER, description: "0 (unehrlich) bis 100 (ehrlich)" },
        loyalitaet: { type: Type.INTEGER, description: "0 (wechselhaft) bis 100 (loyal)" },
        misstrauen: { type: Type.INTEGER, description: "0 (vertrauensvoll) bis 100 (misstrauisch)" },
        dominanz: { type: Type.INTEGER, description: "0 (unterwürfig) bis 100 (dominant)" },
        durchsetzungsvermoegen: { type: Type.INTEGER, description: "0 (nachgiebig) bis 100 (durchsetzungsstark)" },
        disziplin: { type: Type.INTEGER, description: "0 (undiszipliniert) bis 100 (diszipliniert)" },
        neugier: { type: Type.INTEGER, description: "0 (desinteressiert) bis 100 (neugierig)" },
        kreativitaet: { type: Type.INTEGER, description: "0 (pragmatisch) bis 100 (kreativ)" },
        intelligenzorientierung: { type: Type.INTEGER, description: "0 (intuitiv) bis 100 (analytisch)" },
        emotionalitaet: { type: Type.INTEGER, description: "0 (rational) bis 100 (emotional)" },
        impulsivitaet: { type: Type.INTEGER, description: "0 (bedacht) bis 100 (impulsiv)" },
        humor: { type: Type.INTEGER, description: "0 (ernst) bis 100 (verspielt)" },
        eitelkeit: { type: Type.INTEGER, description: "0 (bescheiden) bis 100 (eitel)" },
        materialismus: { type: Type.INTEGER, description: "0 (genügsam) bis 100 (materialistisch)" },
        ordnungsliebe: { type: Type.INTEGER, description: "0 (chaotisch) bis 100 (ordentlich)" }
      }
    };
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
        personalityArchetype: { type: Type.STRING, description: "Der passende Persönlichkeits-Archetyp oder Typus (z.B. Tsundere, Kuudere, Dandere, Deredere, Yandere, Kamidere, Himedere, Bakadere, Mayadere, Oujidere, Sadodere, Yangire, Bokukko, Nyandere, Chuunibyou, Dojikko, Gyaru, Tomboy, Yamato Nadeshiko, Genki, Kuudere-Typ, Ojou-sama, Femme Fatale, Anti-Held, Mentor, Trickster, Beschützer, Stratege, Rebell, Loyaler Ritter, Einzelgänger, Idealist, Melancholiker, Exzentriker) oder '-' falls neutral." },
        personalityTraits: this.getPersonalityTraitsSchema(),
        bio: { 
          type: Type.STRING, 
          description: "Detaillierte Vergangenheit / Biografie des Charakters. Die KI MUSS zwingend die folgenden 8 Kernfragen in chronologischem Fließtext beantworten, mit jeweils EXAKT 2 BIS 3 SÄTZEN pro Frage (insgesamt 16-24 Sätze): 1. Wo und in welchen Verhältnissen aufgewachsen? (2-3 Sätze) 2. Kindheit beschreiben? (2-3 Sätze) 3. Wichtige Menschen in Kindheit & Jugend? (2-3 Sätze) 4. Wichtiges Lebens-Veränderungsereignis? (2-3 Sätze) 5. Weg zum heutigen Leben/Beruf/Rolle? (2-3 Sätze) 6. Prägende Erlebnisse & Erfahrungen (1-3 Punkte)? (2-3 Sätze) 7. Bereuen, Verlieren oder Ändern? (2-3 Sätze) 8. Verschwiegenes Geheimnis? (2-3 Sätze). Alles MUSS in der VERGANGENHEIT liegen." 
        },
        currentSituation: { type: Type.STRING, description: "Was macht die Person gerade, bevor sie dem Spieler begegnet? Dies MUSS sich rein auf ihre eigene Vergangenheit oder ihren eigenen aktuellen Alltag beziehen, VÖLLIG UNABHÄNGIG vom Spieler. Sie darf nichts über die aktuelle Lage des Spielers wissen oder darauf Bezug nehmen!" },
        goal: { type: Type.STRING, description: "Was will die Person erreichen?" },
        motivationCore: this.getMotivationCoreSchema(),
        powerSource: { type: Type.STRING, description: "Herkunft der Kraft, z.B. Teufelsfrucht, Mana, Chakra, Technologie." },
        powerCost: { type: Type.STRING, description: "Kosten oder Limitierungen der Kraft, z.B. Ausdauer, MP, Lebensenergie, Nebenwirkungen." },
        skills: { type: Type.STRING, description: "Die eigentliche Spezialfähigkeit oder Kraft detailliert beschrieben." },
        profession: { type: Type.STRING, description: "Hauptberuf oder Spezialisierung des Charakters." },
        professionLevel: { type: Type.STRING, description: "Berufslevel oder Ausbildungsgrad (z.B. Lehrling, Geselle, Experte, Meister, Großmeister, Autodidakt)." },
        secondaryProfessions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              profession: { type: Type.STRING, description: "Nebenberuf oder Zweitausbildung." },
              professionLevel: { type: Type.STRING, description: "Ausbildungsgrad im Nebenberuf (z.B. Geselle, Autodidakt, Anfänger)." },
              jobTitle: { type: Type.STRING, description: "Position, Titel oder Rang im Nebenberuf." },
              description: { type: Type.STRING, description: "Aufgaben und Fähigkeiten im Nebenberuf." }
            }
          },
          description: "Liste weiterer Nebenberufe und Nebenqualifikationen des Charakters."
        },
        jobTitle: { type: Type.STRING, description: "Gilde, Organisation, Position, Titel oder Rang des Charakters." },
        professionDescription: { type: Type.STRING, description: "Beschreibung der beruflichen Pflichten, Tätigkeiten und Arbeitsalltag." },
        craftingSkills: { type: Type.STRING, description: "Handwerk, Fertigung & Nebenberufe (z.B. Schmieden, Trankbrauen, Kochen)." },
        talents: { type: Type.STRING, description: "Spezielle Talente und Fachwissen (z.B. Schlösser knacken, Feilschen, Kartografie)." },
        everydaySkills: { type: Type.STRING, description: "Alltagskompetenzen und praktische Fertigkeiten (z.B. Reiten, Schwimmen, Musizieren)." },
        toolsAndEquipment: { type: Type.STRING, description: "Berufswerkzeuge, Lizenzen und Ausrüstung." },
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
            gender: { type: Type.STRING, description: "Geschlecht des Charakters (z.B. 'Weiblich', 'Männlich', 'Divers', 'Futanari', 'Unbekannt')." },
            outfit: { type: Type.STRING, description: "Detaillierte Beschreibung der Kleidung." },
            looks: { type: Type.STRING, description: "Aussehen des Charakters (Gesichtszüge, Haarlänge/Haarstil, Sommersprossen, Narben, Tätowierungen, etc.). Dies bezieht sich auf den untransformierten Basis-Zustand." },
            cupSize: { type: Type.STRING, description: "Nur für weibliche Charaktere: Körbchengröße (z.B. 'C', 'D', 'DD', 'J'), bei männlichen '-'. WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Nami, Robin, etc.), verwende zwingend ihre offizielle kanonische Körbchengröße (z.B. 'J', 'I' etc.)!" },
            height: { type: Type.STRING, description: "Größe des Charakters (z.B. '175 cm'). WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Monkey D. Garp, Son Goku, etc.), MUSST du zwingend seine offizielle/kanonische Original-Größe eintragen (z.B. Monkey D. Garp ist '287 cm', Son Goku ist '175 cm', Charlotte Katakuri ist '509 cm', Whitebeard ist '666 cm', Kaido ist '710 cm', Big Mom ist '880 cm', Nico Robin ist '188 cm'). Verwende NIEMALS standardisierte oder geschätzte Werte, sondern immer die echten kanonischen Werte!" },
            measurements: { type: Type.STRING, description: "Körpermaße, z.B. 90-60-90. Bei männlichen '-'. WICHTIG: Falls es sich um einen bekannten Franchise-Charakter handelt (z.B. Nami, Robin, etc.), verwende zwingend die offiziellen kanonischen Körpermaße (z.B. Nami hat '98-58-88', Nico Robin hat '100-60-90')!" },
            origin: { type: Type.STRING, description: "Herkunftsort oder Land" },
            family: { type: Type.STRING, description: "Familie oder Clan" },
            faction: { type: Type.STRING, description: "Zugehörige Fraktion oder Gilde" },
            race: { type: Type.STRING, description: "Rasse des Charakters, z.B. Mensch, Elf, Vampir" },
            raceFeatures: { type: Type.STRING, description: "Rassemerkmale wie Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe, Muster, Verteilung am Körper), ein Katzenkopf oder andere nicht-menschliche, tierische oder fantastische körperliche Abweichungen von der menschlichen Norm. Falls der Charakter ein gewöhnlicher Mensch ist, trage 'keine' ein." }
          },
          required: ["hairColor", "eyeColor", "age", "build", "gender", "outfit", "looks", "cupSize", "height", "measurements", "origin", "family", "faction", "race", "raceFeatures"]
        },
        relationship: { type: Type.STRING, description: "Beziehungen des Charakters zu anderen Charakteren oder Gruppierungen. WICHTIG: Er darf den Hauptcharakter/Spieler noch nicht getroffen haben (es sei denn, sie haben eine gemeinsame Vergangenheit wie Familie). Er darf absolut KEINERLEI Wissen über die aktuelle, gegenwärtige Situation des Spielers haben!" },
        conduct: { type: Type.STRING, description: "Das Verhalten des Charakters, wie er sich anderen gegenüber verhält." },
        relationships: {
          type: Type.ARRAY,
          items: this.getRelationshipItemSchema(),
          description: "Vollständig strukturierte Beziehungen zu anderen Charakteren der Welt (Codex-Einträge oder NPCs) inklusive Anreden, Wahrnehmung, Tabus, Vergangenheit, direktionale Werte und Ereignisse."
        },
        abilities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name der Fähigkeit, Technik oder Transformation (z.B. 'Elementarmanipulation', 'Schutzbarrieren', 'Dimensionsrisse', 'Reine Esper-Form')." },
              category: { 
                type: Type.STRING, 
                enum: ["Passive Fähigkeiten", "Techniken", "Ultimative Techniken", "Transformationen", "Talente"], 
                description: "Die genaue Kategorie der Fähigkeit: 'Passive Fähigkeiten', 'Techniken', 'Ultimative Techniken', 'Transformationen' oder 'Talente'." 
              },
              source: { type: Type.STRING, description: "Die Kraftquelle für diese Fähigkeit (z.B. Willenskraft, Mana, Ausdauer)." },
              cost: { type: Type.STRING, description: "Die Ressourcenkosten für die Nutzung (z.B. MP, Ausdauer, Wut)." },
              description: { type: Type.STRING, description: "Eine detaillierte Beschreibung der Kräfte oder der transformierten Gestalt." },
              techniques: { type: Type.STRING, description: "Die Namen der Techniken/Attacken, die zu dieser Fähigkeit gehören, als kommagetrennte Liste." },
              activationCondition: { type: Type.STRING, description: "Bedingung oder Trigger zum Aktivieren/Verwandeln (z.B. 'Unter 30% HP', 'Bei Vollmond', 'Konzentration von 3 Sekunden')." },
              transformName: { type: Type.STRING, description: "Der Name des Charakters im transformierten Zustand (falls abweichend, z.B. 'Bestien-Ruffy' oder 'Super-Saiyajin Goku')." },
              transformRole: { type: Type.STRING, description: "Die RPG-Rolle im transformierten Zustand (z.B. 'Entfesselter Gott' oder 'Rasende Bestie')." },
              transformGender: { type: Type.STRING, description: "Geschlecht im transformierten Zustand (z.B. 'Männlich', 'Weiblich', 'Divers', 'Futanari')." },
              transformCupSize: { type: Type.STRING, description: "Körbchengröße im transformierten Zustand (falls verändert)." },
              transformHairColor: { type: Type.STRING, description: "Haarfarbe im transformierten Zustand (falls verändert)." },
              transformEyeColor: { type: Type.STRING, description: "Augenfarbe im transformierten Zustand (falls verändert)." },
              transformBuild: { type: Type.STRING, description: "Körperstatur im transformierten Zustand (z.B. 'Kolossal', 'Muskulös', 'Zierlich')." },
              transformAge: { type: Type.STRING, description: "Alter im transformierten Zustand (falls verändert, z.B. 'Unbekannt' oder 'Gealtert')." },
              transformRace: { type: Type.STRING, description: "Rasse im transformierten Zustand (z.B. 'Werwolf', 'Dämon', 'Phönix')." },
              transformRaceFeatures: { type: Type.STRING, description: "Körperliche Abweichungen/Merkmale im transformierten Zustand (z.B. Flügel, goldene Aura, Hörner, Fell, Krallen)." },
              transformHeight: { type: Type.STRING, description: "Größe im transformierten Zustand (z.B. '350 cm' oder '125 cm')." },
              transformWeight: { type: Type.STRING, description: "Gewicht im transformierten Zustand (z.B. '450 kg' oder '28 kg')." },
              transformBodyFat: { type: Type.STRING, description: "Körperfettanteil (KFA) im transformierten Zustand (z.B. '15%')." },
              transformMuscleMass: { type: Type.STRING, description: "Muskelmasse im transformierten Zustand (z.B. '45%')." },
              transformMeasurements: { type: Type.STRING, description: "Körpermaße im transformierten Zustand (z.B. '150-100-110')." },
              transformOrigin: { type: Type.STRING, description: "Herkunftsort im transformierten Zustand (meist gleich)." },
              transformFamily: { type: Type.STRING, description: "Zugehöriger Clan im transformierten Zustand." },
              transformFaction: { type: Type.STRING, description: "Zugehörige Fraktion im transformierten Zustand." },
              transformOutfit: { type: Type.STRING, description: "Die Kleidung/Rüstung im transformierten Zustand (z.B. 'Zerrissener Umhang', 'Goldene Plattenrüstung')." },
              transformLooks: { type: Type.STRING, description: "Das Gesichtsaussehen, Haarfarbe, Augenfarbe und Gesichtszüge während der Transformation (z.B. 'Lange, goldene, wild abstehende Haare, leuchtend smaragdgrüne Augen, entschlossene Miene')." },
              transformWings: { type: Type.BOOLEAN, description: "Ob der Charakter im transformierten Zustand Flügel besitzt." },
              transformHorns: { type: Type.BOOLEAN, description: "Ob der Charakter im transformierten Zustand Hörner besitzt." },
              techniqueList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name der Technik." },
                    type: { type: Type.STRING, enum: ["Angriff", "Transformation", "Verteidigung", "Support"], description: "Typ der Technik." },
                    description: { type: Type.STRING, description: "Beschreibung der Technik." },
                    subtype: { type: Type.STRING, description: "Untertyp." },
                    tier: { type: Type.STRING, enum: ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] },
                    baseValue: { type: Type.INTEGER },
                    costFormula: { type: Type.STRING, enum: ["absolut", "proz."] },
                    costValue: { type: Type.INTEGER },
                    costResourceName: { type: Type.STRING }
                  },
                  required: ["name", "type", "description"]
                }
              }
            },
            required: ["name", "category", "source", "cost", "description"]
          },
          description: "Eine Liste aller Fähigkeiten des Charakters. Standard-Fähigkeiten sowie spezielle Transformations-Fähigkeiten (Gestaltwechsel / Formänderungen / Power-ups) gehören hierhin."
        },
        secretsStage1: { type: Type.STRING, description: "Stufe 1 (Öffentliches Wissen): Allgemeine Gerüchte, Legenden oder oberflächliches Wissen aus der HISTORISCHEN VERGANGENHEIT. Muss zur Gesinnung und Rolle passen (z.B. verzerrte Wahrnehmungen von Außenstehenden). Es darf sich auf KEINEN Fall auf aktuelle Vorkommnisse oder das Geheimnis des Spielers beziehen." },
        secretsStage2: { type: Type.STRING, description: "Stufe 2 (Indizien & Verdacht): Begründete Gerüchte, versteckte Vorbereitungen oder Indizien aus der VORGESCHICHTE. Darf NIEMALS ohne Anlass böse Klischees (wie Gehirnwäscher/Opferkulte) erfinden, wenn die Person beschützende oder edle Ziele hat!" },
        secretsStage3: { type: Type.STRING, description: "Stufe 3 (Absolutes Geheimnis - Blackbox): Das tiefe, wahre Geheimnis aus der VORGESCHICHTE. MUSS zwingend im Einklang mit dem Hauptziel (goal) und der Gesinnung stehen (z.B. bei Beschützern ein geheimer Schutzbund/Zufluchtsort; bei Schurken finstere Pläne). Zu Spielbeginn niemandem bekannt." },
        knowledge: { type: Type.STRING, description: "Verhüllung & Geteiltes Wissen: Wer weiß was über wen? Beschreibe, welche Techniken, Aussehen oder Vergangenheitsaspekte andere Charaktere (oder der Spieler) aktuell voneinander wissen. WICHTIG: Zu Beginn der Kampagne wissen Charaktere meistens nur das Offensichtliche voneinander." }
      },
      required: ["name", "nickname", "role", "personality", "bio", "currentSituation", "goal", "motivationCore", "powerSource", "powerCost", "skills", "techniques", "techniqueList", "appearance", "relationship", "conduct", "relationships", "abilities", "secretsStage1", "secretsStage2", "secretsStage3", "knowledge"]
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

  static sanitizeAndRepairTransformations(char: any): any {
    if (!char || typeof char !== 'object') return char;
    const rawAbilities: any[] = Array.isArray(char.abilities) ? [...char.abilities] : [];
    const baseApp = char.appearance || {};

    const existingNames = new Set(rawAbilities.map((a: any) => (a.name || '').toLowerCase().trim()).filter(Boolean));

    // 1. Extract any techniques from top-level techniqueList if they don't already exist as standalone abilities
    if (char.techniqueList && Array.isArray(char.techniqueList)) {
      char.techniqueList.forEach((tech: any) => {
        const tName = (tech.name || '').trim();
        if (tName && !existingNames.has(tName.toLowerCase())) {
          existingNames.add(tName.toLowerCase());
          const tType = (tech.type || '').toLowerCase();
          const tDesc = tech.description || '';
          const tNameLower = tName.toLowerCase();
          
          let cat = 'Techniken';
          if (tType === 'transformation' || tNameLower.includes('form') || tNameLower.includes('metamorphose')) {
            cat = 'Transformationen';
          } else if (tNameLower.includes('passiv') || tNameLower.includes('empathie') || tNameLower.includes('wiederherstellung') || tNameLower.includes('aura') || tNameLower.includes('immunität') || tDesc.toLowerCase().includes('passiv')) {
            cat = 'Passive Fähigkeiten';
          } else if (tNameLower.includes('ultimativ') || tNameLower.includes('explosion') || tNameLower.includes('dimensionsriss') || tNameLower.includes('finisher') || tNameLower.includes('vollständige') || (tech.tier && tech.tier.includes('4'))) {
            cat = 'Ultimative Techniken';
          } else if (tNameLower.includes('talent') || tNameLower.includes('fokus') || tNameLower.includes('begabung')) {
            cat = 'Talente';
          }

          rawAbilities.push({
            name: tName,
            category: cat,
            source: char.powerSource || '',
            cost: tech.costValue ? `${tech.costValue} ${tech.costResourceName || ''}`.trim() : (char.powerCost || ''),
            description: tDesc,
            techniqueList: [tech],
            techniques: tName
          });
        }
      });
    }

    // 2. Extract sub-techniques from inside transformation / container abilities if they are standalone combat powers
    rawAbilities.forEach((ab: any) => {
      if (ab.techniqueList && Array.isArray(ab.techniqueList)) {
        ab.techniqueList.forEach((tech: any) => {
          const tName = (tech.name || '').trim();
          const tNameLower = tName.toLowerCase();
          // Skip generic activation / return moves
          if (tNameLower === 'aktivierung' || tNameLower === 'zurückverwandlung' || tNameLower === 'deaktivierung' || tNameLower === 'rückverwandlung') return;

          if (tName && !existingNames.has(tNameLower)) {
            existingNames.add(tNameLower);
            const tType = (tech.type || '').toLowerCase();
            const tDesc = tech.description || '';

            let cat = 'Techniken';
            if (tType === 'transformation' || tNameLower.endsWith('-form') || tNameLower.endsWith(' form')) {
              cat = 'Transformationen';
            } else if (tNameLower.includes('passiv') || tNameLower.includes('empathie') || tNameLower.includes('wiederherstellung') || tNameLower.includes('aura') || tNameLower.includes('immunität') || tDesc.toLowerCase().includes('passiv')) {
              cat = 'Passive Fähigkeiten';
            } else if (tNameLower.includes('ultimativ') || tNameLower.includes('explosion') || tNameLower.includes('dimensionsriss') || tNameLower.includes('finisher') || tNameLower.includes('vollständige elementarkontrolle') || (tech.tier && tech.tier.includes('4'))) {
              cat = 'Ultimative Techniken';
            } else if (tNameLower.includes('talent') || tNameLower.includes('fokus') || tNameLower.includes('begabung')) {
              cat = 'Talente';
            }

            rawAbilities.push({
              name: tName,
              category: cat,
              source: ab.source || char.powerSource || '',
              cost: tech.costValue ? `${tech.costValue} ${tech.costResourceName || ''}`.trim() : (ab.cost || char.powerCost || ''),
              description: tDesc || `Fähigkeit von ${ab.name || 'Charakter'}: ${tName}`,
              techniqueList: [tech],
              techniques: tName
            });
          }
        });
      }
    });

    const updatedAbilities = rawAbilities.map((ab: any) => {
      const nameLower = (ab.name || ab.transformName || '').toLowerCase().trim();
      const descLower = (ab.description || '').toLowerCase();

      // Check if it is a true transformation
      const isTransCategory = ab.category === 'Transformationen';
      const isStrictFormName = /\b(transformation|metamorphose|gestaltwechsel|verwandlung|werwolf|dämonenform|esper-form|kinder-form|kinderform|super-saiyajin|bestienform)\b/i.test(nameLower) 
        || nameLower.endsWith('-form') || nameLower.endsWith(' form');
      
      const isKnownCombatTechnique = nameLower.includes('manipulation') || nameLower.includes('berührung') || nameLower.includes('telekinese') || nameLower.includes('barriere') || nameLower.includes('schild') || nameLower.includes('riss') || nameLower.includes('levitation') || nameLower.includes('absorption') || nameLower.includes('unterdrückung') || nameLower.includes('explosion') || nameLower.includes('strahl') || nameLower.includes('kugel') || nameLower.includes('hieb') || nameLower.includes('stoß') || nameLower.includes('wiederherstellung') || nameLower.includes('empathie') || nameLower.includes('heilung');

      const isTrueTransformation = (isTransCategory || isStrictFormName) && !isKnownCombatTechnique;

      if (!isTrueTransformation) {
        let category = ab.category;
        if (!category || category === 'Standard' || category === 'Kernfähigkeit' || category === 'Transformationen') {
          if (nameLower.includes('passiv') || nameLower.includes('empathie') || nameLower.includes('wiederherstellung') || nameLower.includes('regen') || nameLower.includes('immunität') || descLower.includes('passiv') || descLower.includes('empathie') || descLower.includes('dauerhaft')) {
            category = 'Passive Fähigkeiten';
          } else if (nameLower.includes('ultimativ') || nameLower.includes('explosion') || nameLower.includes('dimensionsriss') || nameLower.includes('finisher') || nameLower.includes('vollständige elementarkontrolle') || descLower.includes('ultimativ') || descLower.includes('extrem')) {
            category = 'Ultimative Techniken';
          } else if (nameLower.includes('talent') || nameLower.includes('fokus') || nameLower.includes('begabung') || nameLower.includes('meditation') || descLower.includes('talent')) {
            category = 'Talente';
          } else {
            category = 'Techniken';
          }
        }
        return { ...ab, category };
      }

      const repaired = { ...ab, category: 'Transformationen' };

      const isYouth = nameLower.includes('jungbrunn') || nameLower.includes('verjüng') || nameLower.includes('kind') || descLower.includes('jungbrunn') || descLower.includes('verjüng') || descLower.includes('kinder form') || descLower.includes('kinder-form') || descLower.includes('kinderform');
      const isGiant = nameLower.includes('riese') || nameLower.includes('koloss') || nameLower.includes('giant') || descLower.includes('riese') || descLower.includes('koloss');
      const isBeast = nameLower.includes('bestie') || nameLower.includes('beast') || nameLower.includes('dämon') || nameLower.includes('werwolf');

      if (!repaired.transformAge) {
        if (isYouth) repaired.transformAge = '6-8 Jahre (Kinder-Form)';
        else if (descLower.includes('greis') || descLower.includes('alt')) repaired.transformAge = '80 Jahre';
        else repaired.transformAge = baseApp.age || 'Unverändert';
      }

      if (!repaired.transformBuild) {
        if (isYouth) repaired.transformBuild = 'Kindlich / Zierlich';
        else if (isGiant) repaired.transformBuild = 'Kolossal / Muskelbepackt';
        else if (isBeast) repaired.transformBuild = 'Muskulös / Bestialisch';
        else repaired.transformBuild = baseApp.build || 'Schlank';
      }

      if (!repaired.transformHeight) {
        if (isYouth) repaired.transformHeight = '115 cm';
        else if (isGiant) repaired.transformHeight = '380 cm';
        else repaired.transformHeight = baseApp.height || '175 cm';
      }

      if (!repaired.transformWeight) {
        if (isYouth) repaired.transformWeight = '24 kg';
        else if (isGiant) repaired.transformWeight = '450 kg';
        else repaired.transformWeight = baseApp.weight || '75 kg';
      }

      if (!repaired.transformRace) {
        if (isBeast) repaired.transformRace = nameLower.includes('wolf') ? 'Werwolf' : 'Dämon';
        else repaired.transformRace = baseApp.race || 'Mensch';
      }

      if (!repaired.transformLooks) {
        repaired.transformLooks = isYouth 
          ? 'Kindliche, verjüngte Gesichtszüge durch Erschöpfung oder Metamorphose' 
          : `Körperliche Veränderung und Entfaltung im Zustand von "${ab.name || 'Transformation'}"`;
      }

      if (!repaired.transformOutfit) {
        if (descLower.includes('nackt') || descLower.includes('verschwinden')) {
          repaired.transformOutfit = 'Kleidung verschwindet während der Verwandlung (in dieser Form nackt) und kehrt nach der Rückverwandlung wieder zurück';
        } else if (descLower.includes('normale größe') || descLower.includes('behält ihre normale größe') || descLower.includes('schlotter')) {
          repaired.transformOutfit = 'Normale Kleidung behält Originalgröße und fällt am kindlichen Körper zu weit aus';
        } else {
          const baseOutfit = baseApp.outfit || 'Standardkleidung';
          repaired.transformOutfit = `${baseOutfit} (Passt sich elastisch der veränderten Größe der Form an)`;
        }
      }

      return repaired;
    });

    return {
      ...char,
      abilities: updatedAbilities
    };
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
      
      ${CHARACTER_BIO_7_QUESTIONS_PROMPT}
      
      ### KI-REGEL: GLAUBWÜRDIGKEIT, ALLTÄGLICHKEIT & BODENSTÄNDIGKEIT:
      - Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe.
      - Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
      - Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.
      
      ### WICHTIG FÜR TRANSFORMATIONEN & KÖRPERLICHE VERÄNDERUNGEN (SCHRITT 1 ZU SCHRITT 6 LOGIK):
      Falls die Welten-Beschreibung (${world.description}), der Prolog oder die Charakter-Daten eine Transformation, Metamorphose, körperliche Mutation, Fluch oder Gestaltwechsel beschreiben oder nahelegen (z.B. vom Menschen zum Dämon/Drachen/Vampir/Bestie, Gears, Werwolf, Magie-Transformation):
      1. WAS ER DAVOR WAR (Ursprünglicher Zustand):
         - Die Biografie ('bio') und das unmodifizierte 'appearance'-Profil ('race', 'looks', 'build', 'hairColor', 'eyeColor', etc.) MÜSSEN den ursprünglichen Zustand des Charakters VOR der Verwandlung beschreiben (seine ursprüngliche menschliche/elfische Herkunft, altes Aussehen, Name, wie die Verwandlung stattfand).
      2. WELCHE BEZIEHUNGEN ER MIT WEM HATTE (Vorgeschichte der Beziehungen):
         - In den Beziehungs-Feldern ('relationship', 'conduct') MUSS explizit herausgestellt werden, welche Beziehungen er VOR der Transformation mit wem hatte (Familie, alte Gefährten, Verlobte, Rivalen) UND wie sich diese Beziehungen durch die körperliche Veränderung entwickelt haben (z. B. ob alte Freunde ihn in der neuen Gestalt nicht mehr erkennen, ihn für tot halten, seine neue Form als Monster fürchten/jagen oder ihm helfen wollen).
      3. DIE NEUE TRANSFORMATION ALS ABILITY & IM ZUSTAND:
         - Erstelle zwingend einen Eintrag in 'abilities' mit 'category: "Transformationen"' und allen 'transform...'-Feldern ('transformLooks', 'transformOutfit', 'transformRace', 'transformRaceFeatures' wie Flügel, Hörner, Schuppen, Klauen, etc.) SOWIE Aktivierungs- und Zurückverwandlungs-Techniken unter 'techniqueList'.
         - Beschreibe in 'currentSituation', wie der Charakter heute mit dieser Verwandlung lebt und wie sie sein aktuelles Leben bestimmt.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
      return this.sanitizeAndRepairTransformations(data);
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
      
      ${CHARACTER_BIO_7_QUESTIONS_PROMPT}
      
      ### KI-REGEL: GLAUBWÜRDIGKEIT, ALLTÄGLICHKEIT & BODENSTÄNDIGKEIT:
      - Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe.
      - Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
      - Nicht jeder Charakter benötigt eine persönliche Geschichte, die für den Spieler relevant ist. Die meisten Bewohner dürfen ein gewöhnliches Leben führen.
      - Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.
      
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
        model: 'gemini-3.8-flash',
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
      
      ${CHARACTER_BIO_7_QUESTIONS_PROMPT}
      
      ### KI-REGEL: GLAUBWÜRDIGKEIT, ALLTÄGLICHKEIT & BODENSTÄNDIGKEIT:
      - Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe.
      - Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
      - Nicht jeder Charakter benötigt eine persönliche Geschichte, die für den Spieler relevant ist. Die meisten Bewohner dürfen ein gewöhnliches Leben führen.
      - Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.
      
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
        model: 'gemini-3.8-flash',
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

      const contextPrompt = `
      Du bist ein genialer RPG-Weltenschöpfer, Game Master und Storyteller.
      Deine Aufgabe ist es, eine komplette, stimmungsvolle und hochgradig konsistente Rollenspiel-Kampagne auf DEUTSCH zu entwerfen.
      
      ### GEGEBENE INFOS:
      - Titel der Welt: ${existingTitle || 'Zufällig'}
      - Beschreibung: ${existingDesc || 'Zufällig'}
      - Genres / Tags: ${tags.join(', ')}
      - Drama-Level / Konflikt-Intensität: ${dramaLevel}
      ${nsfwContext}
      ${heroicContext}
      ${dramaContext}
      ${profileContext}
      
      ### DEINE INSTRUKTIONEN:
      0. ERHALTUNG DER NUTZER-INFOS IN DER BESCHREIBUNG (MANDATORY):
         Falls der Nutzer bereits eine eigene 'Beschreibung' eingegeben hat (also wenn diese nicht leer oder 'Zufällig' ist), MUSS diese Beschreibung deine unumstößliche, primäre Informationsquelle sein!
         Alle darin erwähnten Fakten, Ereignisse, Personen, magischen/technologischen Regeln, Vorgeschichten und Handlungsaspekte MÜSSEN zu 100% erhalten bleiben.
         Deine Aufgabe im Feld 'description' ist es dann NUR, den vom Nutzer geschriebenen Text grammatikalisch zu korrigieren, ihn stilistisch zu verfeinern, präzise auszuformulieren und logisch zu strukturieren. Du darfst passende atmosphärische Details ergänzen, aber NIEMALS irgendwelche Fakten, Namen, Regeln oder Informationen löschen, ignorieren oder durch generischen Standard-Text ersetzen! Wenn die vom Nutzer eingegebene Beschreibung bereits gut und detailliert ist, belasse sie im Rückgabewert 'description' EXAKT unverändert oder glätte sie NUR rein sprachlich, damit absolut keine Benutzerinformationen verloren gehen. Du musst die eingetragenen Infos entweder präzise umschreiben oder den Text komplett so lassen, wie er ist!
      1. Erfinde für jeden Charakter eine packende Vergangenheit (Bio), eine markante Persönlichkeit, ein klares Ziel, besondere Fähigkeiten/Jutsus (skills), das exakte Geschlecht (Männlich oder Weiblich), eine detaillierte Beschreibung der Kleidung (Outfit) und (falls weiblich) eine passende Körbchengröße (cupSize z.B. 'C', 'D'). Bei männlichen Charakteren setze bei cupSize '-' ein. Ebenso MUSS bei nicht-menschlichen Rassen (wie Tiermenschen, Elfen, Dämonen etc.) das Feld 'raceFeatures' (Rassemerkmale) detailreich befüllt werden (z.B. Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell, Fellmuster/farbe, Tierkopf, Flügel, Hörner, Schuppen etc. - also alle physischen Abweichungen von der menschlichen Norm). Bei normalen Menschen trage 'keine' ein.
         ${CHARACTER_BIO_7_QUESTIONS_PROMPT}
      2. Der "player" Charakter MUSS die oben genannten Daten (Name, Aussehen etc.) übernehmen, aber passend in die Welt einbetten.
         - WICHTIG: Erstelle für den Hauptcharakter (player) KEINEN zusätzlichen Eintrag in der 'npcs'-Liste oder in der 'loreDatabase' unter der Kategorie 'Charaktere'! Er wird exklusiv separat im "player"-Feld definiert.
      3. Generiere nur genau so viele NPCs, wie in der Welten-Beschreibung erwähnt werden. Falls dort keine expliziten Charaktere vorkommen, erfinde ca. 1-3 passende NPCs.
         - WICHTIG: Der Hauptcharakter (player) darf niemals in der 'npcs'-Liste vorkommen!
      4. Generiere einen atmosphärischen Prolog, der die Szene setzt und die Welt beschreibt.
         - DER PROLOG DARF NIEMALS GEHEIMPLÄNE, SPOILER ODER DIE ECHTEN IDENTITÄTEN VON TARN-CHARAKTEREN VORWEGNEHMEN!
         - GEHEIMNISSE & VERBORGENES WISSEN (VERBOTENES WISSEN): Sämtliche Einträge der Kategorie 'Verbotenes Wissen' / 'Geheimnisse & Verborgenes Wissen' (wie geheime Abstammung z. B. Kuja-Kriegerinnen, verdeckte Zugehörigkeiten, wahre Identitäten) sind eine absolute BLACKBOX und dürfen unter KEINEN UMSTÄNDEN im Prolog, in den Charakter-Bios oder der ersten Szene verraten oder angedeutet werden!
         - STRENGES KONTROLL- UND HANDLUNGSVERBOT ÜBER SPIELER-KRÄFTE (SPIELER-AUTONOMIE & KEIN SELBSTSTÄNDIGES LOSGEHEN VON FÄHIGKEITEN): Du darfst NIEMALS beschreiben oder entscheiden, dass die Kräfte, Magie, Elementarkräfte (wie Kälte, Eis, Hitze, Feuer etc.), Teufelskräfte oder Fähigkeiten des Spielers von alleine losgehen, passiv lecken, unkontrolliert ausbrechen oder ohne den Willen des Spielers die Umgebung verändern/einfrieren/überhitzen! Der Spieler besitzt die 100%ige Kontrolle über seine Kräfte. Ob und wann er seine Kraft einsetzt, bestimmt EINZIG UND ALLEIN DER SPIELER in seinen eigenen Beiträgen. NPCs dürfen den Spieler nicht belehren oder behandeln, als hätte er seine Kräfte nicht im Griff.
         - STRENGSTES VERBOT DER BEHERRSCHUNG/VORSCHREIBUNG VON GEFÜHLEN ODER UNWILLKÜRLICHEN KÖRPERREAKTIONEN DES NUTZERS:
           Sowohl im Prolog als auch in der Startszene ist es absolut verboten vorzuschreiben, was der Spieler/sein Charakter empfindet, denkt, fühlt oder wie sein Körper unwillkürlich reagiert. 
           Schreibe niemals Sätze wie: "lässt dein Herz einen Schlag aussetzen", "Deine Hände umklammern fester das Lehrbuch", "deine Knöchel werden weiß", "du spürst, wie die Farbe aus deinem Gesicht weicht", "du spürst, wie sich eine eisige Kälte in deiner Brust ausbreitet", "Du musst jetzt reagieren".
           Der Spieler hat die absolute und alleinige Hoheit über seine Gedanken, inneren Reaktionen, Gefühle, unwillkürlichen Reflexe und Taten! Beschreibe nur die äußere Umwelt, die Atmosphäre und das Verhalten von NPCs.
      5. Generiere "firstMessage", die allererste KI-Antwort nach dem Prolog, die den Spieler anredet oder eine erste direkte Interaktionsmöglichkeit in der Szene bietet (als Game Master geschrieben). Sie muss sich ebenfalls strikt an das Verbot der Fremdbestimmung von Gefühlen und unwillkürlichen Körperreaktionen halten!
         - WICHTIG: Stimme den "prologue" und die "firstMessage" zwingend exakt auf das Thema, die angegebenen Tags/Genre, die Welten-Beschreibung und vor allem auf die in "loreDatabase" generierte Geschichte & den Roten Faden der Kampagne (Kategorie 'Events' / eventSteps) ab! Der Prolog muss den allerersten geplanten Story-Schritt (eventSteps) des Roten Fadens atmosphärisch vorbereiten, und die "firstMessage" muss den Spieler direkt in die Situation dieses ersten Story-Schritts versetzen, damit der Spielstart und der Rote Faden perfekt zusammenpassen.
      6. Befülle die "loreDatabase" (Lore-Datenbank) mit mindestens 6-10 Einträgen für diese Welt. EXTRAHIERE ZWINGEND ALLE in der Beschreibung genannten Charaktere (AUSSER dem Hauptcharakter "player"!), Orte, Fraktionen, Gegenstände und Konzepte als detaillierte Einträge. Jeder erwähnte Charakter (AUSSER dem Hauptcharakter "player") MUSS in der Lore-Datenbank als Kategorie "Charaktere" landen! Die Kategorien müssen exakt einer der vordefinierten Werte sein.
         - WICHTIG: Erstelle bei der Weltengenerierung zwingend auch einen prägnanten, informativen Eintrag in der Kategorie 'Weltregeln', der genau beschreibt, wie Gegenstände, Waffen, Magie/Technologie und deren Funktionsweise in dieser Welt geregelt sind und wie sie hergestellt/geschmiedet werden.
         - WICHTIG FÜR GEGENSTÄNDE: Für alle Gegenstände in der Datenbank gilt: Der Fokus liegt ausschließlich auf dem Gegenstand selbst. Es dürfen absolut keine zukünftigen Abenteuer oder Story-Ereignisse gespoilert oder erwähnt werden! Es darf lediglich beschrieben werden, wer den Gegenstand in der Vergangenheit geschmiedet oder getragen hat. Gegenstände müssen sich streng an das Genre und die Welten-Beschreibung anpassen. Nur weil die schmiedende Person besondere Kräfte (wie Teufelskräfte oder Magie) besaß, bedeutet das nicht, dass der Gegenstand diese Kräfte automatisch erbt. Wenn z.B. jemand mit Teufelskräften ein Schwert schmiedet, ist es dennoch ein normales Schwert ohne Teufelskräfte, es sei denn, es wird explizit und logisch ein magischer Transfer begründet.
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
       9. SPEZIELLE ZEITLICHE STRUKTURIERUNG (PROLOG VS. SPIELSTART):
          Achte penibel darauf, ob der Nutzer in der Welten-Beschreibung Ereignisse in unterschiedlichen Zeitebenen verfasst hat (z. B. eine vergangenheitsbezogene Vorgeschichte wie „Gestern ist das passiert / gestern Verwandlung zum Magical Girl / Dämonenangriff“ kombiniert mit einem gegenwärtigen Startpunkt wie „und jetzt sitzt er in der Schule und verhält sich normal“):
          - Wenn eine solche Aufteilung erkennbar ist (Vergangenheit vs. Gegenwart), MUSS der „prologue“ (Prolog) die vergangenheitsbezogenen Ereignisse (z. B. den gestrigen Dämonenkampf) in packender Vergangenheitsform erzählen.
          - Die „firstMessage“ (Erste Szene) MUSS dann direkt an dem gegenwärtigen Startpunkt ansetzen (z. B. der Charakter sitzt im Klassenzimmer) und diesen Zustand in der Gegenwartsform (Präsens) etablieren, um die erste Interaktionsmöglichkeit einzuleiten. Falls der Benutzer keine unterschiedlichen Zeitebenen angibt, leite den Prolog und die Startszene harmonisch aus der Beschreibung ab.
         - Weise dem Spieler und allen NPCs im 'campaignPowerLevelsList'-Feld passende, realistische Startwerte für alle generierten Kampagnen-Parameter zu!
       10. KÖRPERLICHE TRANSFORMATIONEN & METAMORPHOSEN (ÜBERGANG SCHRITT 1 ZU SCHRITT 6):
           Falls in der Welten-Beschreibung (existingDesc) eine Transformation, Metamorphose, körperliche Mutation, ein Gestaltwechsel oder Verwandlungs-Fluch des Hauptcharakters oder eines Charakters erwähnt wird (z. B. vom Menschen zum Dämon/Drachen/Vampir/Bestie verwandelt):
           - WAS ER DAVOR WAR (Ursprünglicher Zustand): Die 'bio' und die normalen 'appearance'-Basiswerte des Spielers MÜSSEN zwingend seinen Zustand VOR der Verwandlung festhalten (seine ursprüngliche Herkunft, altes menschliches/elfisches Aussehen, Name/Rolle, wie die Verwandlung stattfand).
           - BEZIEHUNGEN VOR & NACH DER VERWANDLUNG: In den 'relationship'- und 'conduct'-Feldern sowie bei allen beteiligten NPCs MUSS genau dokumentiert werden, welche Beziehungen er VOR der Verwandlung hatte (Familie, Verlobte, Gefährten, Rivalen) UND wie diese JETZT darauf reagieren (ob sie ihn in der neuen Gestalt nicht erkennen, ihn für tot halten, als Monster jagen oder ihm helfen wollen).
           - DIE NEUE TRANSFORMATION: Die neue Gestalt MUSS als Ability mit 'category: "Transformationen"' (mit 'transformLooks', 'transformOutfit', 'transformRaceFeatures' wie Flügel, Hörner, Schuppen, Klauen, Aktivierungs- & Zurückverwandlungstechniken) SOWIE in 'currentSituation' verankert werden!`;

      const charSchema = this.getCharacterSchema();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
                      description: "Muss exakt einer dieser Werte sein: 'Charaktere', 'Orte', 'Fraktionen', 'Gegenstände', 'Verbotenes Wissen', 'Story & Quests', 'Weltregeln', 'Gegner', 'Zeitlinie'" 
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
                          leader: { type: Type.STRING },
                          physicalWidth: { type: Type.INTEGER, description: "Physische Breite (Ost-West Ausdehnung) des Ortes. Wenn mapLevel 'micro' ist, in Metern (m) (z.B. 10 bis 500). Wenn mapLevel 'meso' ist, in Kilometern (km) (z.B. 2 bis 50). Wenn mapLevel 'macro' ist, in Kilometern (km) (z.B. 200 bis 5000)." },
                          physicalHeight: { type: Type.INTEGER, description: "Physische Höhe (Nord-Süd Ausdehnung) des Ortes. Wenn mapLevel 'micro' ist, in Metern (m) (z.B. 10 bis 500). Wenn mapLevel 'meso' ist, in Kilometern (km) (z.B. 2 bis 50). Wenn mapLevel 'macro' ist, in Kilometern (km) (z.B. 200 bis 5000)." }
                        }
                    },
                    isUnlocked: { type: Type.BOOLEAN },
                    order: { type: Type.INTEGER },
                    secretsStage1: { type: Type.STRING, description: "Stufe 1 (Öffentliches Wissen): Öffentliche Legenden/Gerüchte aus der Vorgeschichte. Muss zur Gesinnung und Rolle passen." },
                    secretsStage2: { type: Type.STRING, description: "Stufe 2 (Indizien & Verdacht): Indizien oder begründete Gerüchte. Keine unbegründeten Bösewicht-Klischees bei beschützenden/edlen Charakteren!" },
                    secretsStage3: { type: Type.STRING, description: "Stufe 3 (Absolutes Geheimnis): Das tiefe, wahre Geheimnis (Blackbox), das zwingend im Einklang mit dem Hauptziel (goal) und der wahren Motivation steht." },
                    knowledge: { type: Type.STRING, description: "Verhüllung & Geteiltes Wissen: Wer weiß was über wen? Beschreibe, welche Techniken, Aussehen oder Vergangenheitsaspekte andere Charaktere (oder der Spieler) aktuell voneinander wissen. WICHTIG: Zu Beginn der Kampagne wissen Charaktere meistens nur das Offensichtliche voneinander." }
                  },
                  required: ["category", "title", "description", "isUnlocked", "secretsStage1", "secretsStage2", "secretsStage3", "knowledge"]
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
      - Genres / Tags (kann leer sein): ${tags.join(', ') || 'Keine Angabe - bitte generiere 3-5 passende Genre-Tags'}
      - Beschreibung (kann leer sein): ${description || 'Keine Angabe - bitte generiere eine packende, atmosphärische Beschreibung (mindestens 2-3 Sätze)'}
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
      8. WELTEN-BESCHREIBUNG & TAGS: Falls die übergebene Welten-Beschreibung oder die Genres/Tags leer oder unvollständig waren, generiere eine detailreiche, mitreißende Beschreibung und wähle 3-5 passende Genre-Tags aus, die perfekt zu der Atmosphäre passen. Wenn sie bereits vorhanden sind, behalte sie bei oder verfeinere sie dezent. Gib diese in 'generatedDescription' und 'generatedTags' zurück.
      
      Die Generierung muss inhaltlich hochqualitativ, spielmechanisch schlüssig und perfekt auf das Genre (Fantasy, Sci-Fi, Cyberpunk, Slice of Life, etc.) abgestimmt sein!`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              generatedDescription: { type: Type.STRING, description: "Eine packende, detaillierte Welten-Beschreibung, falls die übergebene Beschreibung leer war, oder eine verfeinerte Version." },
              generatedTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Eine Liste von 3-5 passenden Genre-Tags/Labels für diese Welt." },
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
              "techniqueRulesList", "generatedDescription", "generatedTags"
            ]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateWorldMapAndRulesFromSixCreationRules(
    title: string,
    description: string,
    tags: string[],
    isNsfw?: boolean,
    smartFillPrompt?: string,
    existingMapContext?: string
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Abenteuer-Schreiber und Kartograf für anspruchsvolle RPGs.
Analysiere die folgende Weltbeschreibung und Tags/Genres:
Weltname: "${title}"
Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]
${smartFillPrompt ? `SPEZIELLE NUTZER-ANWEISUNG / SMART FILL ERWEITERUNG (Ebene: WELT): "${smartFillPrompt}"
WICHTIGSTE GEBOT FÜR DIESEN SMART FILL AUFTRAG:
1. Erzeuge AUSSCHLIESSLICH die Elemente, die vom Nutzer in "${smartFillPrompt}" gefordert werden.
2. ERZEUGE KEINE ZUSÄTZLICHEN ZUFÄLLIGEN REGIONEN, STAATEN ODER ORTE! Wenn der Nutzer z.B. nur ein spezielles Biom anfordert, gib in regions/terrains NUR dieses Biom zurück und lass civilizations, places, connections als leere Arrays [], sofern sie nicht explizit gefordert wurden.

[VERBOT VON STARREN REIHEN & STREIFEN-MUSTERN]:
Es ist dir STRENGSTENS VERBOTEN, das Kachel-Gitter oder die Grenzen in perfekten horizontalen oder vertikalen Streifen aufzubauen (z.B. minX=0, maxX=100 als Streifen). Das zerstört die Geografie. Landschaften müssen organisch und unregelmäßig fließen.

Nutze für die Regions/Terrain-Generierung die "Insel-Cluster-Logik":
- Bestimme ein "Zentrum" für ein Biom (z.B. Koordinate X:15, Y:12 als Kern des Waldes).
- Breite das Biom von diesem Zentrum aus kreisrund oder oval in alle Richtungen aus, erzeuge realistische, versetzte Boundaries (minX, maxX, minY, maxY).
- Der Ozean (FLUESSIGKEIT_MEER) MUSS die gesamte Karte unregelmäßig umfließen, sodass Landmassen wie organische Inseln oder verzweigte Kontinente aussehen, niemals wie ein perfektes Rechteck!

${existingMapContext ? `BEREITS EXISTIERENDE LANDMARKEN AUF DER 100x100 WELTKARTE:
${existingMapContext}` : ''}` : `Erzeuge eine vollständige, perfekt zum Setting passende Weltkarte mit kontrastreichen Regionen, Zivilisationen, Orts-Landmarken, Geländemerkmalen, Handelswegen und Weltregeln.

[VERBOT VON STARREN REIHEN & STREIFEN-MUSTERN]:
Es ist dir STRENGSTENS VERBOTEN, die Grenzen (minX, maxX, minY, maxY) in perfekten horizontalen oder vertikalen Streifen aufzubauen. Landschaften müssen organisch und unregelmäßig fließen.
Nutze die "Insel-Cluster-Logik":
- Bestimme organische Zentren für Biome (X, Y) und weise realistische, unregelmäßige Boundaries (minX, maxX, minY, maxY) zu, die kreisrund/oval oder verzweigt wirken, NICHT perfekt rechteckig.
- Der Ozean MUSS die gesamte Karte unregelmäßig umfließen, sodass Landmassen wie organische Inseln oder verzweigte Kontinente aussehen!`}

Generiere basierend darauf ein detailliertes Geografie- und Weltschöpfungs-Modell nach den Weltschöpfungs-Regeln:

1. WELTSTRUKTUR:
   - Name der Welt
   - Typ (z.B. High-Fantasy, Steampunk, Postapokalypse, Sci-Fi, Cyberpunk)
   - Form (z.B. Kugel, schwebender Archipel, Hohlwelt, flache Scheibe)
   - Anzahl Kontinente / Hauptgebiete (ca. 2-4)
   - Anzahl Meere / Ozeane / Trennmedien
   - Anzahl bedeutende Inselgruppen / Randbereiche

2. REGIONEN & LANDMARKEN (Die Kontinente/Großmächte/Sektoren):
   Generiere ca. 3-6 bedeutende, kontrastreiche Regionen & Landmarken, die perfekt zum Setting/Genre passen.
   Ordne ihnen Koordinaten auf einer 100x100-Karte zu (x: 15 bis 85, y: 15 bis 85).
   Für jede Region / Landmarke gib an:
   - title/name: Name der Region
   - type: Typ (z.B. Königreich, Sektor, Imperium, Ödland, Vulkanzone, Nebelwald, Himmelsstadt)
   - biome: Biome (Wüste, Frosttundra, Dschungel, Wolkenberge, Neon-Slum etc.)
   - climate: Klima
   - description: Ausführliche Beschreibung
   - x, y: Zentrumskoordinaten (15-85)
   - minX, maxX, minY, maxY: Territoriale Grenzen (z.B. minX = x - 8, maxX = x + 8, minY = y - 6, maxY = y + 6)
   - color: Passender Hex-Farbcode. GANZ WICHTIG: Ozeane und Meere (z.B. North Blue, Calm Belt) MÜSSEN blau sein (z.B. "#0284c7", "#0369a1"). Wälder grün ("#4d8014"), Wüsten gelb ("#b28a52")!
   - adjacentZones: Kommagetrennte Namen angrenzender Nachbarregionen

3. ZIVILISATIONEN & REICHE (civilizations):
   Generiere 2-4 bedeutende Fraktionen/Zivilisationen mit Name, Typ, Beschreibung, x, y, minX, maxX, minY, maxY, color, adjacentZones.

4. GELÄNDE (terrains):
   Befülle besondere natürliche Landschaftsmerkmale auf der Karte (Berge, Wälder, Flüsse, Seen, Vulkane, Klüfte) inklusive Koordinaten (x, y), Grenzen und Farben.

5. BEDEUTENDE ORTE (places):
   Hauptstädte, Hauptfestungen, arkanes Heiligtum, dunkler Kerker oder Außenposten mit Koordinaten, Grenzen und Farben.

6. VERBINDUNGEN (connections):
   Reisewege und Transportmöglichkeiten zwischen den Regionen/Orten.

7. WELTREGELN (weltregeln):
   2-3 atmosphärische, spielmechanische Zugangs- oder physikalische/magische Regeln.

8. MAPCONFIG:
   Stil-Einstellungen (continentStencil, coastlineStyle, mountainStyle, riverStyle, biomeStyle, mapStyle, decorations).

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              worldStructure: {
                type: Type.OBJECT,
                properties: {
                  worldName: { type: Type.STRING },
                  type: { type: Type.STRING },
                  shape: { type: Type.STRING },
                  continentsCount: { type: Type.INTEGER },
                  seasCount: { type: Type.INTEGER },
                  islandsCount: { type: Type.INTEGER }
                },
                required: ["worldName", "type", "shape", "continentsCount", "seasCount", "islandsCount"]
              },
              regions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING },
                    biome: { type: Type.STRING },
                    climate: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    minX: { type: Type.INTEGER },
                    maxX: { type: Type.INTEGER },
                    minY: { type: Type.INTEGER },
                    maxY: { type: Type.INTEGER },
                    color: { type: Type.STRING },
                    adjacentZones: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "type", "biome", "climate", "x", "y", "description"]
                }
              },
              civilizations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    minX: { type: Type.INTEGER },
                    maxX: { type: Type.INTEGER },
                    minY: { type: Type.INTEGER },
                    maxY: { type: Type.INTEGER },
                    color: { type: Type.STRING },
                    adjacentZones: { type: Type.STRING }
                  },
                  required: ["name", "type", "description", "x", "y"]
                }
              },
              places: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    minX: { type: Type.INTEGER },
                    maxX: { type: Type.INTEGER },
                    minY: { type: Type.INTEGER },
                    maxY: { type: Type.INTEGER },
                    color: { type: Type.STRING },
                    adjacentZones: { type: Type.STRING }
                  },
                  required: ["name", "type", "description", "x", "y"]
                }
              },
              relationships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromPlace: { type: Type.STRING },
                    toPlace: { type: Type.STRING },
                    direction: { type: Type.STRING },
                    distance: { type: Type.STRING }
                  },
                  required: ["fromPlace", "toPlace", "direction", "distance"]
                }
              },
              terrains: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    minX: { type: Type.INTEGER },
                    maxX: { type: Type.INTEGER },
                    minY: { type: Type.INTEGER },
                    maxY: { type: Type.INTEGER },
                    color: { type: Type.STRING },
                    adjacentZones: { type: Type.STRING }
                  },
                  required: ["type", "name", "description", "x", "y"]
                }
              },
              connections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromPlace: { type: Type.STRING },
                    toPlace: { type: Type.STRING },
                    type: { type: Type.STRING },
                    duration: { type: Type.STRING }
                  },
                  required: ["fromPlace", "toPlace", "type", "duration"]
                }
              },
              weltregeln: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    scope: { type: Type.STRING },
                    restrictedFrom: { type: Type.STRING }
                  },
                  required: ["title", "description", "scope", "restrictedFrom"]
                }
              },
              mapConfig: {
                type: Type.OBJECT,
                properties: {
                  continentStencil: { type: Type.STRING },
                  coastlineStyle: { type: Type.STRING },
                  mountainStyle: { type: Type.STRING },
                  riverStyle: { type: Type.STRING },
                  biomeStyle: { type: Type.STRING },
                  mapStyle: { type: Type.STRING },
                  decorations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["continentStencil", "coastlineStyle", "mountainStyle", "riverStyle", "biomeStyle", "mapStyle", "decorations"]
              }
            },
            required: ["worldStructure", "regions", "relationships", "terrains", "connections", "weltregeln", "mapConfig"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateRpgTileMapFromLoreAndCanon({
    territory,
    worldSetting,
    loreEntries,
    customInstruction,
    isNsfw
  }: {
    territory: any;
    worldSetting: any;
    loreEntries?: LoreEntry[];
    customInstruction?: string;
    isNsfw?: boolean;
  }): Promise<{
    tileSizeMeters: number;
    gridWidth: number;
    gridHeight: number;
    tiles: Record<string, string>;
    placedObjects: any[];
    positions: { Spieler: { x: number; y: number } };
    updatedTerritoryFields: {
      description?: string;
      biome?: string;
      size?: string;
      ruler?: string;
      culture?: string;
      climate?: string;
      terrain?: string;
      faction?: string;
    };
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();

      const loreContextStr = (loreEntries && loreEntries.length > 0)
        ? loreEntries.map(l => `- [${l.category || 'Kodex'}] ${l.title}: ${l.description || l.secretsStage1 || ''}`).join('\n')
        : 'Keine spezifischen Kodex-Einträge hinterlegt.';

      // Collect existing sub-territories (Untergebiete) from worldSetting.territories
      const allTerritories: any[] = worldSetting?.territories || [];
      const currentTerritoryId = territory?.id;
      const currentTerritoryName = territory?.name;

      // Detect parent territory and surrounding macro-geography (roads from west/east, rivers to south/north etc.)
      const parentTerritory = territory?.parentId
        ? allTerritories.find((t: any) => t.id === territory.parentId)
        : allTerritories.find((t: any) => (t.type === 'welt' || t.type === 'meer' || t.type === 'kontinent' || (t.tileData && t.tileData.tiles)) && t.id !== currentTerritoryId);

      const borderDirections = {
        west: { road: false, water: false, forest: false, mountain: false, text: '' },
        east: { road: false, water: false, forest: false, mountain: false, text: '' },
        north: { road: false, water: false, forest: false, mountain: false, text: '' },
        south: { road: false, water: false, forest: false, mountain: false, text: '' }
      };

      if (parentTerritory) {
        const pTiles = parentTerritory.tileData?.tiles || parentTerritory.mapConfig?.tiles || {};
        const pObjects = parentTerritory.tileData?.placedObjects || parentTerritory.mapConfig?.placedObjects || [];

        const tokenOnParent = pObjects.find((o: any) =>
          (o.name && currentTerritoryName && o.name.toLowerCase().includes(currentTerritoryName.toLowerCase())) ||
          (o.loreEntryId && currentTerritoryId && o.loreEntryId.includes(currentTerritoryId))
        );

        const px = tokenOnParent ? tokenOnParent.x : (territory?.x ?? 15);
        const py = tokenOnParent ? tokenOnParent.y : (territory?.y ?? 10);

        if (typeof px === 'number' && typeof py === 'number' && Object.keys(pTiles).length > 0) {
          // Inspect West (x < px)
          for (let dx = 1; dx <= 6; dx++) {
            const tile = pTiles[`${px - dx},${py}`];
            if (tile === 'weg' || tile === 'strasse') borderDirections.west.road = true;
            if (tile === 'fluss' || tile === 'ozean' || tile === 'strand' || tile === 'hafen') borderDirections.west.water = true;
            if (tile === 'wald') borderDirections.west.forest = true;
            if (tile === 'berg' || tile === 'vulkan') borderDirections.west.mountain = true;
          }
          // Inspect East (x > px)
          for (let dx = 1; dx <= 6; dx++) {
            const tile = pTiles[`${px + dx},${py}`];
            if (tile === 'weg' || tile === 'strasse') borderDirections.east.road = true;
            if (tile === 'fluss' || tile === 'ozean' || tile === 'strand' || tile === 'hafen') borderDirections.east.water = true;
            if (tile === 'wald') borderDirections.east.forest = true;
            if (tile === 'berg' || tile === 'vulkan') borderDirections.east.mountain = true;
          }
          // Inspect North (y < py)
          for (let dy = 1; dy <= 6; dy++) {
            const tile = pTiles[`${px},${py - dy}`];
            if (tile === 'weg' || tile === 'strasse') borderDirections.north.road = true;
            if (tile === 'fluss' || tile === 'ozean' || tile === 'strand' || tile === 'hafen') borderDirections.north.water = true;
            if (tile === 'wald') borderDirections.north.forest = true;
            if (tile === 'berg' || tile === 'vulkan') borderDirections.north.mountain = true;
          }
          // Inspect South (y > py)
          for (let dy = 1; dy <= 6; dy++) {
            const tile = pTiles[`${px},${py + dy}`];
            if (tile === 'weg' || tile === 'strasse') borderDirections.south.road = true;
            if (tile === 'fluss' || tile === 'ozean' || tile === 'strand' || tile === 'hafen') borderDirections.south.water = true;
            if (tile === 'wald') borderDirections.south.forest = true;
            if (tile === 'berg' || tile === 'vulkan') borderDirections.south.mountain = true;
          }

          // Inspect nearby placedObjects on parent map
          pObjects.forEach((o: any) => {
            const oName = (o.name || '').toLowerCase();
            if (o.y > py && Math.abs(o.x - px) <= 5 && (oName.includes('fluss') || oName.includes('wasser') || oName.includes('meer') || oName.includes('see') || oName.includes('ozean'))) borderDirections.south.water = true;
            if (o.y < py && Math.abs(o.x - px) <= 5 && (oName.includes('fluss') || oName.includes('wasser') || oName.includes('meer') || oName.includes('see') || oName.includes('ozean'))) borderDirections.north.water = true;
            if (o.x < px && Math.abs(o.y - py) <= 5 && (oName.includes('fluss') || oName.includes('wasser') || oName.includes('meer') || oName.includes('see') || oName.includes('ozean'))) borderDirections.west.water = true;
            if (o.x > px && Math.abs(o.y - py) <= 5 && (oName.includes('fluss') || oName.includes('wasser') || oName.includes('meer') || oName.includes('see') || oName.includes('ozean'))) borderDirections.east.water = true;

            if (o.x < px && Math.abs(o.y - py) <= 4 && (oName.includes('weg') || oName.includes('pfad') || oName.includes('straße') || oName.includes('strasse'))) borderDirections.west.road = true;
            if (o.x > px && Math.abs(o.y - py) <= 4 && (oName.includes('weg') || oName.includes('pfad') || oName.includes('straße') || oName.includes('strasse'))) borderDirections.east.road = true;
            if (o.y < py && Math.abs(o.x - px) <= 4 && (oName.includes('weg') || oName.includes('pfad') || oName.includes('straße') || oName.includes('strasse'))) borderDirections.north.road = true;
            if (o.y > py && Math.abs(o.x - px) <= 4 && (oName.includes('weg') || oName.includes('pfad') || oName.includes('straße') || oName.includes('strasse'))) borderDirections.south.road = true;
          });
        }
      }

      // Fallback text parsing from territory borders/waters/description
      const fullGeoText = `${territory?.borders || ''} ${territory?.envNeighbours || ''} ${territory?.compassDirections || ''} ${territory?.waters || ''} ${territory?.mountains || ''} ${territory?.forests || ''} ${territory?.description || ''} ${territory?.biome || ''}`.toLowerCase();

      if (fullGeoText.includes('west') && (fullGeoText.includes('weg') || fullGeoText.includes('straße') || fullGeoText.includes('strasse') || fullGeoText.includes('pfad'))) borderDirections.west.road = true;
      if (fullGeoText.includes('ost') && (fullGeoText.includes('weg') || fullGeoText.includes('straße') || fullGeoText.includes('strasse') || fullGeoText.includes('pfad'))) borderDirections.east.road = true;
      if (fullGeoText.includes('nord') && (fullGeoText.includes('weg') || fullGeoText.includes('straße') || fullGeoText.includes('strasse') || fullGeoText.includes('pfad'))) borderDirections.north.road = true;
      if (fullGeoText.includes('süd') && (fullGeoText.includes('weg') || fullGeoText.includes('straße') || fullGeoText.includes('strasse') || fullGeoText.includes('pfad'))) borderDirections.south.road = true;

      if ((fullGeoText.includes('süd') || fullGeoText.includes('sud')) && (fullGeoText.includes('fluss') || fullGeoText.includes('wasser') || fullGeoText.includes('meer') || fullGeoText.includes('see') || fullGeoText.includes('küste') || fullGeoText.includes('ozean'))) borderDirections.south.water = true;
      if (fullGeoText.includes('nord') && (fullGeoText.includes('fluss') || fullGeoText.includes('wasser') || fullGeoText.includes('meer') || fullGeoText.includes('see') || fullGeoText.includes('küste') || fullGeoText.includes('ozean'))) borderDirections.north.water = true;
      if (fullGeoText.includes('west') && (fullGeoText.includes('fluss') || fullGeoText.includes('wasser') || fullGeoText.includes('meer') || fullGeoText.includes('see') || fullGeoText.includes('küste') || fullGeoText.includes('ozean'))) borderDirections.west.water = true;
      if (fullGeoText.includes('ost') && (fullGeoText.includes('fluss') || fullGeoText.includes('wasser') || fullGeoText.includes('meer') || fullGeoText.includes('see') || fullGeoText.includes('küste') || fullGeoText.includes('ozean'))) borderDirections.east.water = true;

      if (fullGeoText.includes('west') && (fullGeoText.includes('wald') || fullGeoText.includes('forst'))) borderDirections.west.forest = true;
      if (fullGeoText.includes('ost') && (fullGeoText.includes('wald') || fullGeoText.includes('forst'))) borderDirections.east.forest = true;
      if (fullGeoText.includes('nord') && (fullGeoText.includes('wald') || fullGeoText.includes('forst'))) borderDirections.north.forest = true;
      if (fullGeoText.includes('süd') && (fullGeoText.includes('wald') || fullGeoText.includes('forst'))) borderDirections.south.forest = true;

      if (fullGeoText.includes('west') && (fullGeoText.includes('berg') || fullGeoText.includes('gebirge') || fullGeoText.includes('fels'))) borderDirections.west.mountain = true;
      if (fullGeoText.includes('ost') && (fullGeoText.includes('berg') || fullGeoText.includes('gebirge') || fullGeoText.includes('fels'))) borderDirections.east.mountain = true;
      if (fullGeoText.includes('nord') && (fullGeoText.includes('berg') || fullGeoText.includes('gebirge') || fullGeoText.includes('fels'))) borderDirections.north.mountain = true;
      if (fullGeoText.includes('süd') && (fullGeoText.includes('berg') || fullGeoText.includes('gebirge') || fullGeoText.includes('fels'))) borderDirections.south.mountain = true;

      // SANITIZE BORDER DIRECTIONS BASED ON LOCAL LAYOUT AND COMPASS DIRECTIONS:
      const presetName = (territory?.layoutPreset || '').toLowerCase();
      const compText = (territory?.compassDirections || '').toLowerCase();
      const envText = (territory?.envNeighbours || '').toLowerCase();
      const nameAndDescText = `${territory?.name || ''} ${territory?.description || ''}`.toLowerCase();

      const isHafenOrKueste = presetName === 'hafenbucht' || compText.includes('hafen') || compText.includes('küste') || compText.includes('kueste') || nameAndDescText.includes('hafen');
      let determinedCoastSide: string | null = null;

      if (isHafenOrKueste && presetName !== 'insel_dorf' && presetName !== 'archipel') {
        const textToAnalyze = `${territory?.name || ''} ${compText} ${envText} ${nameAndDescText}`.toLowerCase();
        
        // Count weighted occurrences of each direction to determine the dominant coast side
        const counts = {
          south: (textToAnalyze.match(/süd|sud|south/g) || []).length * 1.5 + (textToAnalyze.includes('südhafen') ? 5.0 : 0.0),
          west: (textToAnalyze.match(/west/g) || []).length * 1.0,
          east: (textToAnalyze.match(/ost|east/g) || []).length * 1.0,
          north: (textToAnalyze.match(/nord|north/g) || []).length * 1.0
        };

        let coastSide = 'south'; // default
        let maxCount = 0.1; // minimum threshold

        if (counts.south > maxCount) { coastSide = 'south'; maxCount = counts.south; }
        if (counts.west > maxCount) { coastSide = 'west'; maxCount = counts.west; }
        if (counts.east > maxCount) { coastSide = 'east'; maxCount = counts.east; }
        if (counts.north > maxCount) { coastSide = 'north'; maxCount = counts.north; }

        determinedCoastSide = coastSide;

        borderDirections.west.water = (coastSide === 'west');
        borderDirections.east.water = (coastSide === 'east');
        borderDirections.north.water = (coastSide === 'north');
        borderDirections.south.water = (coastSide === 'south');
      } else if (presetName === 'insel_dorf' || presetName === 'archipel') {
        borderDirections.west.water = true;
        borderDirections.east.water = true;
        borderDirections.north.water = true;
        borderDirections.south.water = true;
      }

      const formatBorderText = (b: typeof borderDirections.west) => {
        const parts = [];
        if (b.road) parts.push('Ankommender Weg / Straße');
        if (b.water) parts.push('Fluss / Gewässer / Meer');
        if (b.forest) parts.push('Dichter Wald');
        if (b.mountain) parts.push('Gebirge / Felsen');
        return parts.length > 0 ? parts.join(', ') : 'Offenes Land / Felder';
      };

      borderDirections.west.text = formatBorderText(borderDirections.west);
      borderDirections.east.text = formatBorderText(borderDirections.east);
      borderDirections.north.text = formatBorderText(borderDirections.north);
      borderDirections.south.text = formatBorderText(borderDirections.south);

      let subTerritories = allTerritories.filter((t: any) => {
        if (!currentTerritoryId && !currentTerritoryName) return false;
        if (t.id === currentTerritoryId) return false;
        return t.parentId === currentTerritoryId || t.parentId === currentTerritoryName;
      });

      // If no direct sub-territories were found by parentId, but territory is top-level/world/ocean, collect all other territories
      if (subTerritories.length === 0 && allTerritories.length > 0) {
        if (!territory || territory.type === 'welt' || territory.type === 'meer' || !territory.parentId) {
          subTerritories = allTerritories.filter((t: any) => t.id !== currentTerritoryId);
        }
      }

      const loreLocations = (loreEntries || []).filter(l => (l.category as string) === 'Orte' || (l.category as string) === 'Weltkarte');

      const subTerritoryListStr = subTerritories.map((st: any) => {
        const typeLabel = st.type || 'Region';
        const posStr = (typeof st.x === 'number' && typeof st.y === 'number')
          ? ` (Weltkarten-Position: x=${st.x}, y=${st.y})`
          : '';
        return `- [Weltkarten-Untergebiet (${typeLabel})] ID: "terr-${st.id}", Name: "${st.name || st.title}", Typ: "${typeLabel}"${posStr}, Beschreibung: "${st.description || ''}", Biom/Gelände: "${st.biome || st.terrain || ''}"`;
      }).join('\n');

      const loreLocationListStr = loreLocations.map((loc: any) => {
        const mapX = loc.details?.mapX ?? loc.details?.x;
        const mapY = loc.details?.mapY ?? loc.details?.y;
        const posStr = (typeof mapX === 'number' && typeof mapY === 'number')
          ? ` (Position: x=${mapX}, y=${mapY})`
          : '';
        return `- [Kodex-Ort] ID: "${loc.id}", Name: "${loc.title}"${posStr}, Beschreibung: "${loc.description || ''}"`;
      }).join('\n');

      const relListStr = (worldSetting?.relationships || []).map((r: any) =>
        `- GEOGRAFISCHE BEZIEHUNG / RICHTUNG: "${r.fromPlace}" liegt ${r.direction || 'in der Nähe'} von "${r.toPlace}" (Distanz: ${r.distance || 'unbekannt'})`
      ).join('\n');

      const combinedLocationsStr = [
        subTerritoryListStr ? `EXISTIERENDE UNTERGEBIETE DER WELTKARTE:\n${subTerritoryListStr}` : '',
        loreLocationListStr ? `KODEX-ORTE (LORE):\n${loreLocationListStr}` : '',
        relListStr ? `KANON-VERBINDUNGEN & HIMMELSRICHTUNGEN:\n${relListStr}` : ''
      ].filter(Boolean).join('\n\n') || 'Keine expliziten Untergebiete hinterlegt.';

      const terrType = (territory?.type || '').toLowerCase();
      const terrName = (territory?.name || '').toLowerCase();
      const terrDesc = (territory?.description || '').toLowerCase();
      const terrBiome = (territory?.biome || territory?.terrain || '').toLowerCase();

      const isSettlement = ['stadt', 'dorf', 'siedlung', 'hafen', 'gebaeude', 'aussenposten', 'fort', 'burg', 'schmiede', 'viertel', 'markt', 'dorfplatz', 'wohnung', 'taverne'].some(k => terrType.includes(k) || terrName.includes(k) || terrDesc.includes(k));
      const isDungeon = ['hoehle', 'kerker', 'ruine', 'tempel', 'dungeon', 'verlies', 'gruft', 'katakombe'].some(k => terrType.includes(k) || terrName.includes(k) || terrDesc.includes(k));
      const isWorldMap = ['welt', 'meer', 'kontinent', 'ozean', 'reich', 'globus'].some(k => terrType.includes(k) || terrName.includes(k));

      const prompt = `Du bist ein meisterhafter RPG-Maker Level-Designer, Kartograf und Lore-Master für Rollenspiele.
Deine Aufgabe ist es, eine detaillierte 2D-Kachelkarte (Tile Grid) für das folgende Gebiet zu erstellen:

--- GEBIETSDATEN & MANUELLE KARTEN-LAYOUT-VORGABEN ---
Gebietsname: "${territory?.name || 'Unbenanntes Gebiet'}"
Gebietstyp: "${territory?.type || 'region'}"
Beschreibung: "${territory?.description || ''}"
Biom / Gelände: "${territory?.biome || territory?.terrain || ''}"
Klima: "${territory?.climate || ''}"
Einwohnerzahl: "${territory?.population || 'Unbekannt / Unbewohnt'}"
Eingetragener Maßstab: "${territory?.size || 'Keiner'}"
Wirtschaft & Handel: "${territory?.trade || 'Durchschnittlich / Unbekannt'}"
Hinterlegte Ressourcen: "${territory?.resources || 'Keine spezifischen'}" (Export: "${territory?.exports || 'Keine'}"; Import: "${territory?.imports || 'Keine'}")
Militärische Stärke: "${territory?.militaryStrength || 'Miliz / Unbekannt'}"
Verteidigungsanlagen: "${territory?.defense || 'Keine / Offen'}"
Bedrohungsstufe: "${territory?.dangerLevel || 'Sicher'}"

GEWÄHLTES KARTEN-PRESET (LAYOUT): "${territory?.layoutPreset || 'keins'}"
HIMMELSRICHTUNGEN & LANDMARKEN: "${territory?.compassDirections || 'Keine spezifische Angabe'}"
UNMITTELBARE UMGEBUNG & GEOGRAFIE: "${territory?.envNeighbours || 'Keine spezifische Angabe'}"
ENTFERNUNGEN & DISTANZEN ZU NACHBARORTEN: "${territory?.distancesToNeighbours || 'Keine spezifische Angabe'}"
ANGRENZENDE GEBIETE (NACHBARN/BORDERS): "${territory?.borders || 'Keine spezifische Angabe'}"
GEWÄSSER & KÜSTEN: "${territory?.waters || 'Keine spezifische Angabe'}"
GEBIRGE & HÖHENZÜGE: "${territory?.mountains || 'Keine spezifische Angabe'}"
WÄLDER & VEGETATION: "${territory?.forests || 'Keine spezifische Angabe'}"
LANDMARKEN & POIs: "${territory?.landmarks || territory?.pointsOfInterest || 'Keine spezifische Angabe'}"

--- WELTSETTING & KANON ---
Weltname: "${worldSetting?.title || 'Adventure World'}"
Genre/Tags: [${(worldSetting?.tags || []).join(', ')}]
Weltbeschreibung: "${worldSetting?.description || ''}"

--- KODEX & LORE-EINTRÄGE (STORY KANON) ---
${loreContextStr}

--- BEREITS VORHANDENE UNTERGEBIETE & ORTE (STRENG KANONISCH AUF KARTE PLATZIEREN) ---
${combinedLocationsStr}

--- ELTERN-KARTE & GEOGRAFISCHE NACHBARSCHAFT (MAKRO-GEOGRAFIE) ---
Übergeordnete Karte / Region: "${parentTerritory?.name || 'Weltkarte'}"
Erfasste Kanten-Eigenschaften der Makrokarte an den 4 Himmelsrichtungen:
- WESTEN (LINKS): ${borderDirections.west.text}
- OSTEN (RECHTS): ${borderDirections.east.text}
- NORDEN (OBEN): ${borderDirections.north.text}
- SÜDEN (UNTEN): ${borderDirections.south.text}

STRENGSTE KONTINUITÄTS-PFLICHT FÜR DIE AUSSENRÄNDER DER KARTE:
1. STRASSEN- & WEG-VERBINDUNG:
   - Wenn im WESTEN ein Weg heranführt: MUSS am linken Kartenrand (x=0) ein Weg ('weg') beginnen und sich direkt durch das Dorf erstrecken!
   - Wenn im OSTEN ein Weg heranführt: MUSS am rechten Kartenrand (x=gridWidth-1) ein Weg ('weg') beginnen!
   - Wenn im NORDEN ein Weg heranführt: MUSS am oberen Kartenrand (y=0) ein Weg ('weg') beginnen!
   - Wenn im SÜDEN ein Weg heranführt: MUSS am unteren Kartenrand (y=gridHeight-1) ein Weg ('weg') beginnen!
2. GEWÄSSER-NACHBARSCHAFT & AUSNAHME FÜR LOKALE KÜSTENLAYOUTS:
   - ACHTUNG: Die lokalen Layout-Vorgaben ('layoutPreset' und 'compassDirections') haben STRENGSTE PRIORITÄT vor den Makro-Wasserangaben!
   - Wenn laut Layout oder Himmelsrichtung eine Küste/Hafen z.B. im WESTEN oder SÜDEN liegt, zeichne Wasser NUR an dieser jeweiligen Küstenseite. Mache die GEGENÜBERLIEGENDE Seite (z.B. Osten oder Norden) ZWINGEND zu festem Land (Insel-Inneres bzw. Festland), anstatt dort fälschlicherweise ebenfalls Wasser hinzusetzen!

--- DESIGN-ANWEISUNGEN & STRENGSTE GEOGRAFISCHE LOGIK ---

0. STRENGSTE BEACHTUNG DER VOM NUTZER VORGEGEBENEN HIMMELSRICHTUNGEN & LAYOUTS:
   - USER-PRESET ("${territory?.layoutPreset || 'keins'}"):
     * 'hafenbucht':
       - Wenn Himmelsrichtung "Westen" verlangt: Der westliche Rand (x = 0 bis 2) MUSS Wasser ('ozean') sein mit Sandstrand ('strand') und Hafen/Pier ('hafen'). Der gesamte Rest (Osten, Norden, Süden) ist LAND (Gras, Wald, Berg, Häuser) und führt weiter ins Inselinnere!
       - Wenn Himmelsrichtung "Süden" verlangt: Der südliche Rand (y = gridHeight-1 bis gridHeight-3) MUSS Wasser ('ozean') sein. Der Norden, Westen und Osten sind LAND!
       - VERBOT: Platziere NIEMALS zwei gegenüberliegende Wasserstreifen (z.B. Wasser im Norden UND im Süden), wenn es sich um ein Dorf am Hafen handelt! Die Landseite erstreckt sich immer weiter ins Inland!
     * 'insel_dorf': WÄHLE ZWINGEND 'ozean' ALS defaultTerrain! Wasser ('ozean') umschließt die gesamte Karte an ALLEN Rändern (mindestens die äußersten 2-3 Kachelreihen ringsum). Die Siedlung/das Land liegt als zusammenhängende, große Insel (bestehend aus 'gras', 'strand', 'wald', 'berg') in der Mitte der Karte. Der Hafen ('hafen', 'strand') liegt an einem der Strände zum Meer hin.
     * 'gebirgspass': Der westliche (x=0..2) und östliche Rand (x=gridWidth-3..gridWidth-1) bestehen aus steilen Bergwänden ('berg'), während in der Mitte ein Weg ('weg') von Nord nach Süd führt.
     * 'waldlichtung': Der äußere Rand ist dicht bewaldet ('wald'), in der Mitte öffnet sich eine freie Lichtung ('gras', 'weg').
     * 'festung_zitadelle': Eine massive Mauer ('mauer', 'berg') umschließt die Festung mit befestigten Toren.
     * 'archipel': Überwiegend Ozean ('ozean') mit 2 bis 4 verstreuten kleinen Inseln ('insel', 'strand').
     * 'freie_ebene': Weite, offene Graslandschaft ('gras') mit einzelnen Bäumen ('wald') und Wegen ('weg').
   - HIMMELSRICHTUNGEN & LANDMARKEN ("${territory?.compassDirections || ''}"):
     * Falls hier konkrete Himmelsrichtungen angegeben sind (z.B. "Norden: Wald/Berg, Westen: Hafen, Osten: Inselfeld"), Platziere Geländetypen und Tokens GENAU an diesen Seiten!
   - UNMITTELBARE UMGEBUNG & CODEX-FEATURES ("${territory?.envNeighbours || ''}"):
     * WICHTIG - REICHHALTIGE NATUR UND GELÄNDE-DETAILS: Erstelle KEINE leere grüne Fläche! Integrirere zwingend alle im Codex hinterlegten Naturmerkmale:
       - Wälder ("${territory?.forests || ''}") -> Zeichne zusammenhängende Waldzonen und Baumgruppen ('wald').
       - Berge & Hügel ("${territory?.mountains || ''}") -> Erstelle Felsformationen und Höhenzüge ('berg').
       - Gewässer & Bäche ("${territory?.waters || ''}") -> Zeichne Flussläufe oder Seen ('fluss') mit Holzbrücken ('bruecke') über Straßen.
       - Küsten -> Zeichne saubere Sandstrände ('strand') am Übergang vom Land/Hafen zum Ozean ('ozean').
   - ENTFERNUNGEN & DISTANZEN ZU NACHBARORTEN ("${territory?.distancesToNeighbours || ''}"):
     * Falls hier Entfernungen angegeben sind (z.B. "Hafen im Westen der Insel, nächste Stadt 21km nach Norden, nordwest kleines Dorf 15km"):
       - Platziere an den Ausfahrtsstraßen der jeweiligen Himmelsrichtung Interaktions-Tokens wie Wegweiser (📌 "Wegweiser: Nächste Stadt (21 km nördl.)") oder Ortsschilder.
       - Berechne den Maßstab ('tileSizeMeters') und die Wegverläufe zu den Kartenrändern passend zu den Distanzen und der Ortsgröße.

1. RASTERGRÖSSE (gridWidth & gridHeight):
   - Für ein Dorf, eine kleine Siedlung: Formate wie 24x18 oder 28x20.
   - Für eine große Stadt, einen geschäftigen Hafen oder bedeutende Handelszentren (wie z. B. mit vielen Einwohnern oder einem großen Hafen wie Ouka): Verwende ein größeres, weitläufiges Format wie 35x24, 38x26 oder 40x25, damit Wohnviertel, Hafen, Handwerker und Marktplätze viel Platz haben und organisch über die gesamte Karte verteilt werden können!
   - Für Weltkarten / Ozeane: Größere Formate wie 35x22 bis 50x30.
   - Für Dungeons / Höhlen / Gebäude: Formate wie 20x15 bis 25x18.

2. STRENGSTE REGEL FÜR KONTINUITÄT & KONSISTENZ DES BIOMS (KEINE UNSINNIGEN GEFAHREN):
   - WICHTIG: Platziere NIEMALS unpassende oder absurde Kacheln mitten im Gebiet!
   - Auf einer normalen Dorf- oder Landkarte ("${territory?.name || 'Dorf'}") darf es NIEMALS einzelne Vulkan/Lava-Kacheln ('vulkan') oder Eis/Schnee-Kacheln ('schnee') geben, es sei denn, die Gebietsbeschreibung sagt explizit, dass das Gebiet direkt an/auf einem aktiven Vulkan oder einem Gletscher gebaut ist!
   - Auf einer Binnenland-Karte darf es keine isolierten Tiefsee-/Ozeankacheln ('ozean') geben (höchstens einen Fluss 'fluss' mit Holzbrücke 'bruecke').
   - Halte das Biom homogen, glaubwürdig und atmosphärisch passend.

3. DENSE LANDSCHAFT, WÄLDER, BERGE & GEWÄSSER (REICHE NATUR MANDAT):
   - ERSTELLE NIEMALS EINE LEERE GRÜNE KARTENFLÄCHE!
   - Gib im 'tiles'-Array ausreichend viele Kacheln an (mindestens 40 bis 100 veränderte Kacheln), um eine lebendige, natürliche Umgebung zu schaffen:
     * Dichte Waldgebiete ('wald'): Zeichne zusammenhängende Wälder (mindestens 20-40 Kacheln) an den Rändern, im Norden oder Osten des Gebiets.
     * Felsformationen & Gebirge ('berg'): Erstelle Steilküsten, Hügelketten oder Felswände (mind. 10-20 Kacheln).
     * Bäche, Flüsse & Seen ('fluss'): Zeichne geschwungene Flussläufe mit einer Holzbrücke ('bruecke') über Straßen.
     * Strand & Küste ('strand'): Zeichne an Übergängen vom Meer ('ozean') zum Land ('gras') einen sauberen 1-2 Kachel breiten Sandstrand!

4. EINWOHNERZAHL, MAẞSTAB & WOHNKAPAZITÄT BERECHNUNGSREGELN (STRENGSTE VERPFLICHTUNG):
   - WICHTIG: Die Anzahl der zu generierenden Gebäude/Häuser MUSS direkt von der angegebenen "Einwohnerzahl" des Gebiets (oben angegeben: "${territory?.population || '0'}") abgeleitet werden!
   - Definiere folgende maximale Wohnkapazitäten pro Gebäude-Typ:
     * Einfaches Wohnhaus oder Hütte (Kachel-Typ 'haus' oder 'placedObject' Token): Maximal 6 Personen.
     * Großes Wohnhaus / Anwesen / Patrizierhaus (Token): Maximal 15 Personen.
     * Taverne / Herberge (Token): Maximal 25 Personen.
     * Zelt / Lagerplatz (Token): Maximal 4 Personen.
     * Burg / Kaserne / Festung (Token): Maximal 100 Personen.
   - BERECHNUNGS-FORMEL:
     * Wenn die Einwohnerzahl klein/überschaubar ist (z. B. 12 bis 150 Einwohner): Berechne die genaue Anzahl an Häusern, die benötigt wird, um alle Einwohner unterzubringen! Zum Beispiel: Bei 48 Einwohnern müssen mind. 8 Häuser (8 * 6 = 48) auf der Karte existieren (entweder als 'haus'-Kacheln oder als Tokens).
     * Wenn die Einwohnerzahl groß ist (z. B. 500, 1.000, 12.000 oder 35.000 Einwohner): Die Karte stellt den "Siedlungskern", "Zentrum" oder "Altstadt" des Ortes dar. Platziere so viele Gebäude wie möglich (z. B. 15 bis 30 Gebäude-Tokens/Kacheln), um eine hohe Dichte zu simulieren, und deklariere in deren Beschreibungen, dass es sich um dichte Wohnquartiere, Mietskasernen oder Wohnblöcke handelt.
   - STAPELUNG AUF KACHELN (VIER GEBÄUDE PRO KACHEL):
     * Im Token-System ('placedObjects') können bis zu 4 verschiedene Gebäude auf derselben Kachel (gleiche x, y-Koordinate) platziert werden! Nutze diese Stapelung, um lebendige, dichte Stadtviertel, Marktplätze oder zusammenhängende Häuserzeilen zu bauen, anstatt alles weitläufig zu verteilen.
   - MAẞSTABS-ANPASSUNG (GRÖẞE IM CODEX):
     * Du MUSST im Feld "updatedTerritoryFields.size" die tatsächliche Größe der Rasterkarte basierend auf dem generierten Gitter angeben! Verwende exakt das Format:
       "<gridWidth>x<gridHeight> Kacheln (Maßstab: 1 Kachel = <tileSizeMeters>m)"
       Beispiel: "24x18 Kacheln (Maßstab: 1 Kachel = 5m)" oder "30x20 Kacheln (Maßstab: 1 Kachel = 10m)". Dadurch wird der Codex-Größeneintrag perfekt mit der tatsächlichen Kachelkarte synchronisiert!

5. WIRTSCHAFTS- & HANDELS-BERECHNUNGSREGELN (STRENGSTE VERPFLICHTUNG):
   - WICHTIG: Die Anzahl der Händler, Marktstände und Gasthäuser MUSS direkt vom angegebenen Wirtschafts-/Handelsniveau (oben angegeben: "${territory?.trade || 'Durchschnittlich'}") und den Ressourcen abgeleitet werden!
   - HÄNDLER & MARKTSTÄNDE (placedObjects Token):
     * HOCH/FLORIEREND (z. B. "Florierend", "Viel Handel", "Handelszentrum", "Sehr gut"): Platziere 3 bis 6 aktive Händler/Marktstände (z. B. 🛒, 📦, 🥖, ⚖️, ⚔️) im Siedlungskern. Benenne sie passend (z. B. "Waffenschmiede", "Gewürzhändler Malik", "Brotbäckerei"). Jede Händler-Beschreibung MUSS das Angebot, die Nachfrage und die Preissituation (z. B. "Günstige lokale Wolle, teure importierte Gewürze") konkret benennen!
     * MITTEL/DURCHSCHNITTLICH: Platziere 2 bis 3 Händler/Marktstände mit grundlegendem Sortiment.
     * GERING/KARG/ARM (z. B. "Kaum Handel", "Arm", "Isoliert", "Tauschhandel"): Platziere maximal 1 einfachen Tauschhändler/Marktstand mit kargem Sortiment. Die Beschreibung soll die Knappheit betonen.
   - GASTHÄUSER, TAVERNEN, TAVERNS & HOTELS (placedObjects Token):
     * Viel Handel & Hoher Besuch: Platziere 2 bis 4 Tavernen, Herbergen oder Schänken (z. B. 🍺, 🏨, 🍽️). Benenne sie stimmungsvoll. Beschreibe sie als belebt von reisenden Händlern und auswärtigen Abenteurern.
     * Mäßiger Handel: Platziere 1 bis 2 kleine Schänken/Herbergen.
     * Wenig Handel: Platziere maximal 1 kleine, heruntergekommene Schänke (z. B. "Spelunke", "Rauchige Spelunke") oder gar keine. Beschreibe sie als leer und trist.
   - GÜTER-KONSISTENZ: Stelle sicher, dass die angebotenen Waren perfekt zu den hinterlegten Ressourcen ("${territory?.resources || ''}") und Exporten ("${territory?.exports || ''}") passen!

6. MILITÄR- & VERTEIDIGUNGS-BERECHNUNGSREGELN (STRENGSTE VERPFLICHTUNG):
   - WICHTIG: Die Art und Stärke der Befestigungsanlagen (Mauer, Tore, Türme) sowie die Art und Anzahl der Wachen/Garnisonen MUSS direkt von den Angaben zur Verteidigung ("${territory?.defense || 'Keine'}") und Militärstärke ("${territory?.militaryStrength || 'Miliz'}") abgeleitet werden!
   - BEFESTIGUNGSANLAGEN (Mauer-Kacheln & Struktur):
     * KEINE / OFFEN (z. B. "Keine", "Offen", "Schwach", "Natürliche Barrieren"): Das Dorf/die Siedlung ist komplett offen. Zeichne KEINE umlaufenden Mauern auf der Kachelkarte.
     * MITTEL / PALISADE (z. B. "Holzpalisade", "Palisade", "Erdwall", "Holzmauer"): Zeichne an den Siedlungsrändern eine durchgehende Reihe von Holz-Verteidigungswällen oder platziere entsprechende Palisaden-Objekte. Belasse genau 1 offenes Tor/Weg als Eingang.
     * HOCH / STADTMAUER (z. B. "Stadtmauer", "Mauer", "Steinerne Ringmauer"): Zeichne eine massive Steinmauer (nutze die Kachel-Typen 'berg' oder 'stein' für die Mauer, und lasse Wege 'weg' durch die Tore verlaufen). Erstelle mindestens 2 befestigte Tore ('placedObjects' mit Torwachen 🛡️) und platziere 2 bis 3 Wehrtürme (🏰 oder 🗼) an den Ecken.
     * FESTUNG / BURG (z. B. "Festung", "Burg", "Zitadelle", "Dicke Steinmauern"): Erstelle eine wehrhafte Festungsstruktur. Nutze dicke Stein- oder Berg-Kacheln ('stein', 'berg') für die Außenmauern und Bastionen. Die gesamte Karte ist von wehrhafter Architektur geprägt, mit einem zentralen Herrschaftssitz/Keep.
   - MILITÄRSTÄRKE, GENDARMERIE & WACHEN (placedObjects Token):
     * MILIZ / SCHWACH (z. B. "Miliz", "Bürgerwehr", "Schwach", "Keine"): Platziere nur 1 bis 2 einfache Wachen (🛡️, 💂 oder ⚔️), z. B. "Dorfwache" oder "Ortshüter" mit einfacher Bewaffnung.
     * MITTEL (z. B. "Stadtwache", "Garde", "Söldner"): Platziere 3 bis 5 professionelle Soldaten, Wachen oder Patrouillen. Benenne sie präzise, z. B. "Torwache", "Markt-Patrouille", "Stadtwachen-Garnison".
     * STARK / SEHR STARK (z. B. "Starke Garnison", "Ritterorden", "Festungs-Garnison", "Heerlager"): Platziere 6 bis 10 schwer bewaffnete Militär-Tokens. Integriere ein eigenes Kaserne- oder Garnison-Gebäude (🏰), einen "Garde-Hauptmann", "Scharfschützen auf dem Wehrturm", "Ritter-Garde" und eine "Waffenkammer". Die Ausrüstung und Loyalität muss der Fraktion ("${territory?.faction || ''}") entsprechen.

${isSettlement ? `
3. SPEZIELL FÜR DÖRFER, STÄDTE, HÄFEN & SIEDLUNGEN ("${territory?.name || 'Dorf'}"):
   - EIN ECHTES DORF / EINE ECHTE STADT BRAUCHT ENORME DICHTE, STRASSEN UND WEGE:
     * 1. HOHE GEBÄUDE-DICHTE: Setze VIELFACHE Häuser-Kacheln ('haus') in Gruppen und Straßenzügen!
     * 2. MINDESTENS 50% bis 75% DER INLANDS-FLÄCHE MÜSSEN GEBÄUDE ('haus') ODER WEGE/STRASSEN ('weg') SEIN!
     * 3. REDUZIERE GRÜNE KACHELN ('gras') AUF EIN MINIMUM! Vermeide große leere grüne Flächen komplett. Das Gebiet muss dicht bebaut wirken.
     * 4. LOGISCHES, ZUSAMMENHÄNGENDES WEGENETZ: Zeichne breite und miteinander verknüpfte Straßen/Wege ('weg' oder 'strasse'), die ein echtes städtisches/dörfliches Straßennetz bilden und alle Gebäude verbinden.
     * 5. MARKT- ODER DORFPLATZ: Erstelle einen großen, gepflasterten Zentralplatz aus 'weg'-Kacheln mit einem Brunnen/Versammlungsplatz (⛲) oder Marktständen (⚖️).
     * 6. HAFEN UND SCHIFFFAHRT (falls Hafen/Küste z.B. im Westen verlangt):
       - Baue auf der Küstenseite Wasser ('ozean'), gefolgt von Sandstrand ('strand').
       - Baue vom Land/Strand in das Wasserbecken hinein breite Holzstege/Piers aus 'hafen' oder 'bruecke' Kacheln.
       - Platziere am Pier das Hafen-Token (⚓ "Hafen / Kai") und auf den angrenzenden Wasserkacheln Schiffe/Boote (⛵, 🚣).
       - VERRAT/FEHLER-VERMEIDUNG: Setze Wasser NUR auf die Hafen-Küstenseite! Die anderen Ränder MÜSSEN Land sein!
     * 7. REICHHALTIGE TOKENS IN 'placedObjects' (MANDATORISCH):
       - Platziere reichlich Interaktions-Tokens für ALLE bekannten Orte auf den entsprechenden Häuser-/Hafen-Kacheln:
         * Taverne / Schänke (🍺)
         * Schmiede / Handwerker (🔨)
         * Händler / Marktstände (⚖️, 📦, 🛒)
         * Wohnviertel / Wohnhäuser (🏠, 🏡)
         * Wachen / Ortseingang (🛡️)
         * Hafen / Anlegestelle (⚓)
         * Brunnen / Treffpunkt (⛲)
         * Besondere Kodex-Orte (⛩️, 🏰, 🕳️, 🌲)
      * 8. NATÜRLICHE VERTEILUNG & SPREIDUNG (KEINE REIHENBILDUNG):
        - Verteile die besonderen Orte, Geschäfte, Tavernen, Schmieden, Wachtürme und Tore logisch über die gesamte städtische Landfläche! Platziere sie NIEMALS alle in einer einzigen geraden Reihe nebeneinander (wie z. B. aufgereiht direkt über dem Hafenbecken) oder konzentriert an einem Fleck.
        - Sprenge sie im Straßennetz auf: Marktstände auf dem zentralen Marktplatz, die Taverne inmitten der gemütlichen Wohnviertel, die Schmiede am Rand, das Rathaus/Gildehaus auf einem eigenen Platz und die Wachen an den Haupttoren und Straßenkreuzungen. Dies lässt die Stadt extrem realistisch, abwechslungsreich und organisch wirken.
` : isDungeon ? `
3. SPEZIELL FÜR DUNGEONS, HÖHLEN & RUINEN ("${territory?.name}"):
   - Erstelle verzweigte Gänge ('hoehle', 'weg', 'stein'), Felswände ('berg' oder 'mauer'), Eingangsbereiche, Fallenkammern, Schatzkammern und Boss-Arenen.
` : isWorldMap ? `
3. SPEZIELL FÜR WELTKARTEN, OZEANE & KONTINENTE ("${territory?.name}"):
   - Wasser ('ozean') als Basis für Meere, oder Land ('gras') für Kontinente.
   - Inseln ('insel'), Küsten ('strand'), Gebirge ('berg'), Flüsse ('fluss') und Rote Felswände ('roteline').
   - STRIKTE INSEL-LOGIK: Wenn du eine Insel baust (defaultTerrain='ozean'), muss die Insel eine solide Landmasse (bestehend aus 'insel', 'strand', 'gras', 'wald', 'berg') in der Mitte bilden. Setze NICHT abwheelnd Wasser und Land. Die Küste muss logisch die Landmasse umrunden.
   - Platziere Untergebiet-Tokens ('placedObjects') streng an ihren geografischen Koordinaten.
` : `
3. SPEZIELL FÜR NATUR- GEBIETE, WÄLDER, TÄLER & GEBIRGE ("${territory?.name}"):
   - Nimm 'gras' als Grundgelände.
   - Erstelle dicht bewaldete Zonen ('wald'), geschwungene Flussläufe ('fluss') mit Holzbrücken ('bruecke'), Waldpfade ('weg'), Felsformationen ('berg').
`}

4. REICHHALTIGES TERRAIN-SYSTEM:
   Nutze nur passende Werte aus: "ozean", "insel", "hafen", "roteline", "grandline", "gras", "weg", "wald", "haus", "berg", "fluss", "sumpf", "wueste", "schnee", "vulkan", "hoehle", "strand", "bruecke", "ruine".

5. AUSFÜLLEN VON TERRAIN & FEATURES:
   - Wähle ein passendes 'defaultTerrain' (z.B. "gras" für Dörfer/Landkarten, "ozean" für Meere/Weltkarten, "hoehle" für Höhlen).
   - Gib in 'tiles' eine Liste von Kacheln [{ x, y, terrain }] an, die vom defaultTerrain abweichen (z.B. Häuser, Wege, Wälder, Flüsse, Brücken).

6. OBJEKTE & TOKENS ('placedObjects'):
   - Platziere Interaktionspunkte/Tokens auf geeigneten Kacheln. (z.B. Schiffe auf Wasser, Häuser auf Land).
   - Setze für jedes Objekt:
     * 'id': Einzigartige ID
     * 'name': Name des Orts/Eintrags
     * 'category': 'Siedlungen & Orte', 'Gebäude & Bauwerke', 'Marker & Orte' etc.
     * 'icon': Ein ERLAUBTES Emoji aus der untenstehenden Liste!
     * 'description': Kurze Beschreibung
     * 'x', 'y': Koordinate auf dem Raster.

   - ERLAUBTE TOKEN-EMOJIS (STRENG LIMITIERT):
     - Zivile Personen: 🟢 (Mensch/NPC), 👤 (Person), 🧑‍🌾 (Bauer), 🧜‍♀️ (Meerjungfrau)
     - Feinde/Monster: 👿 (Goblin), 👹 (Ork), 💀 (Skelett), 🧟 (Zombie), 👻 (Geist), 🕷️ (Spinne), 🧌 (Troll), 🐉 (Drache), 🐺 (Wolf), 🧛 (Vampir), 🐊 (Krokodil), 🐙 (Krake)
     - Gebäude/Orte: 🏠 (Wohnhaus), 🏡 (Landhaus/Dorf), 🛖 (Hütte), 🏘️ (Siedlung/Kleinstadt), 🏢 (Stadt/Gebäude), 🏛️ (Palast/Ruine), 🏰 (Burg/Schloss), 🏯 (Festung), 🗼 (Turm), ⛺ (Lager/Zelt), 🕳️ (Höhle/Versteck), 🕸️ (Untergrundbasis), 📡 (Außenposten), ⛲ (Dorfplatz/Brunnen), ⛩️ (Schrein), 🪦 (Friedhof), 🔥 (Lagerfeuer)
     - Natur/Gelände: 🌲 (Wald/Baum), 🌴 (Palme), 🪨 (Stein/Fels), 🌋 (Vulkan), 🌀 (Portal/Strudel)
     - Schiffe/Fahrzeuge: 🚣 (Ruderboot), 🛶 (Kanu), 🪵 (Floß), ⛵ (Segelboot), 🚢 (Großes Schiff), 🛳️ (U-Boot), ⛴️ (Dampfschiff), 🛒 (Karren), 🐎 (Kutsche), 🚛 (Wagen), 🛷 (Schlitten)
     - Items/Handel: 💎 (Schatz), 🍺 (Taverne), 🔨 (Schmiede), ⚖️ (Markt), 📦 (Kiste)
     - Markierungen: 📌 (Standard Marker), 📍 (Ort Marker), ⚓ (Hafen/Anker), ⚔️ (Schlacht/Söldner)
     Du DARFST KEINE ANDEREN Emojis für das Feld 'icon' verwenden! Wähle das am besten passende Emoji aus dieser Liste.

7. STRENGSTE VERBINDUNG / SYNCHRONISATION VON GEBÄUDE-, MAUER- & WALD-TOKENS MIT KACHELN:
   - JEDES Gebäude-Token (🏠, 🏡, 🛖, 🏘️, 🏢, 🏛️, 🍺, 🔨, ⚖️, 📦, ⛪) in 'placedObjects' MUSS zwingend auf einer Kachel platziert werden, die in 'tiles' als 'haus' definiert ist!
   - JEDES Festungs-/Mauer-/Turm-Token (🏰, 🏯, 🗼, 🛡️) MUSS auf einer Kachel mit Terrain 'mauer' oder 'haus' stehen!
   - JEDES Baum-/Wald-Token (🌲, 🌴) MUSS auf einer 'wald'-Kachel stehen!
   - JEDES Hafen-Token (⚓) MUSS auf einer 'hafen'- oder 'strand'-Kachel stehen!
   - UMGEKEHRT: Platziere für jede 'haus'-Kachel auf der Karte auch passende Gebäude-Tokens in 'placedObjects'! Nutze reichlich Wohnhäuser, Schänken und Werkstätten, damit das Dorf niemals karg wirkt.

8. SPIELER-STARTPOSITION ('positions'):
   Gib { "Spieler": { "x": 3, "y": 10 } } auf einer zugänglichen Weg- oder Graskachel an.

${customInstruction ? `--- ZUSÄTZLICHE NUTZERANWEISUNG ---\n${customInstruction}\n` : ''}

Gib deine Antwort als Valides JSON zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tileSizeMeters: { type: Type.INTEGER },
              gridWidth: { type: Type.INTEGER },
              gridHeight: { type: Type.INTEGER },
              defaultTerrain: {
                type: Type.STRING,
                description: "Das Standard-Basis-Gelände für das gesamte Raster, z.B. 'ozean' für Welt/Ozeankarten oder 'gras' für Landkarten"
              },
              tiles: {
                type: Type.ARRAY,
                description: "Liste spezifischer Kacheln mit abweichendem Terrain, z.B. [{ x: 5, y: 10, terrain: 'roteline' }]",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    terrain: { type: Type.STRING }
                  },
                  required: ["x", "y", "terrain"]
                }
              },
              placedObjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    loreEntryId: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER }
                  },
                  required: ["id", "name", "icon", "x", "y"]
                }
              },
              positions: {
                type: Type.OBJECT,
                properties: {
                  Spieler: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.INTEGER },
                      y: { type: Type.INTEGER }
                    },
                    required: ["x", "y"]
                  }
                },
                required: ["Spieler"]
              },
              updatedTerritoryFields: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  biome: { type: Type.STRING },
                  size: { type: Type.STRING },
                  ruler: { type: Type.STRING },
                  culture: { type: Type.STRING },
                  climate: { type: Type.STRING },
                  terrain: { type: Type.STRING },
                  faction: { type: Type.STRING }
                }
              }
            },
            required: ["tileSizeMeters", "gridWidth", "gridHeight", "defaultTerrain", "tiles", "placedObjects", "positions", "updatedTerritoryFields"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      const parsed = this.parseJSONSafely(response.text || '{}', {});
      const w = parsed.gridWidth || 25;
      const h = parsed.gridHeight || 18;

      const territoryType = (territory?.type || '').toLowerCase();
      const territoryTerrain = (territory?.terrain || '').toLowerCase();
      const fallbackBase = (territoryType === 'welt' || territoryType === 'meer' || territoryTerrain.includes('ozean') || territoryTerrain.includes('meer')) ? 'ozean' : 'gras';
      const baseTerrain = (parsed.defaultTerrain || '').toLowerCase().trim() || fallbackBase;

      const tilesMap: Record<string, string> = {};

      // Initialize grid with base terrain
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          tilesMap[`${c},${r}`] = baseTerrain;
        }
      }

      // Apply overrides
      if (Array.isArray(parsed.tiles)) {
        parsed.tiles.forEach((t: any) => {
          if (t && typeof t.x === 'number' && typeof t.y === 'number' && t.terrain) {
            if (t.x >= 0 && t.x < w && t.y >= 0 && t.y < h) {
              tilesMap[`${t.x},${t.y}`] = String(t.terrain).toLowerCase().trim();
            }
          }
        });
      } else if (parsed.tiles && typeof parsed.tiles === 'object') {
        Object.entries(parsed.tiles).forEach(([k, v]) => {
          if (typeof v === 'string') {
            tilesMap[k] = v.toLowerCase().trim();
          }
        });
      }

      // Clean up stray/unrealistic tiles if not explicitly justified by territory description
      const fullTerritoryText = `${territory?.name || ''} ${territory?.description || ''} ${territory?.biome || ''} ${territory?.terrain || ''}`.toLowerCase();
      const allowsVolcano = fullTerritoryText.includes('vulkan') || fullTerritoryText.includes('lava') || fullTerritoryText.includes('magma') || fullTerritoryText.includes('feuer');
      const allowsSnow = fullTerritoryText.includes('schnee') || fullTerritoryText.includes('eis') || fullTerritoryText.includes('gletscher') || fullTerritoryText.includes('frost') || fullTerritoryText.includes('tundra') || fullTerritoryText.includes('arctic');
      const allowsOcean = fullTerritoryText.includes('ozean') || fullTerritoryText.includes('meer') || fullTerritoryText.includes('see') || fullTerritoryText.includes('insel') || fullTerritoryText.includes('hafen') || fullTerritoryText.includes('küste') || fullTerritoryText.includes('strand') || territoryType === 'welt' || territoryType === 'meer';

      Object.keys(tilesMap).forEach(key => {
        const val = tilesMap[key];
        if ((val === 'vulkan' || val === 'lava') && !allowsVolcano) {
          tilesMap[key] = isSettlement ? 'weg' : baseTerrain;
        }
        if ((val === 'schnee' || val === 'eis') && !allowsSnow) {
          tilesMap[key] = isSettlement ? 'gras' : baseTerrain;
        }
        if (val === 'ozean' && !allowsOcean && isSettlement) {
          tilesMap[key] = 'fluss'; // Replace ocean tile with river or grass
        }
      });

      // Clean up stray water (ozean, fluss, strand, hafen) inside the inland area if we have a coast layout
      if (isHafenOrKueste && determinedCoastSide) {
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            let isStray = false;
            if (determinedCoastSide === 'south' && r < h - 4) isStray = true;
            else if (determinedCoastSide === 'north' && r > 3) isStray = true;
            else if (determinedCoastSide === 'west' && c > 3) isStray = true;
            else if (determinedCoastSide === 'east' && c < w - 4) isStray = true;

            if (isStray) {
              const k = `${c},${r}`;
              const val = tilesMap[k];
              if (val === 'ozean' || val === 'fluss' || val === 'strand' || val === 'hafen') {
                tilesMap[k] = 'gras';
              }
            }
          }
        }
      }

      // Village / Settlement layout enhancer: Ensure settlements have plenty of houses along roads!
      if (isSettlement) {
        // Determine inland / land boundaries for building blocks if we have a coast layout
        let minX = 0, maxX = w - 1;
        let minY = 0, maxY = h - 1;

        if (isHafenOrKueste && determinedCoastSide) {
          if (determinedCoastSide === 'south') maxY = h - 5;
          else if (determinedCoastSide === 'north') minY = 4;
          else if (determinedCoastSide === 'west') minX = 4;
          else if (determinedCoastSide === 'east') maxX = w - 5;
        }

        // We want a very dense, structured medieval/fantasy settlement layout.
        // We will build a network of paved streets/ways and dense house blocks.
        const streetCols = new Set<number>();
        const streetRows = new Set<number>();

        // Main vertical streets (usually 2-3 depending on width)
        streetCols.add(Math.floor((minX + maxX) / 2));
        if (maxX - minX > 12) {
          streetCols.add(Math.floor(minX + (maxX - minX) * 0.25));
          streetCols.add(Math.floor(minX + (maxX - minX) * 0.75));
        }

        // Main horizontal streets (usually 2-3 depending on height)
        streetRows.add(Math.floor((minY + maxY) / 2));
        if (maxY - minY > 8) {
          streetRows.add(Math.floor(minY + (maxY - minY) * 0.25));
          streetRows.add(Math.floor(minY + (maxY - minY) * 0.75));
        }

        // If harbor is present, let's make sure we have a street running parallel to the harbor waterfront
        if (isHafenOrKueste && determinedCoastSide === 'south') {
          streetRows.add(maxY + 1);
        } else if (isHafenOrKueste && determinedCoastSide === 'north') {
          streetRows.add(minY - 1);
        } else if (isHafenOrKueste && determinedCoastSide === 'west') {
          streetCols.add(minX - 1);
        } else if (isHafenOrKueste && determinedCoastSide === 'east') {
          streetCols.add(maxX + 1);
        }

        // Populate tile map with high building and street density
        for (let r = minY; r <= maxY; r++) {
          for (let c = minX; c <= maxX; c++) {
            const key = `${c},${r}`;
            const existingTile = tilesMap[key];

            // DO NOT overwrite natural obstacles, water, or structures placed by AI
            if (
              existingTile === 'berg' ||
              existingTile === 'vulkan' ||
              existingTile === 'fluss' ||
              existingTile === 'ozean' ||
              existingTile === 'wald' ||
              existingTile === 'bruecke' ||
              existingTile === 'strand' ||
              existingTile === 'hafen' ||
              existingTile === 'ruine' ||
              existingTile === 'weg' ||
              existingTile === 'strasse' ||
              existingTile === 'neonweg' ||
              existingTile === 'asphalt' ||
              existingTile === 'gehweg'
            ) {
              continue;
            }

            // Is this coordinate part of the street grid?
            if (streetCols.has(c) || streetRows.has(r)) {
              tilesMap[key] = 'weg'; // Paved road / way
            } else {
              // Inside housing blocks! Alternate buildings with narrow alleys & small gardens
              const hash = (c * 17 + r * 31) % 100;
              if (hash < 68) {
                tilesMap[key] = 'haus'; // Building/house
              } else if (hash < 85) {
                tilesMap[key] = 'weg'; // Narrow side alleyway
              } else if (hash < 93) {
                tilesMap[key] = 'gras'; // Small inner courtyard/plaza garden
              } else {
                tilesMap[key] = 'wald'; // Courtyard tree/vegetation
              }
            }
          }
        }

        // Keep any custom streets or harbor areas the AI specifically defined
        if (Array.isArray(parsed.tiles)) {
          parsed.tiles.forEach((t: any) => {
            if (t && typeof t.x === 'number' && typeof t.y === 'number' && (t.terrain === 'weg' || t.terrain === 'strasse' || t.terrain === 'hafen')) {
              if (t.x >= 0 && t.x < w && t.y >= 0 && t.y < h) {
                tilesMap[`${t.x},${t.y}`] = t.terrain;
              }
            }
          });
        }

        // Create a central town square / market plaza (Marktplatz)
        const plazaSize = 1; 
        const plazaX = Math.floor((minX + maxX) / 2);
        const plazaY = Math.floor((minY + maxY) / 2);
        for (let pr = plazaY - plazaSize; pr <= plazaY + plazaSize; pr++) {
          for (let pc = plazaX - plazaSize; pc <= plazaX + plazaSize; pc++) {
            if (pc >= 0 && pc < w && pr >= 0 && pr < h) {
              const k = `${pc},${pr}`;
              if (tilesMap[k] !== 'berg' && tilesMap[k] !== 'fluss' && tilesMap[k] !== 'ozean') {
                tilesMap[k] = 'weg'; // Paved main square
              }
            }
          }
        }

        // Ensure player start position is always placed on a walkable tile (weg)
        if (parsed.positions?.Spieler) {
          const sx = parsed.positions.Spieler.x;
          const sy = parsed.positions.Spieler.y;
          if (typeof sx === 'number' && typeof sy === 'number' && sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const key = `${sx},${sy}`;
            if (tilesMap[key] === 'haus' || tilesMap[key] === 'berg' || tilesMap[key] === 'ozean') {
              tilesMap[key] = 'weg';
            }
          }
        }
      }

      // Enforce macro-geography border continuity or harbor/coastal layout overrides
      if (isHafenOrKueste && determinedCoastSide) {
        if (determinedCoastSide === 'south') {
          for (let c = 0; c < w; c++) {
            const k1 = `${c},${h - 1}`;
            const k2 = `${c},${h - 2}`;
            const k3 = `${c},${h - 3}`;
            const k4 = `${c},${h - 4}`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'ozean';
            if (tilesMap[k2] !== 'bruecke' && tilesMap[k2] !== 'weg') tilesMap[k2] = 'ozean';
            if (tilesMap[k3] !== 'bruecke' && tilesMap[k3] !== 'weg' && tilesMap[k3] !== 'haus') tilesMap[k3] = 'hafen';
            if (tilesMap[k4] !== 'bruecke' && tilesMap[k4] !== 'weg' && tilesMap[k4] !== 'haus') tilesMap[k4] = 'strand';
          }
        } else if (determinedCoastSide === 'north') {
          for (let c = 0; c < w; c++) {
            const k1 = `${c},0`;
            const k2 = `${c},1`;
            const k3 = `${c},2`;
            const k4 = `${c},3`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'ozean';
            if (tilesMap[k2] !== 'bruecke' && tilesMap[k2] !== 'weg') tilesMap[k2] = 'ozean';
            if (tilesMap[k3] !== 'bruecke' && tilesMap[k3] !== 'weg' && tilesMap[k3] !== 'haus') tilesMap[k3] = 'hafen';
            if (tilesMap[k4] !== 'bruecke' && tilesMap[k4] !== 'weg' && tilesMap[k4] !== 'haus') tilesMap[k4] = 'strand';
          }
        } else if (determinedCoastSide === 'west') {
          for (let r = 0; r < h; r++) {
            const k1 = `0,${r}`;
            const k2 = `1,${r}`;
            const k3 = `2,${r}`;
            const k4 = `3,${r}`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'ozean';
            if (tilesMap[k2] !== 'bruecke' && tilesMap[k2] !== 'weg') tilesMap[k2] = 'ozean';
            if (tilesMap[k3] !== 'bruecke' && tilesMap[k3] !== 'weg' && tilesMap[k3] !== 'haus') tilesMap[k3] = 'hafen';
            if (tilesMap[k4] !== 'bruecke' && tilesMap[k4] !== 'weg' && tilesMap[k4] !== 'haus') tilesMap[k4] = 'strand';
          }
        } else if (determinedCoastSide === 'east') {
          for (let r = 0; r < h; r++) {
            const k1 = `${w - 1},${r}`;
            const k2 = `${w - 2},${r}`;
            const k3 = `${w - 3},${r}`;
            const k4 = `${w - 4},${r}`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'ozean';
            if (tilesMap[k2] !== 'bruecke' && tilesMap[k2] !== 'weg') tilesMap[k2] = 'ozean';
            if (tilesMap[k3] !== 'bruecke' && tilesMap[k3] !== 'weg' && tilesMap[k3] !== 'haus') tilesMap[k3] = 'hafen';
            if (tilesMap[k4] !== 'bruecke' && tilesMap[k4] !== 'weg' && tilesMap[k4] !== 'haus') tilesMap[k4] = 'strand';
          }
        }
      } else {
        if (borderDirections.south.water) {
          for (let c = 0; c < w; c++) {
            const k1 = `${c},${h - 1}`;
            const k2 = `${c},${h - 2}`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'fluss';
            if (tilesMap[k2] !== 'bruecke' && tilesMap[k2] !== 'weg' && tilesMap[k2] !== 'haus') tilesMap[k2] = 'fluss';
          }
        }

        if (borderDirections.north.water) {
          for (let c = 0; c < w; c++) {
            const k1 = `${c},0`;
            const k2 = `${c},1`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'fluss';
            if (tilesMap[k2] !== 'bruecke' && tilesMap[k2] !== 'weg' && tilesMap[k2] !== 'haus') tilesMap[k2] = 'fluss';
          }
        }

        if (borderDirections.west.water) {
          for (let r = 0; r < h; r++) {
            const k1 = `0,${r}`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'fluss';
          }
        }

        if (borderDirections.east.water) {
          for (let r = 0; r < h; r++) {
            const k1 = `${w - 1},${r}`;
            if (tilesMap[k1] !== 'bruecke' && tilesMap[k1] !== 'weg') tilesMap[k1] = 'fluss';
          }
        }
      }

      // Enforce incoming roads connecting from edges into village center
      const cY = Math.floor(h / 2);
      const cX = Math.floor(w / 2);

      if (borderDirections.west.road) {
        for (let c = 0; c <= cX; c++) {
          const k = `${c},${cY}`;
          if (tilesMap[k] !== 'haus' && tilesMap[k] !== 'fluss') {
            tilesMap[k] = 'weg';
          }
        }
      }

      if (borderDirections.east.road) {
        for (let c = w - 1; c >= cX; c--) {
          const k = `${c},${cY}`;
          if (tilesMap[k] !== 'haus' && tilesMap[k] !== 'fluss') {
            tilesMap[k] = 'weg';
          }
        }
      }

      if (borderDirections.north.road) {
        for (let r = 0; r <= cY; r++) {
          const k = `${cX},${r}`;
          if (tilesMap[k] !== 'haus' && tilesMap[k] !== 'fluss') {
            tilesMap[k] = 'weg';
          }
        }
      }

      if (borderDirections.south.road) {
        for (let r = h - 1; r >= cY; r--) {
          const k = `${cX},${r}`;
          if (tilesMap[k] !== 'haus' && tilesMap[k] !== 'fluss') {
            tilesMap[k] = 'weg';
          } else if (tilesMap[k] === 'fluss') {
            tilesMap[k] = 'bruecke'; // Bridge over river if south road crosses river!
          }
        }
      }

      let placedObjects: any[] = parsed.placedObjects || [];

      // Post-processing: ensure loreEntryId is populated for placedObjects matching subTerritories or loreLocations
      placedObjects = placedObjects.map((obj: any) => {
        if (!obj.loreEntryId) {
          const objNameLower = (obj.name || '').trim().toLowerCase();
          const matchedTerr = subTerritories.find((st: any) => (st.name || st.title || '').trim().toLowerCase() === objNameLower);
          if (matchedTerr) {
            return { ...obj, loreEntryId: `terr-${matchedTerr.id}` };
          }
          const matchedLore = loreLocations.find((loc: any) => loc.title.trim().toLowerCase() === objNameLower);
          if (matchedLore) {
            return { ...obj, loreEntryId: matchedLore.id };
          }
        }
        return obj;
      });

      // Bounding box of subTerritories for canon coordinate projection
      const validSubCoords = subTerritories.filter((st: any) => typeof st.x === 'number' && typeof st.y === 'number');
      let minStX = Infinity, maxStX = -Infinity, minStY = Infinity, maxStY = -Infinity;
      validSubCoords.forEach((st: any) => {
        if (st.x < minStX) minStX = st.x;
        if (st.x > maxStX) maxStX = st.x;
        if (st.y < minStY) minStY = st.y;
        if (st.y > maxStY) maxStY = st.y;
      });

      const getCanonCoordsForSub = (st: any) => {
        let normX = 0.5;
        let normY = 0.5;
        if (typeof st.x === 'number' && typeof st.y === 'number') {
          if (maxStX > minStX) {
            normX = (st.x - minStX) / (maxStX - minStX);
          } else {
            normX = Math.min(Math.max(st.x / 1000, 0.1), 0.9);
          }
          if (maxStY > minStY) {
            normY = (st.y - minStY) / (maxStY - minStY);
          } else {
            normY = Math.min(Math.max(st.y / 1000, 0.1), 0.9);
          }
        } else {
          const text = `${st.name || ''} ${st.description || ''}`.toLowerCase();
          if (text.includes('nordwest') || text.includes('west blue') || text.includes('north blue')) { normX = 0.25; normY = 0.25; }
          else if (text.includes('nordost') || text.includes('east blue')) { normX = 0.75; normY = 0.25; }
          else if (text.includes('südwest') || text.includes('south blue')) { normX = 0.25; normY = 0.75; }
          else if (text.includes('südost')) { normX = 0.75; normY = 0.75; }
          else if (text.includes('nord')) { normY = 0.25; }
          else if (text.includes('süd')) { normY = 0.75; }
          else if (text.includes('west')) { normX = 0.25; }
          else if (text.includes('ost')) { normX = 0.75; }
        }

        const px = Math.min(Math.max(Math.round(1 + normX * (w - 3)), 1), w - 2);
        const py = Math.min(Math.max(Math.round(1 + normY * (h - 3)), 1), h - 2);
        return { x: px, y: py };
      };

      // Ensure 100% of subTerritories have a placedObject token on the map at their canon location
      const existingCoords = new Set(placedObjects.map((o: any) => `${o.x},${o.y}`));
      subTerritories.forEach((st: any) => {
        const stNameLower = (st.name || st.title || '').trim().toLowerCase();
        const alreadyPlaced = placedObjects.some((o: any) =>
          (o.name || '').trim().toLowerCase() === stNameLower ||
          o.loreEntryId === `terr-${st.id}`
        );

        if (!alreadyPlaced) {
          const canonPos = getCanonCoordsForSub(st);
          let placedX = canonPos.x;
          let placedY = canonPos.y;

          // If coordinate is taken, find closest free tile around canonPos
          if (existingCoords.has(`${placedX},${placedY}`)) {
            let found = false;
            for (let radius = 1; radius < Math.max(w, h); radius++) {
              for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                  const cx = placedX + dx;
                  const cy = placedY + dy;
                  if (cx >= 1 && cx < w - 1 && cy >= 1 && cy < h - 1 && !existingCoords.has(`${cx},${cy}`)) {
                    placedX = cx;
                    placedY = cy;
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
              if (found) break;
            }
          }
          existingCoords.add(`${placedX},${placedY}`);

          const typeLabel = (st.type || '').toLowerCase();
          const icon = typeLabel === 'stadt' ? '🏙️'
            : typeLabel === 'insel' ? '🏝️'
            : typeLabel === 'gebäude' ? '🏰'
            : typeLabel === 'meer' ? '🌊'
            : typeLabel === 'vulkan' ? '🌋'
            : '📍';

          placedObjects.push({
            id: `obj-terr-${st.id}`,
            name: st.name || st.title,
            icon,
            category: 'Siedlungen & Orte',
            description: st.description || `Untergebiet (${st.type || 'Region'})`,
            loreEntryId: `terr-${st.id}`,
            x: placedX,
            y: placedY
          });
        }
      });

      // Ensure land/island tiles exist underneath land-based placedObjects if the map base is ocean
      placedObjects.forEach((obj: any) => {
        const currentTile = tilesMap[`${obj.x},${obj.y}`];
        const nameLower = (obj.name || '').toLowerCase();

        if (!currentTile || currentTile === 'ozean') {
          const cat = (obj.category || '').toLowerCase();
          if (cat.includes('siedlung') || cat.includes('ort') || cat.includes('gebäude') || nameLower.includes('insel') || nameLower.includes('stadt') || nameLower.includes('hafen')) {
            tilesMap[`${obj.x},${obj.y}`] = nameLower.includes('hafen') ? 'hafen' : 'insel';
            // Add small surrounding island shore tiles if deep ocean
            const neighbors = [
              { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
            ];
            neighbors.forEach(n => {
              const nx = obj.x + n.dx;
              const ny = obj.y + n.dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h && tilesMap[`${nx},${ny}`] === 'ozean') {
                tilesMap[`${nx},${ny}`] = 'strand';
              }
            });
          }
        }

        // STRENGSTE VERBINDUNG / SYNCHRONISATION VON TOKENS ZU TERRAIN-KACHELN:
        const objKey = `${obj.x},${obj.y}`;
        const icon = obj.icon || '';
        const catLower = (obj.category || '').toLowerCase();
        
        // 1. Gebäude-Tokens (Wohnhäuser, Schänken, Schmieden, Märkte etc.) -> Unterliegende Kachel MUSS 'haus' sein!
        const isBuildingToken = ['🏠', '🏡', '🛖', '🏘️', '🏢', '🏛️', '🍺', '🔨', '⚖️', '📦', '⛪', '🏨', '🍽️'].includes(icon) ||
          catLower.includes('gebäude') || catLower.includes('bauwerk') || catLower.includes('wohn') ||
          nameLower.includes('haus') || nameLower.includes('hütte') || nameLower.includes('taverne') || nameLower.includes('schänke') || nameLower.includes('schmiede') || nameLower.includes('markt') || nameLower.includes('gilde') || nameLower.includes('amt') || nameLower.includes('wohnung');

        if (isBuildingToken) {
          const t = tilesMap[objKey];
          if (!t || t === 'gras' || t === 'wald' || t === 'berg' || t === baseTerrain) {
            tilesMap[objKey] = 'haus';
          }
        }

        // 2. Festung / Mauer / Turm Tokens -> Unterliegende Kachel MUSS 'mauer' (oder 'haus') sein!
        const isWallToken = ['🏰', '🏯', '🗼', '🛡️'].includes(icon) ||
          nameLower.includes('mauer') || nameLower.includes('turm') || nameLower.includes('festung') || nameLower.includes('burg') || nameLower.includes('palisade') || nameLower.includes('garnison') || nameLower.includes('kaserne');

        if (isWallToken) {
          const t = tilesMap[objKey];
          if (!t || t === 'gras' || t === 'wald' || t === baseTerrain) {
            tilesMap[objKey] = 'mauer';
          }
        }

        // 3. Baum / Wald Tokens -> Unterliegende Kachel MUSS 'wald' sein!
        const isTreeToken = ['🌲', '🌴'].includes(icon) || nameLower.includes('wald') || nameLower.includes('baum') || nameLower.includes('hain');
        if (isTreeToken) {
          const t = tilesMap[objKey];
          if (!t || t === 'gras' || t === baseTerrain) {
            tilesMap[objKey] = 'wald';
          }
        }

        // For harbour tokens: Ensure harbour sits directly at the water (bordering ocean/water)
        if (icon === '⚓' || nameLower.includes('hafen') || (obj.typeLabel || '').toLowerCase() === 'hafen' || (obj.type || '').toLowerCase() === 'hafen') {
          tilesMap[objKey] = 'hafen';
          const neighbors = [
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
          ];
          const hasWaterNeighbor = neighbors.some(n => {
            const t = tilesMap[`${obj.x + n.dx},${obj.y + n.dy}`];
            return t === 'ozean' || t === 'fluss' || t === 'meer' || t === 'wasser';
          });

          if (!hasWaterNeighbor) {
            // Pick direction towards nearest edge to create ocean water
            let dy = obj.y >= Math.floor(h / 2) ? 1 : -1;
            if (obj.y + dy >= 0 && obj.y + dy < h) {
              tilesMap[`${obj.x},${obj.y + dy}`] = 'ozean';
            } else {
              tilesMap[`${obj.x + 1},${obj.y}`] = 'ozean';
            }
          }
        }

        // For settlement maps: If a token represents a path/exit to a natural landmark (e.g. "Pfad zum Vulkan", "Weg in den Wald"),
        // create a realistic forest/mountain transition zone with a pathway rather than an isolated tile!
        if (isSettlement && (nameLower.includes('pfad') || nameLower.includes('pass') || nameLower.includes('ausgang') || nameLower.includes('weg zu') || nameLower.includes('vulkan') || nameLower.includes('wald'))) {
          const tKey = `${obj.x},${obj.y}`;
          if (tilesMap[tKey] !== 'weg' && tilesMap[tKey] !== 'berg' && tilesMap[tKey] !== 'haus') {
            tilesMap[tKey] = nameLower.includes('vulkan') || nameLower.includes('berg') ? 'berg' : 'weg';
          }
          // Frame surrounding tile radius with forest ('wald') tiles to form a dense forest/nature buffer at the map edge
          const radiusOffsets = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 },
            { dx: -2, dy: 0 }, { dx: 2, dy: 0 }, { dx: 0, dy: -2 }, { dx: 0, dy: 2 }
          ];
          radiusOffsets.forEach(off => {
            const rx = obj.x + off.dx;
            const ry = obj.y + off.dy;
            if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
              const rKey = `${rx},${ry}`;
              if (tilesMap[rKey] === 'gras' || !tilesMap[rKey]) {
                tilesMap[rKey] = 'wald';
              }
            }
          });
        }
      });

      // UMGEKEHRTE SYNCHRONISATION (LANDSCHAFTS-KACHELN -> TOKENS):
      // Für jede 'haus'-Kachel auf der Karte: Falls dort noch kein Gebäude-Token platziert wurde, automatisch ein Wohnhaus-Token ergänzen!
      const occupiedCoords = new Set(placedObjects.map((o: any) => `${o.x},${o.y}`));
      
      Object.entries(tilesMap).forEach(([kKey, tVal]) => {
        if (tVal === 'haus' && !occupiedCoords.has(kKey)) {
          const [hx, hy] = kKey.split(',').map(Number);
          if (hx >= 0 && hx < w && hy >= 0 && hy < h) {
            placedObjects.push({
              id: `obj-house-${hx}-${hy}`,
              name: "Wohnhaus",
              icon: "🏠",
              category: "Gebäude & Bauwerke",
              description: "Ein bewohntes Gebäude in der Siedlung.",
              x: hx,
              y: hy
            });
            occupiedCoords.add(kKey);
          }
        }
      });

      const finalUpdatedTerritoryFields = parsed.updatedTerritoryFields || {};
      const actualTileSize = parsed.tileSizeMeters || 10;
      finalUpdatedTerritoryFields.size = `${w}x${h} Kacheln (Maßstab: 1 Kachel = ${actualTileSize}m)`;

      return {
        tileSizeMeters: actualTileSize,
        gridWidth: w,
        gridHeight: h,
        tiles: tilesMap,
        placedObjects,
        positions: parsed.positions || { Spieler: { x: 3, y: 10 } },
        updatedTerritoryFields: finalUpdatedTerritoryFields
      };
    });
  }

  static async generateNaturalGeography(
    title: string,
    description: string,
    tags: string[],
    userSettings: { worldSize?: string, continentsCount?: number, climateZones?: string },
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const sizeStr = userSettings.worldSize || 'Mittel';
      const continentsStr = userSettings.continentsCount !== undefined ? `${userSettings.continentsCount}` : 'generiert';
      const climateStr = userSettings.climateZones || 'gemäßigt und kontrastreich';

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, physischer Geograf und Kartograf für anspruchsvolle RPGs.
Analysiere die folgende Weltbeschreibung und Tags/Genres:
Weltname: "${title}"
Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]

Gewünschte globale Parameter (respektiere diese unbedingt, wenn angegeben):
- Vorgeschriebene Weltgröße: "${sizeStr}"
- Vorgeschriebene Anzahl Kontinente: "${continentsStr}"
- Vorgeschriebenes Klima: "${climateStr}"

Erstelle eine faszinierende, rein physische Geographie der natürlichen Welt. Zeichne noch KEINE Siedlungen, Städte, Reiche, Völker oder Gebäude auf. Erzeuge ausschließlich die natürliche Geographie und spektakuläre Naturphänomene.

Befülle detailreiche und atmosphärische Texte (auf Deutsch) für:
- worldSize: z.B. "Groß (ca. 42.000 km Umfang, reich an unerforschten Regionen)"
- continentsCount: Die genaue Anzahl (z.B. 3)
- oceans: Spektakuläre Ozeane, Meere, Meeresströmungen oder Trennmedien
- islands: Bedeutende Inselketten, Archipelagen oder schwebende Felsgruppen
- mountains: Mächtige Gebirgsketten, tektonische Verwerfungen oder Canyons
- rivers: Gewaltige Ströme, gewundene Flussläufe oder magische Wasserfälle
- lakes: Binnenseen, mystische Kraterseen oder unterirdische Gewässer
- coasts: Spezifische Küstenformen (Steilküsten, goldene Sandstrände, Fjorde, Schlammwatten)
- forests: Uralte Wälder, Dschungelgebiete, Flüsterwälder oder Pilzwälder
- swamps: Neblige Moore, moddrige Marschen oder giftige Sumpfbecken
- deserts: Unbarmherzige Sandwüsten, Salzpfannen, rote Felswüsten oder Aschewüsten
- tundra: Ewiges Eis, karge Frostöden, Taiga oder Permafrostflächen
- volcanoes: Aktive Vulkangebiete, Lavaseen, thermische Quellen oder tektonische Schlote
- climateZones: Die globalen Klimazonen und biologischen Großräume (Biome)

Zusätzlich musst du ca. 10-15 konkrete physische Gelände-Punkte ("terrains") auf der 100x100-Weltkarte platzieren.
Ordne jedem dieser Gelände-Punkte Koordinaten (x: 10 bis 90, y: 15 bis 85) und einen Namen zu. Verteile sie weiträumig über die Karte, damit die visuelle Repräsentation atemberaubend und ausgewogen aussieht.
Jedes Terrain-Objekt in der Liste MUSS folgenden Aufbau haben:
- type: Einer der folgenden Werte: "Gebirge", "Wald", "Fluss", "See", "Sumpf", "Wüste", "Tundra", "Vulkan", "Küste", "Inselgruppe", "Ozean"
- name: Ein klangvoller, poetischer Name für das Geländemerkmal (z.B. "Die Nebelzähne", "Silberfluss", "Frostweide")
- description: Eine packende, 1-2 Sätze lange physische Beschreibung der Natur
- x: Koordinate auf der Karte (10 bis 90)
- y: Koordinate auf der Karte (15 bis 85)

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              physicalGeography: {
                type: Type.OBJECT,
                properties: {
                  worldSize: { type: Type.STRING },
                  continentsCount: { type: Type.INTEGER },
                  oceans: { type: Type.STRING },
                  islands: { type: Type.STRING },
                  mountains: { type: Type.STRING },
                  rivers: { type: Type.STRING },
                  lakes: { type: Type.STRING },
                  coasts: { type: Type.STRING },
                  forests: { type: Type.STRING },
                  swamps: { type: Type.STRING },
                  deserts: { type: Type.STRING },
                  tundra: { type: Type.STRING },
                  volcanoes: { type: Type.STRING },
                  climateZones: { type: Type.STRING }
                },
                required: [
                  "worldSize", "continentsCount", "oceans", "islands", "mountains", 
                  "rivers", "lakes", "coasts", "forests", "swamps", "deserts", 
                  "tundra", "volcanoes", "climateZones"
                ]
              },
              terrains: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER }
                  },
                  required: ["type", "name", "description", "x", "y"]
                }
              }
            },
            required: ["physicalGeography", "terrains"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateCivilization(
    title: string,
    description: string,
    tags: string[],
    physicalGeography: any,
    terrains: any[],
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const geography = physicalGeography || {};
      const terrainList = terrains || [];

      const terrainContext = terrainList.map((t: any) => 
        `- ${t.type} "${t.name}" bei X:${t.x}, Y:${t.y}: ${t.description}`
      ).join('\n');

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Soziologe und Geopolitiker für High-Fantasy, Sci-Fi und anspruchsvolle RPGs.
Deine Aufgabe ist es, eine detaillierte, logische Zivilisations-Struktur für die Welt "${title}" zu entwerfen, basierend auf ihrer physischen Geographie.

Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]

Hier ist die physische Geographie der Welt:
- Größe: ${geography.worldSize || 'Generiert'}
- Kontinente: ${geography.continentsCount || 'Generiert'}
- Ozeane & Strömungen: ${geography.oceans || 'Generiert'}
- Inseln & Archipele: ${geography.islands || 'Generiert'}
- Gebirge & Canyons: ${geography.mountains || 'Generiert'}
- Flüsse & Wasserfälle: ${geography.rivers || 'Generiert'}
- Seen: ${geography.lakes || 'Generiert'}
- Küsten & Strände: ${geography.coasts || 'Generiert'}
- Wälder: ${geography.forests || 'Generiert'}
- Sümpfe: ${geography.swamps || 'Generiert'}
- Wüsten: ${geography.deserts || 'Generiert'}
- Tundra & Eis: ${geography.tundra || 'Generiert'}
- Vulkane: ${geography.volcanoes || 'Generiert'}
- Klimazonen: ${geography.climateZones || 'Generiert'}

Die Karte enthält bereits folgende natürliche Gegebenheiten (terrains):
${terrainContext || 'Keine spezifischen Terrains hinterlegt.'}

Analysiere diese physische Geographie gründlich! Platziere darauf logisch Kulturen und Zivilisationen:
- Länder (Nationen): Wo haben sich Staaten gebildet? Wie nutzen sie Ressourcen?
- Königreiche: Große Herrschaftsgebiete, Feudalstrukturen.
- Fraktionen: Gilden, Piratenbünde, Magierorden oder Rebellengruppen.
- Grenzen: Natürliche Barrieren wie Flüsse oder Gebirge, die Länder trennen.
- Handelswege: Über Land (Pässe, Flusstäler) oder Meere, die Ressourcenzentren verbinden.
- Häfen: Logische Platzierung an Flussmündungen oder geschützten Buchten (Inselgruppen/Küsten).
- Hauptstädte: Machtzentren an strategisch günstigen Punkten (z.B. fruchtbare Flusslandschaften, Flusskreuzungen).
- Dörfer: Kleinere Siedlungen an Rohstoffquellen (Wälder, Minen an Gebirgen).

Gib detailreiche und atmosphärische Texte (auf Deutsch) für folgende Felder zurück:
- countries: Die Länder/Nationen dieser Welt und ihre geopolitische Verteilung.
- kingdoms: Die großen Königreiche, Imperien oder Herrschaftsgebiete und deren Thronfolger oder Kultur.
- factions: Einflussreiche Fraktionen, Orden, Syndikate oder Gilden, die länderübergreifend agieren.
- borders: Die Beschreibung der Landesgrenzen. Erkläre, welche natürlichen Barrieren (z.B. Gebirge, Flüsse) als Grenzen fungieren.
- tradeRoutes: Die wichtigsten Handelsstraßen, Karawanenwege, See-Handelsrouten oder magischen Transit-Korridore.
- ports: Die großen Hafenstädte und Umschlagplätze der Welt an Meeren oder großen Flüssen.
- capitals: Die schillernden Hauptstädte, herrschaftlichen Sitze oder Metropolen der Reiche.
- villages: Bedeutende Dörfer, Grenzorte, ländliche Siedlungen oder Abbau-Kolonien.
- civilizationAnalysis: Eine kurze geopolitische Analyse, warum diese Kulturen genau dort entstanden sind (z.B. "Die Hauptstadt X liegt an der Mündung des Flusses Y, da dies den einzigen Zugang zum Ozean für das Binnenkönigreich Z darstellt...").

Erzeuge außerdem ca. 8-12 konkrete Zivilisations-Punkte (civilizationMarkers) auf der 100x100-Karte. Platziere sie logisch:
- Hauptstädte (Typ: "Hauptstadt") sollten an strategisch vorteilhaften Orten liegen.
- Häfen (Typ: "Hafen") an Küsten, Inselgruppen oder schiffbaren Flüssen.
- Dörfer (Typ: "Dorf") in der Nähe von Wäldern, Seen oder Bergen (Ressourcenquellen).
- Grenzposten (Typ: "Grenzposten") an Bergen, Pässen oder Flussübergängen.
- Handelsstützpunkte (Typ: "Handelsstützpunkt") entlang von gedachten Verbindungslinien.

Für jeden Marker:
- type: Einer der Werte: "Hauptstadt", "Hafen", "Dorf", "Grenzposten", "Handelsstützpunkt"
- name: Klangvoller, thematisch passender Name (auf Deutsch)
- description: Warum diese Siedlung oder dieser Posten an dieser exakten Stelle existiert, unter Einbeziehung der umgebenden Geographie.
- x: Koordinate (10 bis 90)
- y: Koordinate (15 bis 85)
- associatedFaction: Der Name des Landes oder der Fraktion, zu dem dieser Punkt gehört.

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              civilization: {
                type: Type.OBJECT,
                properties: {
                  countries: { type: Type.STRING },
                  kingdoms: { type: Type.STRING },
                  factions: { type: Type.STRING },
                  borders: { type: Type.STRING },
                  tradeRoutes: { type: Type.STRING },
                  ports: { type: Type.STRING },
                  capitals: { type: Type.STRING },
                  villages: { type: Type.STRING },
                  civilizationAnalysis: { type: Type.STRING }
                },
                required: [
                  "countries", "kingdoms", "factions", "borders", 
                  "tradeRoutes", "ports", "capitals", "villages", "civilizationAnalysis"
                ]
              },
              civilizationMarkers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    associatedFaction: { type: Type.STRING }
                  },
                  required: ["type", "name", "description", "x", "y", "associatedFaction"]
                }
              }
            },
            required: ["civilization", "civilizationMarkers"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateRegions(
    title: string,
    description: string,
    tags: string[],
    physicalGeography: any,
    terrains: any[],
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const geography = physicalGeography || {};
      const terrainList = terrains || [];

      const terrainContext = terrainList.map((t: any) => 
        `- ${t.type} "${t.name}" bei X:${t.x}, Y:${t.y}: ${t.description}`
      ).join('\n');

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Abenteuer-Designer und Geograf für High-Fantasy, Sci-Fi und anspruchsvolle RPGs.
Deine Aufgabe ist es, detaillierte, geheimnisvolle und atmosphärische Regionen und POIs (Points of Interest) für die Welt "${title}" zu entwerfen, basierend auf ihrer physischen Geographie.

Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]

Hier ist die physische Geographie der Welt:
- Größe: ${geography.worldSize || 'Generiert'}
- Kontinente: ${geography.continentsCount || 'Generiert'}
- Ozeane & Strömungen: ${geography.oceans || 'Generiert'}
- Inseln & Archipele: ${geography.islands || 'Generiert'}
- Gebirge & Canyons: ${geography.mountains || 'Generiert'}
- Flüsse & Wasserfälle: ${geography.rivers || 'Generiert'}
- Seen: ${geography.lakes || 'Generiert'}
- Küsten & Strände: ${geography.coasts || 'Generiert'}
- Wälder: ${geography.forests || 'Generiert'}
- Sümpfe: ${geography.swamps || 'Generiert'}
- Wüsten: ${geography.deserts || 'Generiert'}
- Tundra & Eis: ${geography.tundra || 'Generiert'}
- Vulkane: ${geography.volcanoes || 'Generiert'}
- Klimazonen: ${geography.climateZones || 'Generiert'}

Die Karte enthält bereits folgende natürliche Gegebenheiten (terrains):
${terrainContext || 'Keine spezifischen Terrains hinterlegt.'}

Analysiere diese physische Geographie gründlich und entwickle epische Regionen, geheime Orte und legendäre Wahrzeichen in den folgenden Kategorien:
- Wälder: Uralte, magische, bedrohliche oder dichte Waldgebiete und Dschungel.
- Gebirgspässe: Strategische Pässe, Schluchten, schneebedeckte Übergänge oder finstere Canyons.
- Inselgruppen: Geheimnisvolle Archipele, verborgene Atolle oder stürmische Inseln.
- Ruinen: Reste untergegangener Zivilisationen, verlassene Burgen, zerstörte Städte oder mystische Monolithen.
- Tempel: Heiligtümer vergessener Götter, Kultstätten der Elementarkräfte oder geweihte Kathedralen.
- Dungeons: Finstere Höhlen, verlassene Minen, Katakomben, Labyrinthe oder uralte Krypten.

Gib detailreiche und atmosphärische Texte (auf Deutsch) für folgende Felder zurück:
- forests: Die bedeutendsten Waldgebiete und Dschungel der Welt und deren Mysterien.
- mountainPasses: Die wichtigsten Pässe, Höhenwege oder Schluchten und ihre Gefahren.
- archipelagos: Die legendärsten Inselgruppen, Atolle oder vulkanischen Riffe.
- ruins: Beschreibungen der großen Ruinenfelder und stummen Zeugen vergangener Epochen.
- temples: Die Tempelanlagen, Orakel oder Schreine dieser Welt und deren Kulte.
- dungeons: Die tiefsten Verliese, geheimnisvolle Höhlenkomplexe oder Katakomben.
- regionsAnalysis: Eine zusammenfassende geografische Analyse über die Verteilung von Wildnis und Zivilisations-Rändern (z.B. "Während der Norden von dichten, ungezähmten Wäldern dominiert wird, verbergen sich im zerklüfteten Süd-Gebirge die gefährlichsten Pässe und uralte Tempelruinen...").

Erzeuge außerdem ca. 8-12 konkrete Regionen-Punkte (regionMarkers) auf der 100x100-Karte. Platziere sie logisch:
- Wälder (Typ: "Wald") an Orten, wo dichte Vegetation oder Sumpfgebiete Sinn ergeben.
- Gebirgspässe (Typ: "Gebirgspass") inmitten von Gebirgsketten, Pässen oder Canyons.
- Inselgruppen (Typ: "Inselgruppe") in Ozeanen, Meeren oder nahe den Küsten.
- Ruinen (Typ: "Ruine") oft versteckt in Wäldern, Wüsten, Bergen oder Mooren.
- Tempel (Typ: "Tempel") an exponierten Gipfeln, heiligen Quellen, Oasen oder in Hauptstädten.
- Dungeons (Typ: "Dungeon") unter Bergen, in tiefen Höhlensystemen, Ruinen-Katalomben oder dichten Sümpfen.

Für jeden Marker:
- type: Einer der Werte: "Wald", "Gebirgspass", "Inselgruppe", "Ruine", "Tempel", "Dungeon"
- name: Klangvoller, thematisch passender Name (auf Deutsch)
- description: Was macht diesen Ort so besonders, welche Legenden oder Kreaturen verbergen sich hier, unter Einbeziehung der umgebenden Geographie.
- x: Koordinate (10 bis 90)
- y: Koordinate (15 bis 85)
- hazardLevel: Das Gefahrenniveau dieses Ortes. Einer der Werte: "Sicher", "Niedrig", "Mittel", "Gefährlich", "Tödlich"

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              regions: {
                type: Type.OBJECT,
                properties: {
                  forests: { type: Type.STRING },
                  mountainPasses: { type: Type.STRING },
                  archipelagos: { type: Type.STRING },
                  ruins: { type: Type.STRING },
                  temples: { type: Type.STRING },
                  dungeons: { type: Type.STRING },
                  regionsAnalysis: { type: Type.STRING }
                },
                required: [
                  "forests", "mountainPasses", "archipelagos", "ruins", 
                  "temples", "dungeons", "regionsAnalysis"
                ]
              },
              regionMarkers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    hazardLevel: { type: Type.STRING }
                  },
                  required: ["type", "name", "description", "x", "y", "hazardLevel"]
                }
              }
            },
            required: ["regions", "regionMarkers"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateSubRegionsForTerritory(
    title: string,
    description: string,
    tags: string[],
    territoryName: string,
    territoryType: string,
    territoryDesc: string,
    territoryCoords: { x: number; y: number; radius: number; minX?: number; maxX?: number; minY?: number; maxY?: number },
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const coords = territoryCoords || { x: 50, y: 50, radius: 10 };
      const tx = coords.x || 50;
      const ty = coords.y || 50;
      const r = coords.radius || 10;
      const minX = coords.minX ?? Math.max(0, tx - r);
      const maxX = coords.maxX ?? Math.min(100, tx + r);
      const minY = coords.minY ?? Math.max(0, ty - r);
      const maxY = coords.maxY ?? Math.min(100, ty + r);

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Abenteuer-Designer und Geografie-Experte.
Für die Welt "${title}" ("${description}") im Genre [${tags.join(', ')}] wurde das folgende Übergebiet / Territorium definiert:
- Name des Gebiets: "${territoryName}"
- Typ: "${territoryType}"
- Beschreibung: "${territoryDesc}"

Dieses Territorium befindet sich auf der Weltkarte im Bereich [X: ${minX} bis ${maxX}, Y: ${minY} bis ${maxY}] mit dem Zentrum bei X: ${tx}, Y: ${ty}.

Deine Aufgabe ist es, dieses Übergebiet in genau 3 bis 4 atmosphärische, faszinierende Unterregionen (Regionen, lokale POIs, geheimnisvolle Orte) aufzuteilen.
Jede Unterregion muss geografisch genau in dieses Territorium passen. Ihre X/Y-Koordinaten müssen zwingend innerhalb des Bereichs liegen: X zwischen ${minX} und ${maxX}, Y zwischen ${minY} und ${maxY}, optimalerweise leicht gestreut um das Zentrum herum.

Gib eine JSON-Struktur zurück mit einer Liste von Unterregionen, jede mit:
1. name: Einzigartiger, epischer Name (z.B. "Schattenwerft des Dreiecks", "Yuba Oase").
2. type: Typ der Unterregion (z.B. "Wald", "Gebirgspass", "Inselgruppe", "Ruine", "Tempel", "Dungeon", "Nebelgebiet", "Dünenlandschaft").
3. description: Eine fesselnde Beschreibung über das Aussehen, die Atmosphäre und Geheimnisse dieser Unterregion.
4. x: Eine Ganzzahl für die X-Koordinate, die streng zwischen ${minX} und ${maxX} liegen MUSS.
5. y: Eine Ganzzahl für die Y-Koordinate, die streng zwischen ${minY} und ${maxY} liegen MUSS.
6. hazardLevel: "Gering", "Mittel", "Hoch" oder "Extrem".
7. biome: Das Biom dieser Unterregion (passend zum Übergebiet, z.B. "Sandwüste" für eine Wüste, "Dichter Nebel" für das Floriansche Dreieck).
8. climate: Das Klima (z.B. "Schwül-heiß", "Eiskalt", "Feucht-warm").
9. threats: Typische Gefahren (z.B. Monster, Stürme, Piraten, Giftige Pflanzen).
10. resources: Fundbare Ressourcen oder Schätze (z.B. Goldvorkommen, antike Relikte, seltene Kräuter).

Erstelle für jedes dieser 3-4 Unterregionen spannenden Content, der perfekt zur Lore passt und die Welt tiefgründiger macht.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subRegions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    hazardLevel: { type: Type.STRING },
                    biome: { type: Type.STRING },
                    climate: { type: Type.STRING },
                    threats: { type: Type.STRING },
                    resources: { type: Type.STRING }
                  },
                  required: ["name", "type", "description", "x", "y", "hazardLevel", "biome", "climate", "threats", "resources"]
                }
              }
            },
            required: ["subRegions"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', { subRegions: [] });
    });
  }

  static async generatePlaces(
    title: string,
    description: string,
    tags: string[],
    physicalGeography: any,
    terrains: any[],
    civilization: any,
    regions: any,
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const geography = physicalGeography || {};
      const terrainList = terrains || [];
      const civ = civilization || {};
      const reg = regions || {};

      const terrainContext = terrainList.map((t: any) => 
        `- ${t.type} "${t.name}" bei X:${t.x}, Y:${t.y}: ${t.description}`
      ).join('\n');

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Abenteuer-Designer und Architekt für High-Fantasy, Sci-Fi und anspruchsvolle RPGs.
Deine Aufgabe ist es, detaillierte, lebendige und atmosphärische Orte (Places) und POIs (Points of Interest) für die Welt "${title}" zu entwerfen, basierend auf ihrer Geographie, Zivilisation und Regionen.

Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]

Hier ist die physische Geographie der Welt:
- Wälder: ${geography.forests || 'Generiert'}
- Gebirge: ${geography.mountains || 'Generiert'}
- Klimazonen: ${geography.climateZones || 'Generiert'}

Hier ist die Zivilisation (Zusammenfassung):
- Kultur/Länder: ${civ.countries || 'Generiert'}
- Hauptstädte: ${civ.capitals || 'Generiert'}

Hier ist die Wildnis (Zusammenfassung):
- Wälder: ${reg.forests || 'Generiert'}
- Pässe: ${reg.mountainPasses || 'Generiert'}
- Ruinen: ${reg.ruins || 'Generiert'}

Die Karte enthält bereits folgende natürliche Gegebenheiten (terrains):
${terrainContext || 'Keine spezifischen Terrains hinterlegt.'}

Analysiere diese Gegebenheiten gründlich und entwickle faszinierende, bewohnte oder geschichtsträchtige Orte in den folgenden Kategorien:
- Städte (cities): Bedeutende Handelsmetropolen, befestigte Festungsstädte oder geheimnisvolle Zufluchtsorte.
- Häuser (houses): Markante, geschichtlich oder magisch bedeutsame Einzelhäuser (z. B. Magiertürme, Einsiedlerhütten, verlassene Anwesen).
- Tavernen (taverns): Legendäre Wirtshäuser, Spelunken der Unterwelt oder gemütliche Herbergen an Handelsstraßen.
- Burgen (castles): Trutzige Festungen, herrschaftliche Sitze oder verlassene Wachtürme.
- Minen (mines): Tiefe Erzlagerstätten, verlassene Edelsteinminen, Zwergenschächte oder gefährliche Kristallgrotte.
- Bauernhöfe (farms): Abgelegene Höfe, weitläufige Weingüter, magische Plantagen oder Wehrhöfe im Grenzland.

Gib detailreiche und atmosphärische Texte (auf Deutsch) für folgende Felder zurück:
- cities: Die wichtigsten Städte, ihre Architektur und soziale Struktur.
- houses: Sagenumwobene Häuser, Hütten oder Türme von Schlüsselpersonen.
- taverns: Die bekanntesten Tavernen der Welt, ihre Wirte, Spezialitäten und typischen Gäste.
- castles: Die mächtigsten Festungsanlagen und Burgen und wer sie beherrscht.
- mines: Die ertragreichsten oder gefährlichsten Minen und Grabungsstätten.
- farms: Die prägendsten Bauernhöfe, Weingüter und ländlichen Siedlungen.
- placesAnalysis: Eine zusammenfassende soziokulturelle und architektonische Analyse über das Leben der Bewohner in diesen Orten (z. B. "Während die stolzen Burgen des Hochlands Schutz bieten, schmiegen sich die Wehrbauernhöfe eng an die fruchtbaren Hänge, stets bedroht von den Kreaturen aus den nahen Minenschächten...").

Erzeuge außerdem ca. 8-12 konkrete Orte-Punkte (placeMarkers) auf der 100x100-Karte. Platziere sie logisch:
- Städte (Typ: "Stadt") an wichtigen Handelsrouten, Küsten, Flüssen oder Ebenen.
- Häuser (Typ: "Haus") im Wald, an Klippen, in Gassen oder an Weggabelungen.
- Tavernen (Typ: "Taverne") in Städten, an Straßen oder nahe Grenzübergängen.
- Burgen (Typ: "Burg") auf strategischen Anhöhen, in Pässen oder Herrschaftszentren.
- Minen (Typ: "Mine") in Gebirgen oder felsigen Tälern.
- Bauernhöfe (Typ: "Bauernhof") in weiten Tälern, Ebenen oder Fruchtland.

Für jeden Marker:
- type: Einer der Werte: "Stadt", "Haus", "Taverne", "Burg", "Mine", "Bauernhof"
- name: Klangvoller, thematisch passender Name (auf Deutsch)
- description: Was macht diesen Ort so besonders, wer lebt hier, welche Geheimnisse verbirgt er.
- x: Koordinate (10 bis 90)
- y: Koordinate (15 bis 85)
- associatedFaction: Name einer eventuell herrschenden Fraktion oder Familie (optional)
- inhabitantCount: Ungefähre Einwohnerzahl oder Bewohnerbeschreibung (z.B. "ca. 5.000 Einwohner", "Einsiedler", "Eine Familie von Wehrbauern")

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              places: {
                type: Type.OBJECT,
                properties: {
                  cities: { type: Type.STRING },
                  houses: { type: Type.STRING },
                  taverns: { type: Type.STRING },
                  castles: { type: Type.STRING },
                  mines: { type: Type.STRING },
                  farms: { type: Type.STRING },
                  placesAnalysis: { type: Type.STRING }
                },
                required: [
                  "cities", "houses", "taverns", "castles", 
                  "mines", "farms", "placesAnalysis"
                ]
              },
              placeMarkers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    associatedFaction: { type: Type.STRING },
                    inhabitantCount: { type: Type.STRING }
                  },
                  required: ["type", "name", "description", "x", "y", "inhabitantCount"]
                }
              }
            },
            required: ["places", "placeMarkers"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateWorldNpcs(
    title: string,
    description: string,
    tags: string[],
    civilization: any,
    places: any,
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const civ = civilization || {};
      const plc = places || {};

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Abenteuer-Designer und RPG-Autor für High-Fantasy, Sci-Fi und anspruchsvolle Abenteuer.
Deine Aufgabe ist es, lebendige, interessante Hintergrund-NPCs, Fraktionen, Monster und Armeen für die Welt "${title}" zu entwerfen, basierend auf ihrer Zivilisation und ihren Orten.

Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]

Hier ist die Zivilisation (Zusammenfassung):
- Kultur/Länder: ${civ.countries || 'Generiert'}
- Hauptstädte: ${civ.capitals || 'Generiert'}
- Fraktionen: ${civ.factions || 'Generiert'}

Hier sind die Orte (Zusammenfassung):
- Städte: ${plc.cities || 'Generiert'}
- Burgen: ${plc.castles || 'Generiert'}
- Minen: ${plc.mines || 'Generiert'}

Analysiere diese Gegebenheiten gründlich und entwickle faszinierende Akteure, Wesen und Gruppierungen in den folgenden Kategorien:
- Einwohner (citizens): Beschreibung des typischen Volks, der sozialen Schichten, Gebräuche, Trachten und des Alltags der Bürger.
- Händler (merchants): Die Handelsgilden, reisende Krämer, Schmugglerbanden, exotische Märkte, Handelswaren und bekannte Handelsfürsten.
- Monster (monsters): Die gefährlichsten Bestien, magische Kreaturen, urzeitliche Schrecken oder mutierte Monstrositäten, die die Wildnis und dunkle Orte unsicher machen.
- Fraktionen (factions): Die einflussreichsten Gilden, Geheimbünde, Orden, politischen Parteien oder religiösen Kulte der Welt und ihre Ziele.
- Armeen (armies): Die Streitkräfte der Reiche, Söldnerheere, Stadtwachen, rebellische Streitkräfte oder die Horden der Dunkelheit, ihre Ausrüstung und Kampfweise.

Gib detailreiche und atmosphärische Texte (auf Deutsch) für folgende Felder zurück:
- citizens: Das Alltagsleben, die Stände und Gebräuche der Einwohner.
- merchants: Die Händlerstrukturen, Handelswaren, Handelsgilden und Märkte.
- monsters: Die ansässigen Monster, Bestien und Gefahren der Wildnis.
- factions: Die wichtigsten Faktionen, Allianzen und Geheimbünde.
- armies: Die stehenden Armeen, Söldnerkompanien oder Kriegerclans der Welt.
- npcsAnalysis: Eine zusammenfassende soziopolitische und biologische Analyse über das Kräftemessen und Zusammenleben der Einwohner, Fraktionen, Monster und Armeen in dieser Welt.

Erzeuge außerdem ca. 8-12 konkrete NPC- oder Gruppen-Punkte (worldNpcMarkers) auf der 100x100-Karte. Platziere sie logisch auf der Karte:
- Einwohner (Typ: "Einwohner") in Städten, Dörfern oder Herbergen.
- Händler (Typ: "Händler") an Handelsstraßen, Häfen oder Grenzposten.
- Monster (Typ: "Monster") in dichten Wäldern, dunklen Minen, fernen Bergen oder Ruinen.
- Fraktionen (Typ: "Fraktion") in Machtzentren, Hauptstädten oder versteckten Klöstern.
- Armeen (Typ: "Armee") in Grenzgebieten, Festungen oder auf Marschrouten.

Für jeden Marker:
- type: Einer der Werte: "Einwohner", "Händler", "Monster", "Fraktion", "Armee"
- name: Ein klangvoller, thematisch passender Name (auf Deutsch) für die Gruppe, Person oder Bestie.
- description: Was zeichnet diesen Akteur aus, was tut er hier, welche Gesinnung oder welches Geheimnis hat er.
- x: Koordinate (10 bis 90)
- y: Koordinate (15 bis 85)
- dangerLevel: Gefahrenstufe, z.B. "Sicher", "Friedlich", "Niedrig", "Mittel", "Hoch", "Tödlich"
- sizeOrPower: Angabe zur Größe oder Macht, z.B. "Einzelgänger", "Kleine Gruppe", "Söldnerbande", "Ganze Kohorte", "Legendäres Monstrum"

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              worldNpcs: {
                type: Type.OBJECT,
                properties: {
                  citizens: { type: Type.STRING },
                  merchants: { type: Type.STRING },
                  monsters: { type: Type.STRING },
                  factions: { type: Type.STRING },
                  armies: { type: Type.STRING },
                  npcsAnalysis: { type: Type.STRING }
                },
                required: [
                  "citizens", "merchants", "monsters", "factions", 
                  "armies", "npcsAnalysis"
                ]
              },
              worldNpcMarkers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    dangerLevel: { type: Type.STRING },
                    sizeOrPower: { type: Type.STRING }
                  },
                  required: ["type", "name", "description", "x", "y", "dangerLevel", "sizeOrPower"]
                }
              }
            },
            required: ["worldNpcs", "worldNpcMarkers"]
          },
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async generateWorldStory(
    title: string,
    description: string,
    tags: string[],
    civilization: any,
    places: any,
    npcs: any,
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const civ = civilization || {};
      const plc = places || {};
      const npc = npcs || {};

      const contextPrompt = `Du bist ein genialer Welten-Schöpfer, Abenteuer-Designer und RPG-Autor für High-Fantasy, Sci-Fi und anspruchsvolle Abenteuer.
Deine Aufgabe ist es, mitreißende Abenteuer-Geschichten, dramatische Ereignisse, Hauptstory-Fäden und spannende Nebenquests für die Welt "${title}" zu entwerfen, basierend auf ihrer Zivilisation, ihren Orten und ansässigen Akteuren.

Welt-Beschreibung: "${description}"
Tags/Genres: [${tags.join(', ')}]

Hier ist das soziale und physische Gefüge (Zusammenfassung):
- Kultur/Länder/Fraktionen: ${civ.countries || 'Generiert'} | ${civ.factions || 'Generiert'}
- Orte (Städte/Burgen): ${plc.cities || 'Generiert'} | ${plc.castles || 'Generiert'}
- Einwohner/Monster/Armeen: ${npc.citizens || 'Generiert'} | ${npc.monsters || 'Generiert'} | ${npc.armies || 'Generiert'}

Analysiere diese Gegebenheiten gründlich und entwickle faszinierende Narrative und Quests in den folgenden Kategorien:
- Quests (quests): Allgemeine Quest-Ideen, schwarze Bretter, Belohnungsarten und Questgeberstrukturen.
- Ereignisse (events): Wichtige aktuelle, historische oder drohende Ereignisse, Naturkatastrophen, Feste oder magische Phänomene.
- Hauptstory (mainStory): Der epische rote Faden, der die Welt bedroht, der Hauptkonflikt (z.B. Erwachen eines dunklen Gottes, Kriegsausbruch) und wie die Spieler involviert werden.
- Nebenquests (sideQuests): Mehrere packende optionale Nebenhandlungsstränge, Detektivfälle, persönliche Tragödien oder Erkundungsaufträge.

Gib detailreiche und atmosphärische Texte (auf Deutsch) für folgende Felder zurück:
- quests: Allgemeine Quest-Übersicht und Auftraggeber in dieser Welt.
- events: Aktuelle weltbewegende oder lokale Ereignisse und Vorfälle.
- mainStory: Die epische Hauptstory (Hauptquestfaden) der Welt mit dramatischen Wendepunkten.
- sideQuests: Eine Sammlung abwechslungsreicher Nebenquests und Geheimnisse.
- storyAnalysis: Eine zusammenfassende narrative Analyse über die Hauptkonflikte, Motive, Geheimnisse und das Abenteuerpotenzial der Welt.

Erzeuge außerdem ca. 8-12 konkrete Story- oder Quest-Punkte (worldStoryMarkers) auf der 100x100-Karte. Platziere sie logisch auf der Karte:
- Hauptstory (Typ: "Hauptstory") an zentralen Machtorten, uralten Ruinen oder Schicksalsstätten.
- Ereignisse (Typ: "Ereignis") an Orten aktiver Vorkommnisse (Z.B. Vulkanausbruch, Belagerung, magisches Portal).
- Quests (Typ: "Quest") an Anschlagbrettern, Tavernen oder Gilden.
- Nebenquests (Typ: "Nebenquest") an abgelegenen Orten, einsamen Hütten oder Fundorten geheimnisvoller Artefakte.

Für jeden Marker:
- type: Einer der Werte: "Quest", "Ereignis", "Hauptstory", "Nebenquest"
- name: Ein klangvoller, thematisch passender Name (auf Deutsch) für das Ereignis oder die Quest.
- description: Um was geht es bei dieser Storyline, wer ist involviert, was muss getan werden, was ist der Plottwist.
- x: Koordinate (10 bis 90)
- y: Koordinate (15 bis 85)
- difficulty: Schwierigkeitsgrad, z.B. "Einfach", "Mittel", "Schwer", "Heroisch", "Tödlich"
- rewards: Angabe zur Belohnung, z.B. "Uraltes Amulett & 500 Taler", "Dank des Barons", "Geheimes Wissen über die Drachen"

Gib die Antwort im exakten JSON-Format gemäß des vorgegebenen Schemas zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              worldStory: {
                type: Type.OBJECT,
                properties: {
                  quests: { type: Type.STRING },
                  events: { type: Type.STRING },
                  mainStory: { type: Type.STRING },
                  sideQuests: { type: Type.STRING },
                  storyAnalysis: { type: Type.STRING }
                },
                required: ["quests", "events", "mainStory", "sideQuests", "storyAnalysis"]
              },
              worldStoryMarkers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    difficulty: { type: Type.STRING },
                    rewards: { type: Type.STRING }
                  },
                  required: ["type", "name", "description", "x", "y", "difficulty", "rewards"]
                }
              }
            },
            required: ["worldStory", "worldStoryMarkers"]
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

${CHARACTER_BIO_7_QUESTIONS_PROMPT}

### RASSEMERKMALE / KÖRPERLICHE ABWEICHUNGEN (MANDATORISCH BEI FANTASY-RASSEN):
Achte extrem genau auf alle körperlichen Merkmale und Rasse-Eigenschaften, die nicht der menschlichen Norm entsprechen (z.B. Katzenohren, Schweif/Schwanz, Krallen, geschlitzte Augen, Fell, Fellfarbe oder Fellmuster am ganzen Körper oder an bestimmten Stellen, Tierkopf, tierisches Gesicht/Nase, Flügel, Hörner, Schuppen etc.).
- Trage all diese Merkmale zwingend detailgetreu und anschaulich in das Feld 'raceFeatures' (unter 'appearance') ein!
- Wenn der Charakter ein normaler Mensch ohne fantastische, tierische oder unnormale physische Eigenschaften ist, trage 'keine' ein.

### CODEX-ZEITLINIE & VERBOT VON GEGENWARTS-WISSEN (STRENGSTE DIRECTIVE):
- Alles in der Bio, der Situation (currentSituation), den Beziehungen und besonders den 3-Stufen-Geheimnissen (secretsStage1, secretsStage2, secretsStage3) dieses Codex-Charakters repräsentiert ausschließlich die HISTORISCHE VERGANGENHEIT (die Vorgeschichte vor Beginn des aktuellen Spiels).
- Der Charakter darf absolut KEINERLEI Wissen oder Vermutungen über die aktuelle, gegenwärtige Situation des Nutzers/Spielers besitzen, darf ihn in der Regel noch nicht getroffen haben (außer es gibt eine explizite gemeinsame Familien- oder Vorgeschichte) und darf unmöglich über seine gegenwärtigen Aktivitäten, Pläne oder Quests Bescheid wissen! Alle Angaben müssen sich rein auf seinen eigenen Alltag und seine eigene Vorgeschichte beziehen.

### STRENGSTES GEHEIMNIS- & SPOILERVERBOT (SPIELER- & NPC-GEHEIMNISSE):
- Beziehe dich unter KEINEN Umständen in der Biografie (bio), der aktuellen Situation (currentSituation), den Fähigkeiten, Beziehungen ODER den Stufen-Geheimnissen (secretsStage1, secretsStage2, secretsStage3) dieses Charakters auf Geheimnisse, verborgenes Wissen oder "Stufe 3"-Geheimnisse des Spielers/Nutzers (das Geheimnis des Nutzers/Spielers) oder anderer Charaktere/Orte!
- Das Geheimnis des Spielers/Nutzers ist für diesen Charakter eine absolute, unantastbare Blackbox. Niemand darf in seiner Biografie oder seinen Geheimnissen bereits wissen oder vermuten, was das Geheimnis des Spielers ist!
- Wenn in der Welten-Beschreibung, in bestehenden Codex-Einträgen oder im "Enthülltes / Verborgenes Wissen" (revealedKnowledge) geheimes Wissen definiert ist, gilt dies als absolute Blackbox.
- Dieses geheime Wissen darf NIEMALS unaufgefordert in der Biografie, der aktuellen Situation, den Geheimnissen (insb. Stufe 1 und Stufe 2) oder in anderen Textfeldern dieses Charakters erwähnt, angedeutet, referenziert oder gespoilert werden! Die Biografie, die normalen Beschreibungen und die Stufe-1 & Stufe-2 Geheimnisse müssen vollkommen frei von diesen zukunftsgerichteten Kampagnen-Geheimnissen bleiben.

### 3-STUFEN-LOGIK DER GEHEIMNISSE (STRENGSTE DIRECTIVE & HARMONIE MIT CHARAKTER-MOTIVATION):
- CHARAKTER-MOTIVATION & TONS-KONGRUENT (ABSOLUT PFLICHT): Die 3-Stufen-Geheimnisse (secretsStage1, secretsStage2, secretsStage3) MÜSSEN zwingend mit dem Hauptziel ('goal'), der Gesinnung/Persönlichkeit ('personality'), der Rolle und den Grundwerten des Charakters bzw. Eintrags im Einklang stehen!
- ABSOLUTES VERBOT VON UNANGEPASSTEN BÖSEN/DUNKELN KLISCHEES: Wandle beschützende, edle, hilfsbereite, loyale oder neutrale Figuren/Orte NIEMALS eigenmächtig in böse Schurken, Opfersulte, Gehirnwäscher, finstere Alchemisten oder Menschenausbeuter um, nur um ein "Geheimnis" zu erzeugen!
- Wenn die Motivation eines Charakters zum Beispiel lautet "ihre Mädchen vor Gefahren schützen", MÜSSEN die Geheimnisse genau dieses Schutzmotiv aufgreifen und vertiefen (z. B. Stufe 1: Gerüchte von Neidern/Außenstehenden über strenge Schutzregeln oder Geheimhaltung; Stufe 2: Indizien auf geheime Fluchttunnel, getarnte Schutzsiegel oder verdeckte Wachen; Stufe 3: Ein wohlgehüter geheimer Schutzbund, verdecktes Asyl für Geflohene oder persönliche Opfer der Anführerin für das Wohl der Mädchen – anstatt Gehirnwäsche oder Ausbeutung!). Nur wenn eine Figur explizit ein Schurke ist, sind finstere Geheimnisse passend.
- Stufe 1: Öffentliches Wissen (secretsStage1) und Stufe 2: Indizien & Verdacht (secretsStage2) dürfen sich NIEMALS auf Dinge beziehen, die gerade erst in der Geschichte / der aktiven Kampagne angefangen haben! Es kann nicht sein, dass NPCs oder die Welt bereits jetzt etwas wissen oder Verdacht haben über Dinge, die erst im Spielverlauf passieren.
- Stufe 1 und Stufe 2 müssen sich ausschließlich auf Gerüchte, Halbwahrheiten oder Verdachtsmomente beziehen, die bereits VOR Beginn der Story (in der historischen Vorgeschichte) in der Welt existierten.
- Schreibe niemals "Der Spieler vermutet..." oder "Der Nutzer weiß...", da die Geheimnisse dieses Charakters unabhängig vom Wissen des Spielers formuliert sein müssen und die KI diese im Chat erst enthüllt!

### WICHTIG FÜR BEKANNTE FRANCHISE-CHARAKTERE (z.B. One Piece, Naruto, Dragon Ball, etc.):
Falls es sich bei der Person um einen bekannten fiktiven/Franchise-Charakter handelt (z.B. Sakazuki/Akainu, Monkey D. Garp, Monkey D. Ruffy, Dracule Mihawk, Nami, Nico Robin, Boa Hancock, Son Goku, Naruto Uzumaki, Sasuke Uchiha, etc.), MUSST du zwingend seine echten, offiziellen, kanonischen Original-Eigenschaften und kanonischen Beziehungsstrukturen verwenden!
- NAME VS SPITZNAME/ALIAS: Trage als eigentlichen Namen ('name' oder 'title') UNBEDINGT den bürgerlichen, echten Namen des Charakters ein (z.B. 'Sakazuki' statt 'Akainu', 'Kuzan' statt 'Aokiji', 'Borsalino' statt 'Kizaru', 'Dracule Mihawk' statt 'Falkenauge'). Trage den Codename/Spitzname (z.B. 'Akainu', 'Aokiji', 'Kizaru', 'Falkenauge') ausschließlich im Feld 'nickname' ein! Der 'rufName' is der am häufigsten verwendete Name (z.B. 'Akainu' bei Sakazuki, 'Mihawk' bei Dracule Mihawk). Bring das niemals durcheinander!
- GRÖSSE (height): Trage zwingend die exakte offizielle kanonische Größe ein (z.B. Sakazuki/Akainu ist '306 cm', Monkey D. Garp ist '287 cm', Dracule Mihawk ist '198 cm', Son Goku ist '175 cm', Whitebeard ist '666 cm', Kaido ist '710 cm', Big Mom ist '880 cm', Nico Robin ist '188 cm'). Erfinde oder schätze keine Standardgrößen wie 178 cm für diese Riesen!
- KÖRPERMASSE (measurements): Verwende zwingend die offiziellen Maße (z.B. Nami ist '98-58-88', Boa Hancock is '111-61-91', Nico Robin ist '100-60-90'). Bei männlichen Charakteren setze die korrekten, muskulösen Werte (z.B. bei einem riesigen Hünen wie Sakazuki/Akainu oder Garp setze muskulöse Proportionen wie '160-110-120', verwende auf keinen Fall schmale Normalwerte!).
- KÖRBCHENGRÖSSE (cupSize): Verwende die offizielle kanonische Körbchengröße (z.B. Nami ist 'J-Cup' oder 'J', Boa Hancock ist 'J-Cup' oder 'J', Nico Robin ist 'I-Cup' oder 'I'). Bei männlichen Charakteren setze '-'.
- ALTER (age), RASSE (race), Haare/Augen, Persönlichkeit & Bio: Alles muss präzise auf den echten kanonischen Stand gebracht werden!
- STRUKTURIERTE BEZIEHUNGEN & RÄNGE (relationships): Achte peinlichst genau darauf, wer wem weisungsbefugt oder überlegen ist! Garp ist ein Vizeadmiral (Vice Admiral) und Sakazuki (Akainu) als Admiral bzw. Großadmiral (Fleet Admiral) im Rang UNTERGEBEN. Garp ist also ein respektierter Kollege oder Untergebener, NIEMALS ein Vorgesetzter von Sakazuki! Mihawk ist ein Pirat und Shichibukai (Samurai der Meere) und steht absolut außerhalb der Marine-Hierarchie, er ist auf keinen Fall ein Vorgesetzter von Sakazuki oder der Marine! Überprüfe deine gesamte Wissensdatenbank zu dem jeweiligen Franchise, um extrem authentische, kanonisch korrekte Beziehungen zu erzeugen!

Erfinde spannende Fähigkeiten & Kräfte (skills), Herkunft der Kraft (powerSource) und Kosten/Limitierung (powerCost).
Achte penibel darauf, Fähigkeiten & Kräfte (skills) und Kosten/Verbrauch sowie Kraftquelle stimmig an das Setting anzupassen. Falls bereits passende Fähigkeiten existieren, ERWEITERE und ergänze diese, anstatt neue, redundante hinzuzufügen. Es reicht völlig, eine Kraft/Fähigkeit nur einmal hinzuzufügen und auszubauen, anstatt mehrere Kopien zu erstellen.

### AUSSEHEN (MANDATORISCH):
Befülle im 'appearance'-Objekt das Feld 'looks' detailliert mit dem Gesichtsaussehen, Haarstil und besonderen Merkmalen im untransformierten Zustand. Grenzer dies sauber von 'outfit' (Kleidung) und 'raceFeatures' (nicht-menschliche physische Rassemerkmale) ab!

### ABILITIES, TECHNIKEN & TRANSFORMATIONEN (MANDATORISCHE KATEGORISIERUNG & VOLLSTÄNDIGKEIT):
Befülle zwingend die 'abilities'-Liste mit ALLEN Kräften, Fähigkeiten, Standardfähigkeiten, passiven Eigenschaften, Kampftechniken, Barrieren und Verwandlungen des Charakters. ES DARF ABSOLUT NICHTS WEGGELASSEN WERDEN!

WICHTIGSTE DIRECTIVE FÜR DIE ERSTELLUNG:
- JEDE EINZELNE genannte oder ableitbare Kraft, Kampftechnik, Barriere, Fähigkeit oder Gestalt (z.B. "Elementarmanipulation", "Heilende Berührung", "Begrenzte Telekinese", "Empathie", "Schutzbarrieren", "Vollständige Elementarkontrolle", "Dimensionsrisse", "Levitation", "Absorption", "Unterdrückung", "Gewaltige Energieexplosionen", "Vollständige körperliche Wiederherstellung", "Reine Esper-Form") MUSS ALS EIGENSTÄNDIGER EINTRAG im Array 'abilities' mit der jeweils passenden Kategorie existieren!
- STRENGES VERBOT: Fasse die Kampftechniken NICHT nur als Text in einem einzigen Sammelblock oder nur innerhalb einer Transformation zusammen. Wenn 8 Techniken genannt werden, MÜSSEN 8 separate Einträge im 'abilities'-Array mit ihren eigenen Namen, Beschreibungen und Kosten erstellt werden!

KATEGORIE-ZUORDNUNG FÜR JEDEN EINTRAG IM 'abilities'-ARRAY ('category'):
1. 'Passive Fähigkeiten': Für passive Eigenschaften, dauerhafte Wahrnehmung, Empathie, Sinneswahrnehmung, Immunitäten oder Regeneration (z.B. "Empathie", "Vollständige körperliche Wiederherstellung").
2. 'Techniken': Für aktive Grundkräfte, Fertigkeiten, Zauber, Barrieren, Heilung, Telekinese, Elementarmanipulation, Levitation, Absorption, Unterdrückung.
3. 'Ultimative Techniken': Für mächtige Finisher, verheerende Großangriffe oder Extremkräfte (z.B. "Gewaltige Energieexplosionen", "Dimensionsrisse", "Vollständige Elementarkontrolle").
4. 'Transformationen': Für echte Verwandlungen, Metamorphosen, Formen oder Erschöpfungszustände (z.B. "Reine Esper-Form").
5. 'Talente': Für spezielle Begabungen, Esper-Fokus, Meditation.

BEI TRANSFORMATIONEN (FORMEN & GESTALTWECHSEL):
Falls ein Charakter die Fähigkeit besitzt, sich zu verwandeln, seine Gestalt zu ändern oder der Text Verwandlungen/Formen beschreibt (z.B. "Reine Esper-Form", "Kinder-Form" bei Erschöpfung):
1. WAS ER DAVOR WAR (Ursprünglicher Zustand):
   - Die Bio ('bio') und das untransformierte 'appearance'-Objekt ('race', 'looks', 'build', 'hairColor', 'eyeColor', etc.) MÜSSEN seinen Zustand VOR der Verwandlung beschreiben.
2. WELCHE BEZIEHUNGEN ER MIT WEM HATTE:
   - In den Beziehungs-Feldern beschreiben, welche Beziehungen vor und nach Verwandlungen bestehen.
3. DIE TRANSFORMATIONEN / FORMEN:
   - Erstelle für JEDE erwähnte Gestalt oder Form (z.B. die "Reine Esper-Form" UND auch den Erschöpfungszustand "Kinder-Form") einen EIGENEN Eintrag in 'abilities' mit 'category: "Transformationen"'.
   - Befülle alle Transformations-Felder extrem detailreich ('transformName', 'transformRole', 'transformLooks', 'transformOutfit', 'transformRace', 'transformRaceFeatures', 'transformHairColor', 'transformEyeColor', 'transformAge', 'transformHeight', 'transformBuild', 'activationCondition')!
   - WICHTIG ZUR KLEIDUNG BEI TRANSFORMATIONEN: Falls der Freitext angibt, dass Kleidung verschwindet/sie nackt ist und nach der Rückverwandlung wieder auftaucht (wie bei manchen magischen Transformationen/Quirks), oder dass Kleidung die normale Größe behält (z.B. bei einer Kinderform schlottert/zu groß ist), beschreibe dieses Verhalten EXAKT so im Feld 'transformOutfit'! Falls nichts Spezifisches erwähnt wird, passt sich die Kleidung elastisch an.
   - ERSTELLE TECHNIKEN DER FORM: Jede Transformation MUSS unter 'techniqueList' Techniken zur Aktivierung (Typ 'Transformation'), die spezifischen Spezialkräfte während der Form und eine Zurückverwandlungs-Technik besitzen!
   - Trage in 'currentSituation' ein, wie der Charakter heute mit dieser Verwandlung lebt.

Befülle zudem für jede Ability und für den Charakter das Feld 'techniqueList' mit konkreten Techniken/Attacken und 'techniques' mit kommagetrennten Namen!`;

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

WICHTIGSTE ZUSAMMENFÜHRUNGS-REGELN (GEGEN DUPLIKATE & AN DIE WELT ANGEPASST):
1. ABSOLUTES VERBOT VON DOPPELTEN ABSÄTZEN IN DER BIO: Lies die bestehende "Bio" (Biografie) sorgfältig durch. Füge auf KEINEN Fall denselben Text, dieselbe Formulierung oder bereits genannte Sätze (auch nicht leicht abgewandelt als "[Zusatz]: ...") noch einmal hinzu! Wenn die Information bereits vorhanden ist, darf sie NICHT erneut angehängt werden. Ergänze NUR wirklich neue, zusätzliche Details und verschmilz sie elegant zu einem einzigen, flüssigen Text ohne Redundanzen.
2. KEINE DUPLIZIERTEN FÄHIGKEITEN/KRÄFTE: Erstelle keine doppelten oder redundant benannten Fähigkeiten wie "Kraft / Fähigkeit #1", "Kraft / Fähigkeit #2", "Kraft / Fähigkeit #3" mit identischem oder ähnlichem Inhalt. Wenn bereits eine Fähigkeit oder Technik existiert, erweitere/ergänze sie lieber direkt in ihrem bestehenden Eintrag, anstatt eine weitere identische Fähigkeit hinzuzufügen, es sei denn, sie besitzt eine völlig andere Kraftquelle (powerSource). Es reicht vollkommen, eine Fähigkeit nur einmal aufzuführen und sie auszubauen.
3. STRENGE BALANCIERUNG VON MACHT & WERTEN: Leite die Macht-Werte (campaignPowerLevels) und Stärken absolut streng passend zur Welten-Beschreibung, zum Ton/Genre und zum genauen Zeitpunkt/Ära her! Gib keine willkürlichen Höchstwerte an, sondern passe sie exakt an das Niveau des Charakters zu diesem Zeitpunkt an.

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
- Aussehen: Rasse "${existingCharacter.appearance?.race || ''}", Alter "${existingCharacter.appearance?.age || ''}", Gender "${existingCharacter.appearance?.gender || ''}", Statur "${existingCharacter.appearance?.build || ''}", Haare "${existingCharacter.appearance?.hairColor || ''}", Augen "${existingCharacter.appearance?.eyeColor || ''}", Kleidung "${existingCharacter.appearance?.outfit || ''}", Gesichtsaussehen/Haarstil "${existingCharacter.appearance?.looks || ''}"
- Bestehende Fähigkeiten/Transformationen: ${JSON.stringify(existingCharacter.abilities || [])}`;
      }

      if (powerSettings && Object.keys(powerSettings).length > 0) {
        contextPrompt += `\n\nBefülle ebenfalls ALLE folgenden Macht-Attribute (campaignPowerLevels) mit passenden, realistischen Werten (value und potentialMax) für diesen Charakter:`;
        Object.entries(powerSettings).forEach(([key, val]: [string, any]) => {
          const minVal = val?.scaleMin ?? 0;
          const maxVal = val?.scaleMax ?? 100;
          contextPrompt += `\n- Attribut "${key}": Wert zwischen ${minVal} und ${maxVal}, und maximales Potenzial ebenfalls zwischen ${minVal} und ${maxVal}.`;
        });
      }

      if (worldContext) {
        const worldLocations = this.extractWorldLocations(worldContext, (worldContext.loreDatabase || []));
        if (worldLocations.length > 0) {
          contextPrompt += `\n\n### BEKANNTE SCHAUPLÄTZE & ORTE DER WELT (FÜR ORTSKONSISTENZ):
${worldLocations.slice(0, 15).map(loc => `- ${loc}`).join('\n')}
WICHTIG: Richte alle Ortsangaben, Treffpunkte und Herkunftsorte an diesen Schauplätzen aus!`;
        }
      }

      if (existingCodexCharacters && existingCodexCharacters.length > 0) {
        contextPrompt += `\n\n### BEREITS EXISTIERENDE CHARAKTERE IM CODEX / NPCs (WICHTIG FÜR BEZIEHUNGEN & VERGANGENHEIT):
Es gibt bereits registrierte Charaktere/NPCs in dieser Welt. Analysiere diese sorgfältig!

### ZWINGENDE ALTERS- & ZEITLINIEN-LOGIK FÜR BEZIEHUNGEN (STRENGSTE DIRECTIVE):
- Beachte das Alter der beteiligten Charaktere!
- GROSSER ALTERSUNTERSCHIED (z. B. 17 Jahre vs. 35 Jahre = 18 Jahre Differenz):
  * Eine "Gemeinsame Kindheit" (z. B. "Gemeinsame Kindheit in der Wüste", "zusammen als Kinder aufgewachsen", "Sandkastenfreunde") ist bei großem Altersunterschied BIOLOGISCH UNMÖGLICH und STRENGSTENS VERBOTEN!
  * Als der jüngere Charakter ein Kind (z. B. 5 Jahre) war, war der ältere bereits erwachsen (z. B. 23 Jahre).
  * Solche Beziehungen dürfen NUR als Mentor/Schüler, älterer Beschützer, Lehrmeister, Aufpasser oder als spätere Begegnung im Leben formuliert werden — NIEMALS als Kindheitsfreunde!
  * Nur bei annähernd gleichem Alter (Differenz 0 bis max. 4 Jahre) ist eine echte gemeinsame Kindheit oder Jugend plausibel.

### ZWINGENDE ORTS- & SCHAUPLATZ-KONSISTENZ:
- Achte peinlichst genau auf etablierte Treffpunkte und Herkunftsorte!
- Wenn im Kontext oder im Freitext bereits ein Treffpunkt oder Ort etabliert ist (z. B. erstes Treffen in einer Taverne, Herkunft aus einer bestimmten Hafenstadt), muss das erste Kennenlernen in 'relationships', 'sharedPast' und 'bio' genau an DIESEM Ort stattfinden.
- Erfinde NIEMALS unpassende, widersprüchliche Orte (wie "in den Sanddünen der Wüste"), wenn dieser Ort nicht zur etablierten Biografie oder Weltgeografie passt!

Hier sind die bestehenden Charaktere:
${existingCodexCharacters.map(c => `- Name: "${c.name}"
  * Alter: "${c.age || 'Unbekannt'}"
  * Herkunft / Standort: "${c.origin || c.location || 'Unbekannt'}"
  * RPG-Rolle: "${c.role || 'Unbekannt'}"
  * Familie/Zugehörigkeit: "${c.family || 'Keine'}"
  * Beziehung/Verhalten/Details: "${c.relation || c.description || 'Keine Angabe'}"`).join('\n')}`;
      }

      contextPrompt += `\n\nText: "${text}"\n`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
      return this.sanitizeAndRepairTransformations(data);
    });
  }

  private static extractCharacterInfo(charName: string, allLoreEntries?: any[], worldContext?: any) {
    if (!charName) return null;
    const normalizedName = charName.toLowerCase().trim();

    let details: any = {};
    let found = false;

    if (allLoreEntries && Array.isArray(allLoreEntries)) {
      const entry = allLoreEntries.find(e => {
        const t = (e.title || e.name || '').toLowerCase().trim();
        return t === normalizedName || (t && normalizedName.includes(t)) || (t && t.includes(normalizedName));
      });

      if (entry) {
        found = true;
        const d = entry.details || {};
        const app = d.appearance || {};
        details = {
          name: entry.title || entry.name || charName,
          role: d.role || '',
          age: d.age || app.age || d.ageYears || '',
          gender: d.gender || app.gender || '',
          origin: d.origin || app.origin || d.birthplace || '',
          location: d.currentSituation || d.location || app.location || '',
          personality: d.personality || '',
          bio: entry.description || d.bio || '',
          faction: d.faction || app.faction || '',
          family: d.family || app.family || '',
          race: d.race || app.race || '',
          relationships: d.relationships || []
        };
      }
    }

    const playerObj = worldContext?.player || worldContext?.character;
    if (playerObj) {
      const pName = (playerObj.name || '').toLowerCase().trim();
      if (pName === normalizedName || normalizedName === 'spieler' || normalizedName === 'nutzer' || normalizedName.includes('spieler') || (pName && normalizedName.includes(pName))) {
        found = true;
        const app = playerObj.appearance || {};
        details = {
          name: playerObj.name || charName,
          role: playerObj.role || playerObj.archetype || details.role || 'Hauptcharakter / Spieler',
          age: playerObj.age || app.age || details.age || '',
          gender: playerObj.gender || app.gender || details.gender || '',
          origin: playerObj.origin || app.origin || details.origin || '',
          location: playerObj.currentSituation || playerObj.location || details.location || '',
          personality: playerObj.personality || details.personality || '',
          bio: playerObj.bio || playerObj.description || details.bio || '',
          faction: playerObj.faction || app.faction || details.faction || '',
          family: playerObj.family || app.family || details.family || '',
          race: playerObj.race || app.race || details.race || '',
          relationships: playerObj.relationships || details.relationships || []
        };
      }
    }

    if (!found && worldContext?.codex && Array.isArray(worldContext.codex)) {
      const entry = worldContext.codex.find((e: any) => {
        const t = (e.title || e.name || '').toLowerCase().trim();
        return t === normalizedName || (t && normalizedName.includes(t));
      });
      if (entry) {
        found = true;
        const d = entry.details || {};
        const app = d.appearance || {};
        details = {
          name: entry.title || entry.name || charName,
          role: d.role || '',
          age: d.age || app.age || '',
          gender: d.gender || app.gender || '',
          origin: d.origin || app.origin || '',
          location: d.currentSituation || d.location || '',
          personality: d.personality || '',
          bio: entry.description || d.bio || '',
          faction: d.faction || '',
          family: d.family || '',
          race: d.race || app.race || '',
          relationships: d.relationships || []
        };
      }
    }

    return found ? details : { name: charName };
  }

  private static parseAgeNumber(ageVal: any): number | null {
    if (typeof ageVal === 'number' && !isNaN(ageVal)) return ageVal;
    if (!ageVal || typeof ageVal !== 'string') return null;
    const match = ageVal.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num < 10000) return num;
    }
    return null;
  }

  private static extractWorldLocations(worldContext?: any, allLoreEntries?: any[]): string[] {
    const locations: string[] = [];

    if (allLoreEntries && Array.isArray(allLoreEntries)) {
      allLoreEntries.forEach(e => {
        const cat = (e.category || '').toLowerCase();
        if (['orte', 'ort', 'geografie', 'landkarte', 'bauwerke', 'städte', 'gebietskarte'].includes(cat)) {
          if (e.title) locations.push(e.title + (e.description ? `: ${e.description.substring(0, 80)}` : ''));
        }
      });
    }

    if (worldContext) {
      if (worldContext.locations && Array.isArray(worldContext.locations)) {
        worldContext.locations.forEach((l: any) => {
          if (typeof l === 'string') locations.push(l);
          else if (l?.name) locations.push(`${l.name}${l.description ? `: ${l.description.substring(0, 80)}` : ''}`);
        });
      }
      if (worldContext.territories && Array.isArray(worldContext.territories)) {
        worldContext.territories.forEach((t: any) => {
          if (t?.name) locations.push(`Gebiet "${t.name}"${t.type ? ` (${t.type})` : ''}`);
        });
      }
      if (worldContext.regionMarkers && Array.isArray(worldContext.regionMarkers)) {
        worldContext.regionMarkers.forEach((m: any) => {
          if (m?.name) locations.push(`Ort "${m.name}" (${m.type || 'Schauplatz'})`);
        });
      }
    }

    return Array.from(new Set(locations));
  }

  static async autofillSingleRelationship(
    sourceCharacterName: string,
    targetCharacterName: string,
    userPrompt?: string,
    existingRel?: any,
    worldContext?: any,
    allLoreEntries?: any[],
    keepExistingDetails: boolean = false
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();

      const sourceInfo = this.extractCharacterInfo(sourceCharacterName, allLoreEntries, worldContext);
      const targetInfo = this.extractCharacterInfo(targetCharacterName, allLoreEntries, worldContext);

      const sAgeNum = this.parseAgeNumber(sourceInfo?.age);
      const tAgeNum = this.parseAgeNumber(targetInfo?.age);

      let ageInstruction = '';
      if (sAgeNum !== null && tAgeNum !== null) {
        const diff = Math.abs(sAgeNum - tAgeNum);
        if (diff >= 6) {
          const youngerName = sAgeNum < tAgeNum ? sourceCharacterName : targetCharacterName;
          const olderName = sAgeNum < tAgeNum ? targetCharacterName : sourceCharacterName;
          const youngerAge = Math.min(sAgeNum, tAgeNum);
          const olderAge = Math.max(sAgeNum, tAgeNum);
          const olderAgeAtYoungerBirth = olderAge - youngerAge;

          ageInstruction = `\n### ZWINGENDE ALTERS- & ZEITLINIEN-DIREKTIVE (STRIKTE ALTERSLOGIK):
- "${sourceCharacterName}" ist aktuell ${sAgeNum} Jahre alt.
- "${targetCharacterName}" ist aktuell ${tAgeNum} Jahre alt.
- GROSSER ALTERSUNTERSCHIED DETEKTIERT: ${diff} Jahre Altersdifferenz!
- KRITISCHES LOGIK-MANDAT: Als "${youngerName}" ein Kind/Teenager (${youngerAge} Jahre) war, war "${olderName}" bereits ${olderAgeAtYoungerBirth} Jahre alt (erwachsen/mündig).
- STRENGES VERBOT: Sie hatten DEFINITIV KEINE "Gemeinsame Kindheit" als gleichaltrige Freunde/Gespielen!
- Dürfen unter "duration" NIEMALS "Seit der Kindheit" als Beziehungsdauer eintragen (es sei denn, gemeint ist: "${olderName}" beschützt "${youngerName}" seit dessen Kindheit).
- Unter "sharedPast", "keyMemories" und "keyEvents" DARF KEINE gemeinsame Kindheit auf Augenhöhe erfunden werden! Beschreibe stattdessen eine realistisch zur Altersdifferenz passende Konstellation (z.B. Mentor/Schüler, Aufziehender/Schützling, älterer Beschützer, Lehrmeister, oder erst späteres Kennenlernen im Leben).`;
        } else {
          ageInstruction = `\n### ALTERS- & ZEITLINIEN-LOGIK:
- "${sourceCharacterName}" (${sAgeNum} J.) und "${targetCharacterName}" (${tAgeNum} J.) sind in der gleichen Altersklasse (Differenz ${diff} Jahre). Eine gemeinsame Kindheit/Jugend ist zeitlich und biologisch plausibel.`;
        }
      } else {
        ageInstruction = `\n### ALTERS- & ZEITLINIEN-LOGIK:
- Alter von "${sourceCharacterName}": ${sourceInfo?.age || 'Unbekannt'}.
- Alter von "${targetCharacterName}": ${targetInfo?.age || 'Unbekannt'}.
- Prüfe die Altersangaben genau und stelle sicher, dass Vergangenheit, Kennenlernen und Beziehungsdauer mathematisch logisch zum angegebenen Alter beider Charaktere passen!`;
      }

      // Sanitize existingRel so Gemini only sees real, non-empty existing data
      let cleanedExisting: any = null;
      if (existingRel && keepExistingDetails) {
        cleanedExisting = {};
        for (const [k, v] of Object.entries(existingRel)) {
          if (v === null || v === undefined || v === '') continue;
          if (Array.isArray(v) && v.length === 0) continue;
          cleanedExisting[k] = v;
        }
      }

      const worldLocations = this.extractWorldLocations(worldContext, allLoreEntries);

      // Check if any specific meeting place is mentioned in bios, prompt, or existing rel
      const combinedTextForSearch = `${sourceInfo?.bio || ''} ${targetInfo?.bio || ''} ${userPrompt || ''} ${JSON.stringify(cleanedExisting || {})}`.toLowerCase();
      let specificMeetingPlaceMentioned = '';
      if (combinedTextForSearch.includes('taverne') || combinedTextForSearch.includes('schänke') || combinedTextForSearch.includes('gasthaus')) {
        specificMeetingPlaceMentioned = 'Taverne / Gasthaus';
      } else if (combinedTextForSearch.includes('gilde')) {
        specificMeetingPlaceMentioned = 'Gilde / Gildenhaus';
      } else if (combinedTextForSearch.includes('hafen') || combinedTextForSearch.includes('schiff')) {
        specificMeetingPlaceMentioned = 'Hafen / Schiff';
      } else if (combinedTextForSearch.includes('schloss') || combinedTextForSearch.includes('burg') || combinedTextForSearch.includes('palast')) {
        specificMeetingPlaceMentioned = 'Schloss / Burg / Palast';
      } else if (combinedTextForSearch.includes('akademie') || combinedTextForSearch.includes('schule')) {
        specificMeetingPlaceMentioned = 'Akademie / Magieschule';
      }

      let locationInstruction = `\n### ZWINGENDE ORTS- & SCHAUPLATZ-DIREKTIVE (STRIKTE ORTSKONSISTENZ):
- Herkunft / Ort von "${sourceCharacterName}": ${sourceInfo?.origin || sourceInfo?.location || 'Unbekannt'}
- Herkunft / Ort von "${targetCharacterName}": ${targetInfo?.origin || targetInfo?.location || 'Unbekannt'}
- Bekannte Welt-Schauplätze: ${worldLocations.length > 0 ? worldLocations.slice(0, 10).join(' | ') : 'Keine spezifischen Orte verzeichnet'}`;

      if (specificMeetingPlaceMentioned) {
        locationInstruction += `\n- ZWINGENDE ORTS-VORGABE: In den Charakterdaten/Notizen ist verankert, dass das erste Treffen an/in **${specificMeetingPlaceMentioned}** oder am jeweiligen Standort stattfand.
- Das erste Kennenlernen in 'keyMemories', 'sharedPast' und 'keyEvents' MUSS an diesem etablierten Ort (${specificMeetingPlaceMentioned}) stattfinden!
- STRENGES VERBOT: Verlege das erste Kennenlernen KEINESFALLS an unpassende, frei erfundene Orte (wie "in den Sanddünen der Wüste"), wenn dieser Ort nicht zur etablierten Biografie/Herkunft der Charaktere passt!`;
      } else {
        locationInstruction += `\n- ZWINGENDE ORTS-VORGABE: Richte das erste Kennenlernen und wichtige gemeinsame Erinnerungen strikt an den tatsächlichen Herkunftsorten/Standorten der Charaktere oder bekannten Welt-Schauplätzen aus.
- STRENGES VERBOT: Erfinde KEINE unpassenden, widersprüchlichen Schauplätze (wie "in den Sanddünen der Wüste"), wenn weder die Charaktere aus der Wüste stammen noch dort ihr Handlungsort liegt!`;
      }

      const sourceDetails = `
- CHARAKTERPROFIL 1 ("${sourceCharacterName}"):
  * Rolle/Klasse: ${sourceInfo?.role || 'Unbekannt'}
  * Alter: ${sourceInfo?.age || 'Unbekannt'}
  * Geschlecht: ${sourceInfo?.gender || 'Unbekannt'}
  * Herkunft/Heimat: ${sourceInfo?.origin || 'Unbekannt'}
  * Aufenthaltsort/Standort: ${sourceInfo?.location || 'Unbekannt'}
  * Rasse/Spezies: ${sourceInfo?.race || 'Unbekannt'}
  * Fraktion/Familie: ${sourceInfo?.faction || sourceInfo?.family || 'Keine'}
  * Persönlichkeit: ${sourceInfo?.personality || 'Nicht angegeben'}
  * Biografie/Hintergrund: ${sourceInfo?.bio ? sourceInfo.bio.substring(0, 500) : 'Keine Bio'}`;

      const targetDetails = `
- CHARAKTERPROFIL 2 ("${targetCharacterName}"):
  * Rolle/Klasse: ${targetInfo?.role || 'Unbekannt'}
  * Alter: ${targetInfo?.age || 'Unbekannt'}
  * Geschlecht: ${targetInfo?.gender || 'Unbekannt'}
  * Herkunft/Heimat: ${targetInfo?.origin || 'Unbekannt'}
  * Aufenthaltsort/Standort: ${targetInfo?.location || 'Unbekannt'}
  * Rasse/Spezies: ${targetInfo?.race || 'Unbekannt'}
  * Fraktion/Familie: ${targetInfo?.faction || targetInfo?.family || 'Keine'}
  * Persönlichkeit: ${targetInfo?.personality || 'Nicht angegeben'}
  * Biografie/Hintergrund: ${targetInfo?.bio ? targetInfo.bio.substring(0, 500) : 'Keine Bio'}`;

      let contextPrompt = `Erstelle oder ergänze eine extrem detaillierte, psychologisch authentische RPG-Charakterbeziehung zwischen "${sourceCharacterName}" und "${targetCharacterName}".

WICHTIGSTE DIRECTIVEN (JEDES FELD MUSS AUSGEFÜLLT SEIN):
1. Befülle ausnahmslos ALLE Beziehungs-Felder und Tabs vollständig auf Deutsch! Lass kein einziges Feld leer.
2. GRUNDBEZIEHUNG, MODUS & DAUER (type, relationshipStatus, isPotential, duration, currentStance):
   - "type": Die konkrete Art der Beziehung (z.B. "Freund / Freundin", "Rivale / Rivalin", "Gefährte / Kamerad", "Erzfeind", "Mentor / Schüler").
   - "relationshipStatus": Aktueller Beziehungsstatus (z.B. "Enge Verbündete", "Wachsendes Vertrauen", "Angespannter Frieden").
   - "isPotential": false falls bestehend/aktiv, true falls hypothetisch/zukünftige Dynamik.
   - "duration": Wie lange besteht diese Beziehung schon? Passt die Angabe logisch zum Alter beider Charaktere?
   - "currentStance": Aktuelle innere Haltung des Charakters gegenüber dem Gegenüber.
3. ANREDEN & SPITZNAMEN (addressFromSelfToTarget, addressFromTargetToSelf):
   - Wie nennt "${sourceCharacterName}" den Charakter "${targetCharacterName}" (z.B. Spitzname, Kosename, formelle Anrede, Meistertitel)?
   - Wie nennt "${targetCharacterName}" den Charakter "${sourceCharacterName}" im Gegenzug?
4. VERHALTEN & VERHALTENSDYNAMIK (behavior):
   - Wie verhalten sie sich im Gespräch, Alltag und im Kampf zueinander? (Detaillierte Schilderung)
5. ABHÄNGIGKEIT & FURCHT (dependency, fearIntimidation):
   - "dependency": Inwiefern besteht eine materielle, emotionale oder operative Abhängigkeit?
   - "fearIntimidation": Wie reagiert der Charakter auf Druck, Furcht oder Einschüchterung durch das Gegenüber?
6. VERBINDLICHE STORY-KI REGIEANWEISUNGEN (aiDirectives):
   - Strikte Verhaltensregeln für die Story-KI im Chat (z.B. "Darf ihn NIEMALS siezen. Nennt ihn immer 'Kleiner'. Im Kampf agieren sie synchron.").
7. PERSÖNLICHE WAHRNEHMUNG (perceptionSelfToTarget, perceptionTargetToSelf):
   - Wie sieht "${sourceCharacterName}" innerlich "${targetCharacterName}"?
   - Wie sieht "${targetCharacterName}" innerlich "${sourceCharacterName}"?
8. GEHEIMNISSE & VERBORGENE ABSICHTEN (secretsAndMotives):
   - Verborgene Absichten, geheime Gefühle oder unausgesprochene Pläne bezüglich dieser Beziehung.
9. GRENZEN & TABUS (boundariesAndTaboos):
   - Worüber sprechen die beiden nie? Welche roten Linien existieren?
10. GEMEINSAME VERGANGENHEIT & ERINNERUNGEN (sharedPast, keyMemories):
    - "sharedPast": Detaillierter Text über gemeinsame Vorgeschichte und Vergangenheit.
    - "keyMemories": Detaillierter Text über prägende gemeinsame Erinnerungen und Schlüsselmomente.
11. DIREKTIONALE BEZIEHUNGSWERTE (valuesSelfToTarget & valuesTargetToSelf):
    - Präzise numerische Werte für beide Richtungen: affection (-100 bis +100), trust (0 bis 100), respect (0 bis 100), loyalty (0 bis 100), familiarity (0 bis 100), fear (0 bis 100), bond (0 bis 100), hostility (0 bis 100).
12. SCHLÜSSELERSEIGNISSE (keyEvents):
    - Ein Array aus 1 bis 3 konkreten vergangenen Ereignissen/Wendepunkten (title, dateOrChapter, description, impact).

${sourceDetails}
${targetDetails}
${ageInstruction}
${locationInstruction}`;

      if (worldContext) {
        contextPrompt = `### WELTKONTEXT:
- Welt: "${worldContext.title || ''}" (${worldContext.era || ''})
- Ton/Genre: "${worldContext.tone || ''}"
- Beschreibung: "${worldContext.description || ''}"\n\n` + contextPrompt;
      }

      if (cleanedExisting && Object.keys(cleanedExisting).length > 0) {
        contextPrompt += `\n\n### BESTEHENDE BEZIEHUNGSDATEN (Ergänzungs-Modus aktiv - Behalte diese existierenden Daten bei und vervollständige alle noch leeren Felder):
${JSON.stringify(cleanedExisting, null, 2)}`;
      }

      if (userPrompt && userPrompt.trim()) {
        contextPrompt += `\n\n### SPEZIELLE NUTZER-ANWEISUNG / NOTIZEN FÜR DIESE BEZIEHUNG:
"${userPrompt.trim()}"`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: this.getRelationshipItemSchema()
        }
      });

      const parsed = this.parseJSONSafely(response.text || '{}', {});
      return {
        ...parsed,
        id: existingRel?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        targetCharacter: targetCharacterName || parsed.targetCharacter || existingRel?.targetCharacter || '',
        _isCustom: existingRel?._isCustom || false
      };
    });
  }

  static async autofillMotivationCore(
    characterName: string,
    characterRole?: string,
    characterBio?: string,
    characterPersonality?: string,
    existingCore?: any,
    userNotes?: string,
    worldContext?: any
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();

      let contextPrompt = `Erstelle oder vertiefe einen psychologisch fundierten, motivierten "Motivationskern" für den Charakter "${characterName}".
      
RICHTLINIEN:
- mainGoal: Übergeordnetes Hauptziel / Bestrebung (z.B. Thronfolge sichern, Gildenruhm, Frieden für die Heimat).
- whyGoal: Warum verfolgt der Charakter dieses Ziel? (persönlicher tiefer Antrieb: Macht, Sicherheit, Freiheit, Rache, Anerkennung, Schutz eines geliebten Menschen).
- currentPriorities: Was beschäftigt den Charakter aktuell am meisten? (z.B. Finanzen stabilisieren, Nachforschungen über Feinde anstellen).
- needs: Grundlegende und soziale Bedürfnisse (z.B. Nahrung, Geld, Sicherheit, soziale Anerkennung, Einfluss, Schutz, vertrauenswürdige Verbündete).
- fears: Ängste und Situationen, die unbedingt vermieden werden sollen (z.B. Verrat aus den eigenen Reihen, Versagen vor dem Clan, Kontrollverlust).
- valuesPrinciples: Werte und moralische Grundsätze (z.B. "Ein gegebenes Wort wird niemals gebrochen", "Zweck heiligt jedes Mittel", "Niemals Wehrlose verletzen").
- methodsAndMeans: Bevorzugte Methoden und Mittel (z.B. Diplomatie und Verhandlung, verdeckte Manipulation, gezielte Gewalt, List und Täuschung).
- changeTriggers: Veränderbarkeit / Welche Ereignisse oder Enthüllungen können die Prioritäten oder Ziele des Charakters erschüttern oder verändern?

Charakterdaten:
- Name: ${characterName}
- Rolle: ${characterRole || 'Unbekannt'}
- Persönlichkeit: ${characterPersonality || 'Unbekannt'}
- Biografie / Hintergrund: ${characterBio || 'Unbekannt'}
`;

      if (worldContext) {
        contextPrompt = `### WELTKONTEXT:
- Welt: "${worldContext.title || ''}" (${worldContext.era || ''})
- Ton: "${worldContext.tone || ''}"
- Beschreibung: "${worldContext.description || ''}"\n\n` + contextPrompt;
      }

      if (existingCore && Object.keys(existingCore).length > 0) {
        contextPrompt += `\n### BEREITS VORHANDENE MOTIVATIONSDATEN (Verfeinere und ergänze):
${JSON.stringify(existingCore, null, 2)}\n`;
      }

      if (userNotes && userNotes.trim()) {
        contextPrompt += `\n### SPEZIELLE NUTZER-WÜNSCHE FÜR DEN MOTIVATIONSKERN:
"${userNotes.trim()}"\n`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: this.getMotivationCoreSchema()
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
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
    existingFactions?: string[],
    allLoreEntries?: any[]
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      let contextPrompt = `Erstelle einen hochpräzisen, packenden und detailreichen RPG-Lore-Eintrag aus dem folgenden Text für die Kategorie "${category}".
WICHTIGSTE DIRECTIVEN:
0. KEINE EMOJIS: Verwende unter KEINEN Umständen Emojis in den Textfeldern oder Namen!
1. Der 'title' MUSS ausschließlich der kurze Name des Eintrags sein (z. B. 'Torben' bei einem Charakter, 'Katana des Winds' bei einem Gegenstand). Niemals den ganzen Text oder eine lange Beschreibung in das Feld 'title' kopieren!
2. ${category === 'Verbotenes Wissen' ? "Für die Kategorie 'Verbotenes Wissen' (Geheimnisse & Verborgenes Wissen): Schreibe KEINE lange ausschweifende Hintergrundgeschichte oder Erklärung! Die 'description' MUSS stattdessen nur 1-2 kurze, präzise Sätze umfassen, die sachlich und klar den konkreten geheimen Fakt benennen und festhalten, dass die KI diese Information nicht vorzeitig verraten darf (z. B. 'König Aldor ist der leibliche Vater von Torben. Diese Information darf die KI unter keinen Umständen im Chat verraten.')." : "Die 'description' MUSS eine packend geschriebene, detailreiche Hintergrundgeschichte oder Ausarbeitung auf Deutsch sein (mindestens 1-2 Absätze). Kopiere hier nicht den rohen Ausgangstext, sondern formuliere eine fesselnde Beschreibung dritter Personen oder historischer Art."}
3. Befülle unter 'details' ausnahmslos ALLE angeforderten Attribute! Falls bestimmte Werte im Text nicht vorhanden sind, ERFINDE fantastische, kreative und passende RPG-Details, die zur Kategorie passen! Lass kein einziges Feld der angeforderten Details leer oder unvollständig.
4. Schreibe alle Antworten auf Deutsch.
5. STRENGSTES GEHEIMNIS- & SPOILERVERBOT (SPIELER- & NPC-GEHEIMNISSE): Beziehe dich unter KEINEN Umständen in der Beschreibung (description) oder in anderen öffentlichen/normalen Textfeldern auf Geheimnisse, verborgenes Wissen oder "Stufe 3"-Geheimnisse des Spielers/Nutzers (das Geheimnis des Nutzers/Spielers) oder anderer Charaktere/Orte! Wenn in der Welten-Beschreibung, in den bestehenden Codex-Einträgen oder im "Enthülltes / Verborgenes Wissen" (revealedKnowledge) geheimes Wissen definiert ist, gilt dies als absolute Blackbox. Es darf NIEMALS unaufgefordert in der Beschreibung, Biografie oder anderen öffentlichen/normalen Feldern dieses Eintrags erwähnt, angedeutet, referenziert oder gespoilert werden! Die öffentliche Beschreibung muss vollkommen frei von diesen Geheimnissen bleiben.
6. ABSOLUTES VERBOT VON ZUKÜNFTIGEN EREIGNISSEN / KEIN VORGRIFF: Generiere NIEMALS Ereignisse, Fakten oder Begebenheiten, die in der Zukunft liegen oder noch gar nicht passiert sind! Der Spielstart, Prolog bzw. die erste Szene der Geschichte repräsentieren die absolute Gegenwart. Der Codex und die Zeitlinie dürfen ausschließlich die historische Vergangenheit (Vorgeschichte) enthalten ODER neue Ereignisse dokumentieren, die bereits nachweislich im Chat/Spielgeschehen passiert sind. Generiere niemals im Voraus, was passieren "wird" oder was der Spieler noch erleben "wird".
7. KEINE UNERLAUBTE SPIELER-BEZIEHUNG / DISTANZ HALTEN: Beziehe den Spieler oder Hauptcharakter (z.B. "${playerName || 'Spieler'}") NIEMALS eigenmächtig in Beziehungen, Treffen, Bekanntschaften oder Ereignisse ein, es sei denn, der Nutzer-Text/Prompt verlangt dies explizit, oder die Chat-Historie belegt ein solches Treffen/Bezug bereits zweifelsfrei! Erfinde niemals aus dem Nichts Beziehungen wie 'Freund von ${playerName}' oder Treffen wie 'Hat ${playerName} gestern getroffen', wenn der Spieler diesen Charakter laut Spielstand/Text noch gar nicht kennt oder getroffen hat. NPCs haben anfangs keinerlei Bezug zum Spieler.
8. 3-STUFEN-LOGIK DER GEHEIMNISSE (STRENGSTE DIRECTIVE & HARMONIE MIT MOTIVATION): Stufe 1 (secretsStage1), Stufe 2 (secretsStage2) und Stufe 3 (secretsStage3) MÜSSEN zwingend zur Gesinnung, Rolle und dem Hauptziel ('goal') des Eintrags passen. Erfinde NIEMALS unangebrachte Bösewicht-Klischees (wie Gehirnwäscher/Opferkulte/Ausbeutung) bei beschützenden oder edlen Charakteren! Wenn das Ziel "Mädchen vor Gefahren schützen" lautet, MUSS Stufe 3 ein wahren Schutzgeheimnis beinhalten (z. B. ein geheimes Asylnetzwerk oder verborgene Schutzmagie). Sie müssen sich ausschließlich auf die historische Vorgeschichte beziehen und das Spieler-Geheimnis als Blackbox behandeln.`;

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

      if (allLoreEntries && allLoreEntries.length > 0) {
        contextPrompt += `\n\n### BEREITS IM CODEX EXISTIERENDE EINTRÄGE DER WELT (WICHTIG FÜR KONSISTENZ & REVISION):
Verwende diese bestehenden Codex-Einträge, um den Story-Ablauf perfekt darauf abzustimmen, bekannte Figuren, Orte, Gegenstände oder Fraktionen einzubauen und logisch fortzuführen:
`;
        const subset = allLoreEntries
          .filter((e: any) => e && e.category !== 'Events' && e.category !== 'Story & Quests')
          .slice(0, 20);

        subset.forEach((entry: any) => {
          contextPrompt += `- Kategorie: "${entry.category}" | Name: "${entry.title || 'Unbenannt'}"\n`;
          if (entry.description) {
            contextPrompt += `  * Beschreibung: "${entry.description.substring(0, 150)}${entry.description.length > 150 ? '...' : ''}"\n`;
          }
          if (entry.details) {
            const relevantDetails: string[] = [];
            if (entry.details.faction) relevantDetails.push(`Fraktion: ${entry.details.faction}`);
            if (entry.details.role) relevantDetails.push(`Rolle: ${entry.details.role}`);
            if (entry.details.type) relevantDetails.push(`Typ: ${entry.details.type}`);
            if (entry.details.mapLevel) relevantDetails.push(`Ebene: ${entry.details.mapLevel}`);
            if (relevantDetails.length > 0) {
              contextPrompt += `  * Details: [${relevantDetails.join(', ')}]\n`;
            }
          }
        });
      }

      if (existingEntry) {
        contextPrompt += `\n\n### BESTEHENDE DATEN (Ergänzungs-Modus aktiv):
Es existiert bereits ein Lore-Eintrag mit folgenden Werten. Integriere/behalte diese Werte weitestgehend bei und ergänze/erweitere sie um die neuen Informationen aus dem Text. Überschreibe KEINE bestehenden, sinnvollen und ausgefüllten Werte, außer der neue Freitext verlangt dies explizit. Führe bestehende und neue Informationen elegant auf Deutsch zusammen!

WICHTIGSTE ZUSAMMENFÜHRUNGS-REGELN (GEGEN DUPLIKATE & AN DIE WELT ANGEPASST):
1. ABSOLUTES VERBOT VON DOPPELTEN ABSÄTZEN: Lies den bestehenden Wert von "Beschreibung (description)" oder "Biografie" sorgfältig durch. Füge auf KEINEN Fall denselben Text, dieselbe Formulierung oder bereits genannte Sätze (auch nicht leicht abgewandelt als "[Zusatz]: ...") noch einmal hinzu! Wenn die Information bereits vorhanden ist, darf sie NICHT erneut angehängt werden. Ergänze NUR wirklich neue, zusätzliche Details und verschmilz sie elegant zu einem einzigen, flüssigen Text ohne Redundanzen.
2. KEINE DUPLIZIERTEN FÄHIGKEITEN/KRÄFTE: Erstelle keine doppelten oder redundant benannten Fähigkeiten wie "Kraft / Fähigkeit #1", "Kraft / Fähigkeit #2", "Kraft / Fähigkeit #3" mit identischem oder ähnlichem Inhalt. Wenn bereits eine Fähigkeit oder Technik existiert, erweitere/ergänze sie lieber direkt in ihrem bestehenden Eintrag, anstatt eine weitere identische Fähigkeit hinzuzufügen, es sei denn, sie besitzt eine völlig andere Kraftquelle (powerSource). Es reicht vollkommen, eine Fähigkeit nur einmal aufzuführen und sie auszubauen.
3. STRENGE BALANCIERUNG VON MACHT & WERTEN: Leite die Macht-Werte (campaignPowerLevels) und Stärken absolut streng passend zur Welten-Beschreibung, zum Ton/Genre und zum genauen Zeitpunkt/Ära her! Gib keine willkürlichen Höchstwerte an, sondern passe sie exakt an das Niveau des Charakters zu diesem Zeitpunkt an.

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
${CHARACTER_BIO_7_QUESTIONS_PROMPT}
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
- Befülle das Feld 'techniques' ebenfalls mit einer kommagetrennten Liste der Techniknamen.
- PERSÖNLICHKEITS-ARCHETYP & PERSÖNLICHKEITSMERKMALE:
  * Wähle für 'personalityArchetype' einen passenden Archetyp (z.B. 'Tsundere', 'Kuudere', 'Dandere', 'Deredere', 'Yandere', 'Himedere', 'Kamidere', 'Tomboy', 'Yamato Nadeshiko', 'Genki', 'Femme Fatale', 'Anti-Held', 'Mentor', 'Trickster', 'Beschützer', 'Stratege', 'Rebell', 'Loyaler Ritter', 'Einzelgänger', 'Idealist', 'Melancholiker', 'Exzentriker', '-' etc.).
  * Passe die 24 quantitativen Persönlichkeitsmerkmale (im Objekt 'personalityTraits', Werte 0-100) stimmig an diesen Archetyp und Charakter an!`;

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
  
- WICHTIG FÜR STRUKTURIERTE BEZIEHUNGEN (relationships) & ALTERS-/ORTS-LOGIK:
  Falls im Text Beziehungen beschrieben werden (z.B. "Mutter von ${playerName}" oder "Mutter vom Nutzer"), erstelle zwingend einen Eintrag im Array 'relationships'.
  Setze 'targetCharacter' auf den exakten Namen des Hauptcharakters ("${playerName}") oder des anderen Charakters, 'type' auf die Beziehungsart (z.B. 'Mutter'), 'behavior' auf das Verhalten (z.B. 'Liebevoll, beschützerisch') und 'sharedPast' auf die gemeinsame Vergangenheit.
  
  ### ZWINGENDE ALTERS- & ZEITLINIEN-LOGIK:
  - Beachte das Alter beider Personen!
  - GROSSER ALTERSUNTERSCHIED (z. B. 17 Jahre vs. 35 Jahre):
    * Eine "Gemeinsame Kindheit" (z. B. "Gemeinsame Kindheit in der Wüste", "zusammen als Kinder aufgewachsen") ist bei großem Altersunterschied BIOLOGISCH UNMÖGLICH und STRENGSTENS VERBOTEN!
    * Solche Beziehungen dürfen NUR als Mentor/Schüler, älterer Beschützer, Lehrmeister, Aufpasser oder als spätere Begegnung im Leben formuliert werden — NIEMALS als Kindheitsfreunde!
    * Nur bei annähernd gleichem Alter (Differenz 0 bis max. 4 Jahre) ist eine echte gemeinsame Kindheit oder Jugend plausibel.
  
  ### ZWINGENDE ORTS- & SCHAUPLATZ-KONSISTENZ:
  - Achte peinlichst genau auf etablierte Treffpunkte und Herkunftsorte!
  - Wenn im Kontext oder im Freitext bereits ein Treffpunkt oder Ort etabliert ist (z. B. erstes Treffen in einer Taverne, Herkunft aus einer bestimmten Hafenstadt), muss das erste Kennenlernen in 'relationships', 'sharedPast' und 'bio' genau an DIESEM Ort stattfinden.
  - Erfinde NIEMALS unpassende, widersprüchliche Orte (wie "in den Sanddünen der Wüste"), wenn dieser Ort nicht zur etablierten Biografie oder Weltgeografie passt!`;
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
      } else if (category === 'Events' || category === 'Story & Quests') {
        contextPrompt += `
Für Story & Quests / Roter Faden / Kapitel der Kampagne:
- Zerlege den Story-Ablauf in chronologische Teilschritte (Stationen) im Array 'eventSteps'.
- Jede Station MUSS einen prägnanten Titel ("title") und eine genaue Beschreibung des Ablaufs ("description") haben.
- Setze den Status ("status") jeder Station auf 'planned'.
- Weise jeder Station einen Strang ("branch") zu: entweder 'main' (Hauptstory) oder 'side' (Nebenquest).
- Formuliere passende Freischalt-Bedingungen ("unlockConditions") auf Deutsch (z. B. 'Nach Abschluss von Station X', 'Spieler besitzt geheimes Amulett', 'Ort: Tempelruine erreicht').
- Beschreibe im Feld "chatInstruction" auf Deutsch, was genau in diesem Schritt im Chat/Abenteuer passieren soll (z. B. 'Der Dieb lockt die Helden in eine Falle', 'Der Hehler verlangt 50 Goldstücke für Informationen', 'Ein Drache greift die Stadt an und das Kampfsystem startet').
- Befülle ebenfalls den Reise-Pfad/Geografische Stationen ("travelPath", z. B. 'Von Eldoria durch den Flüsterwald nach Silberhafen'), die Reise-Dauer in Tagen ("travelDurationDays", als ganze Zahl, z. B. 3), und die Uhrzeit ("timeOfDay", z. B. '14:00 Uhr', 'Dämmerung' oder 'Mitternacht') für jede Station. Leite diese Werte logisch und stimmig aus der Welten-Beschreibung, den Tags und dem Genre ab und halte dich dabei streng an die Geografie und die Gegebenheiten der Weltvorlage!
- Befülle die vier dramaturgischen Säulen:
  * "trigger": Der genaue Auslöser (Wann/wodurch startet das Event? z.B. "Sobald der Spieler die verlassene Mine betritt...").
  * "cast": Die Besetzung (Wer taucht auf? z.B. "Der gierige Kobold-Kaufmann und zwei bewaffnete Wachen").
  * "setting": Die Kulisse (Wo findet die Handlung statt? z.B. "Eine feuchte, von spärlich glimmenden Pilzen erleuchtete Felshöhle").
  * "conflict": Der Konflikt (Was passiert und welcher Widerstand existiert? z.B. "Die Kobolde fordern eine horrende Maut und blockieren den einzigen Ausgang").
`;

        if (existingEntry && existingEntry.details?.eventSteps && Array.isArray(existingEntry.details.eventSteps) && existingEntry.details.eventSteps.length > 0) {
          contextPrompt += `
- STRENGE ANWEISUNG FÜR ERGÄNZUNGS-MODUS BEI STORY & QUESTS:
  * Es existieren bereits ${existingEntry.details.eventSteps.length} Station(en) in dieser Kampagne/Story:
${existingEntry.details.eventSteps.map((s: any, idx: number) => `    ${idx + 1}. [${s.title}] ${s.description || ''}`).join('\n')}
  * ABSOLUTES LÖSCH- & ÜBERSCHREIB-VERBOT: Überschreibe, lösche, kürze oder übertreibe die bestehenden Stationen NICHT!
  * Führe den Ablauf fort, indem du das neu beschriebene Ereignis als NÄCHSTE STATION (Station #${existingEntry.details.eventSteps.length + 1}) am Ende im Array 'eventSteps' erzeugst.
  * Falls du die bestehenden Stationen im Array 'eventSteps' mitlieferst, füge sie unverändert an den ersten Stellen ein und hänge die neue Station dahinter an.
  * Behalte den bisherigen Gesamttitel "${existingEntry.title || ''}" im Feld 'title' unverändert bei.
`;
        }

        contextPrompt += `
- STRENGE REVISION & EINBEZIEHUNG BESTEHENDER CODEX-EINTRÄGE (Charaktere, Orte, Fraktionen, etc.):
  * Analysiere alle bereits in der Welt existierenden Codex-Einträge (siehe die oben gelistete Tabelle existierender Einträge)!
  * Sorge für maximale narrative Konsistenz: Wenn im Story-Ablauf bestimmte Orte besucht oder Charaktere/Fraktionen aktiv werden, verwende bevorzugt und konsequent die bereits im Codex existierenden Namen und Gegebenheiten!
  * Aktualisiere/überarbeite den Story-Ablauf (eventSteps) so, dass neue oder geänderte Codex-Fakten logisch darin eingewoben und fortgeführt werden. Wenn ein Eintrag neu erstellt oder geupdated wird, passe die restlichen oder folgenden Schritte an, damit der Rote Faden perfekt zusammenpasst und eine zusammenhängende, logische Kette bildet.

- STRENGE DIRECTIVE FÜR "Enthülltes / Verborgenes Wissen" (revealedKnowledge):
  * Dieses Feld enthält Geheimnisse oder verdeckte Informationen, die dem Spieler erst durch diese Station enthüllt werden.
  * ABSOLUTES ERFINDUNGS-VERBOT VON WELTFREMDEN DETAILS: Erfinde KEINE Dinge, die nichts mit der angegebenen Welten-Beschreibung (worldContext), dem Genre oder den bestehenden Codex-Fakten zu tun haben! Das Wissen muss sich vollkommen harmonisch, logisch und organisch in die bestehende Weltvorlage, deren Gesetze und deren Historie einbetten.
  * KEINE EINSEITIGE SPIELER-ZENTRIERUNG: Das verborgene Wissen darf sich NICHT immer um den Spieler/Nutzer drehen (z.B. nicht immer "Der Spieler ist der Auserwählte" oder "Der Spieler hat magisches Blut"). Nutze stattdessen abwechslungsreiche Geheimnisse über die Welt, politische Intrigen anderer Fraktionen, geheime Machenschaften oder verdeckte Vergangenheiten von NPCs, versteckte Eigenschaften oder Flüche von Gegenständen, oder verborgene geographische Anomalien. Sorge dafür, dass die Welt lebendig, eigenständig und unabhängig vom Spieler wirkt!`;
      } else if (category === 'Gegenstände') {
        contextPrompt += `
Für Gegenstände / Items (STRENGSTE DIRECTIVE):
- FOKUS AUF DEN GEGENSTAND SELBST: Der Fokus muss vollkommen auf dem Gegenstand selbst liegen (Form, Beschaffenheit, Funktionsweise, Material, historische Herkunft).
- EINZIGARTIGKEIT & AUFENTHALTSORT (isUnique & currentLocation): Bestimme zwingend, ob der Gegenstand ein einzigartiges Unikat (existiert nur 1x auf der Welt), ein seltenes Einzelstück oder Massenware ist, sowie seinen aktuellen Aufenthaltsort/Verbleib (z.B. im Besitz eines Charakters, an einem Ort versteckt, gestohlen oder verschollen). Dies dient der KI als Ankerpunkt für Spurensuche, Quests und die Einwebung in die Kampagnen-Storyline.
- ABSOLUT KEINE ZUKÜNFTIGEN INHALTE: Es dürfen keinerlei Inhalte über Dinge eingebaut werden, die noch gar nicht passiert sind! Schließe alles aus, was in der Geschichte & dem Roten Faden der Kampagne steht oder sonst wo im Codex (z.B. geplante Quests, zukünftige Abenteuer des Spielers). Einzige Ausnahme: Wer den Gegenstand in der Vergangenheit hergestellt oder geschmiedet hat.
- STRENG NACH WELT-BESCHREIBUNG, TAGS & GENRE: Erstelle den Gegenstand und seine Wirkungsweise streng nach der Welten-Beschreibung (worldContext), den Tags und dem Genre der Welt.
- BEISPIEL TEUFELSKRÄFTE (KEINE AUTOMATISCHE ÜBERTRAGUNG): Wenn ein Charakter mit besonderen Kräften (wie z. B. Teufelskräften oder Magie) einen Gegenstand herstellt, ist dies trotzdem nur ein völlig normaler Gegenstand ohne Teufelskräfte oder automatische Magie, es sei denn, ein explizit magischer Schmiedeprozess wurde beschrieben. Ein Schwert, das von einem Teufelskraft-Nutzer geschmiedet wurde, ist standardmäßig nur eine ganz normale Waffe ohne magische Teufelskräfte!
- WELTREGEL-KOPPLUNG: Falls nötig, beziehe dich auf die Weltregeln ("Weltregeln" im Codex) bezüglich der Funktionsweise von Technologie und Magie in dieser Welt, um logische Inkonsistenzen zu vermeiden.`;
      } else if (category === 'Orte') {
        contextPrompt += `
Für Orte / Places:
- BESTIMME DIE MAP-EBENE (mapLevel): Weise dem Ort eine der drei Zoom-Ebenen zu:
  * 'macro': Für Kontinente, Ozeane, Königreiche oder große Inseln (die Weltkarte). Befülle hierfür 'ruler', 'government', 'population', 'culture' und 'currency'.
  * 'meso': Für Städte, Dörfer, Wälder, Gebirge, Dungeons, Regionen (Zonenebene). Befülle hierfür 'localLeader', 'dangerLevel', 'economicFocus' und 'localReputation'.
  * 'micro': Für lokale Points of Interest (POIs) innerhalb einer Meso-Stadt/Zone (z.B. eine Taverne, Gilde, Marktplatz). Befülle hierfür 'owner' und 'capacity'.
- SETZE DAS ELTERN-ELEMENT (parentPlaceId): 
  * Wenn mapLevel 'micro' is, nenne den Namen der zugehörigen Meso-Stadt oder Zone (z.B. 'Eldoria', wenn der POI eine Taverne in Eldoria ist).
  * Wenn mapLevel 'meso' ist, nenne den Namen der übergeordneten Macro-Insel/Kontinent/Königreich.
  * Wenn mapLevel 'macro' ist, lasse es leer oder verwende ''.
- GENERIERE MAP-KOORDINATEN (coordinates): Bestimme eine logische x- und y-Koordinate (jeweils 0 bis 100) auf der Karte für diesen Node. Sorge dafür, dass verschiedene Orte nicht exakt aufeinander liegen.
- BESTIMME DEN ORTSTYP (type): Typ des Ortes (z.B. 'Stadt', 'Dungeon', 'Taverne', 'Gilde', 'Wald', 'Höhle', 'Zuhause').`;
      } else if (category === 'Fraktionen') {
        contextPrompt += `
Für Fraktionen / Bündnisse / Gilden (STRENGSTE DIRECTIVE & 10 KERNFRAGEN):
Beantworte für die Fraktion zwingend und ausführlich auf Deutsch die folgenden 10 Kernbereiche:
1. Gründungsanlass & Ursprung ('foundingReason'): Warum wurde die Fraktion gegründet? Was war der ursprüngliche Anlass? (z.B. Schutz, Religion, Krieg, Handel, Widerstand, Machtstreben, Überleben etc.)
2. Ursprüngliches Ziel ('originalGoal'): Was wollte die Fraktion ursprünglich bei ihrer Gründung erreichen? (Das historische Ziel)
3. Aktuelle & langfristige Ziele ('currentGoal'): Was will die Fraktion heute erreichen? (Aktuelles Hauptziel und langfristige Bestrebungen)
4. Prägende historische Ereignisse ('keyHistoricalEvents'): Welche 2–4 Schlüsselereignisse haben die Fraktion in ihrer bisherigen Geschichte geprägt? (z.B. 1. Krieg/Schlacht, 2. Verrat/Schisma, 3. Aufstieg/Katastrophe)
5. Wandel & Entwicklung ('evolutionAndChange'): Wie hat sich die Fraktion durch ihre Geschichte im Laufe der Zeit verändert? (z.B. vom idealistischen Schutzbund zur bürokratischen Wirtschaftsmacht)
6. Führungsstruktur ('leadershipStructure') & Anführer ('leader'): Wie wird die Fraktion geführt? (z.B. Einzelner Anführer, Rat, Königsfamilie, demokratisch, religiöse Hierarchie, Clans) und Name der Leitfigur.
7. Zusammenhalt der Mitglieder ('cohesion'): Was hält die Mitglieder zusammen? (z.B. gemeinsame Ideologie, Loyalität, Sold/Geld, Glaube, Herkunft, Furcht, Feindbild, persönliche Eide)
8. Interne Konflikte & Spannungen ('internalConflicts'): Welche internen Machtkämpfe, Ideologiespaltungen oder Generationenkonflikte existieren in der Fraktion?
9. Beziehungen zu anderen Fraktionen (Qualitativ & konkret):
   - 'allies': Natürliche Verbündete (gemeinsame Werte, geteilte Interessen)
   - 'rivals': Rivalen (Wettbewerber um Macht, Territorium, Ressourcen)
   - 'enemies': Feinde (offene Feindschaft, Krieg)
   - 'convenienceAlliances': Zweckallianzen (pragmatische oder brüchige Partnerschaften)
   - 'unresolvedConflicts': Ungelöste Konflikte (schwelende Streitigkeiten, alte Rechnungen)
   - 'status': Beziehungsstatus zu Abenteurern / Spieler (z.B. 'Neutral', 'Wachsam')
10. Ressourcen & Machtpotenzial:
   - 'resourceEconomy': Geld & Wirtschaft (Finanzen, Schatzkammern, Einnahmequellen)
   - 'resourceTerritory': Territorium & Stützpunkte (beherrschte Gebiete, Festungen)
   - 'resourceMaterials': Rohstoffe (Erze, Kristalle, Bauholz, Getreide etc.)
   - 'resourceMembers': Mitglieder & Rekrutierung (Mitgliederzahl, Ausbildung)
   - 'resourceMilitary': Militär & Bewaffnung (Truppen, Schiffe, Elitekämpfer)
   - 'resourceInfluence': Politischer Einfluss (Einfluss auf Gesetze, Höfe, Richter)
   - 'resourceKnowledge': Wissen, Technologie & Magie (Forschung, Artefakte, Spionage)
   - 'resourceTrade': Handelsnetzwerk (Karawanen, Überseerouten, Monopole)
- 'philosophy': Leitmotiv oder Grundphilosophie
- 'maxMembers': Geschätzte maximale Mitgliederzahl / Gruppengröße`;
      } else if (category === 'Rassen') {
        contextPrompt += `
Für Rassen / Völker (STRENGSTE DIRECTIVE & KERNBEREICHE):
Erstelle ein vollständiges Profil für dieses Volk mit allen relevanten Aspekten auf Deutsch:
1. Grunddaten & Lebensraum:
   - 'subraces': Alternative Bezeichnungen, Unterarten, Sippen oder Stämme
   - 'originHabitat': Ursprünglicher Lebensraum, Kontinente, bevorzugte Biome
   - 'rarity': Verbreitung (z.B. 'Häufig (Weit verbreitet)', 'Regional verbreitet', 'Selten', 'Sehr selten', 'Legendär / Mythisch')
   - 'lifespan': Durchschnittliche Lebenserwartung & Reifealter (z.B. '120 Jahre, erwachsen mit 18 Jahren')
   - 'languages': Sprache, Dialekte und Schriftsystem
2. Physische & Anatomische Merkmale:
   - 'averageHeight': Durchschnittsgröße (z.B. '1,75 m bis 2,05 m')
   - 'averageWeight': Körperbau und typisches Gewicht (z.B. '70 - 110 kg, kräftig und sehnig')
   - 'skinAndHair': Typische Haut-, Fell- oder Schuppentöne sowie Haarfarben
   - 'eyeFeatures': Augenmerkmale, Nachtsicht oder Sinnesorgane
   - 'distinctiveFeatures': Besondere physische Merkmale (Hörner, Schweif, Schuppen, Kiemen, Flügel etc.)
   - 'biologyAndDiet': Biologische Besonderheiten, Stoffwechsel, Ernährung und Schlafbedarf
3. Kultur, Glaube & Gesellschaft:
   - 'socialStructure': Gesellschaftsordnung, Sippenstruktur und Herrschaftssystem
   - 'valuesAndPhilosophy': Kulturelle Grundwerte, Ehrenkodex und Philosophie
   - 'religionsAndGods': Religiöser Glaube, Ahnenkult und Gottheiten
   - 'traditionsAndRituals': Bräuche, Riten, Feste und Zeremonien
   - 'typicalProfessions': Typische Berufsfelder, Handwerkskunst und Rollen
4. Fähigkeiten, Magie & Resistenzen:
   - 'naturalTraits': Angeborene Begabungen und körperliche Talente
   - 'magicalAffinities': Magische Begabung, Elementaraffinitäten oder Energienutzung
   - 'resistances': Resistenzen und Immunitäten (z.B. Hitze, Kälte, Gift)
   - 'weaknesses': Schwächen und Verwundbarkeiten
5. Diplomatie & Beziehungen:
   - 'relationsAllies': Befreundete oder verbündete Völker
   - 'relationsRivals': Angespannte Verhältnisse und Rivalitäten
   - 'relationsEnemies': Feindseligkeiten oder historische Erbfeinde
   - 'attitudeTowardsOutsiders': Haltung gegenüber Fremden
   - 'reputation': Weltweiter Ruf und Stereotypen
6. Namenskonventionen & Bekannte Vertreter:
   - 'namingMale': Männliche Beispielnamen
   - 'namingFemale': Weibliche Beispielnamen
   - 'namingSurnames': Sippennamen, Clan-Bezeichnungen oder Titel
   - 'prominentFigures': Bedeutende historische Persönlichkeiten oder Anführer`;
      } else if (category === 'Gegner') {
        contextPrompt += `
Für Gegner / Monster / Schergen / Bosse (STRENGSTE DIRECTIVE & BESTIARIUM):
Erstelle ein vollständiges Profil für diesen namenlosen Gegner/Kreaturentyp mit allen relevanten Aspekten auf Deutsch:
1. Klassifizierung & Lebensraum:
   - 'enemyType': Eines aus: 'Scherge / Fußsoldat (Minion)', 'Regulärer Gegner (Standard)', 'Elite / Champion', 'Miniboss', 'Dungeonboss / Gebietsboss', 'Weltboss / Epischer Boss', 'Schwarm / Rudel (Swarm)'
   - 'species': Spezies/Familie (z.B. Humanoid, Untoter, Bestie / Tier, Dämon / Unhold, Konstrukt / Automat, Elementar, Monstrum, Drache / Drachenblut, Pflanze / Pilz, Geist / Phantom, Aberration / Kosmisch, Sonstige Kreatur)
   - 'threatLevel': Gefahrenstufe (z.B. 'Harmlos (Stufe 1)', 'Niedrig (Stufe 2 - 3)', 'Mittel (Stufe 4 - 5)', 'Gefährlich (Stufe 6 - 7)', 'Tödlich (Stufe 8 - 9)', 'Kataklysmisch (Stufe 10+)')
   - 'habitat': Bevorzugter Lebensraum, Spawn-Gebiete, Dungeons, Zonen
   - 'typicalGroupSize': Typische Rudelgröße (z.B. 'Einzelgänger (1)', 'Kleines Rudel (2 - 4)', 'Kampftrupp / Patrouille (4 - 8)', 'Große Horde (10 - 25)', 'Massenhafter Schwarm (30+)')
   - 'tacticalFormation': Typische Kampfformation (z.B. 'Keilformation (Wedge / Sturmangriff)', 'Schlachtlinie (Line / Schildfront)', 'Umzingelung (Surround / Einkreisung)', 'Zangenangriff (Flank / Flankieren)', 'Verstreut / Plänkler (Skirmish / Hit-and-Run)')
   - 'faction': Zugehörige Fraktion oder Organisation
   - 'alignment': Gesinnung/Natur (z.B. Aggressiv-Raubtierhaft, Fanatisch-Böse, Territorial-Neutral, Kontrolliert/Konstrukt)
2. Erscheinung & Physis:
   - 'appearance': Physische Gestalt, Panzerung, Klauen, Schuppen, Zähne, Aura, visuelle Erkennungsmerkmale
   - 'sizeCategory': Größenkategorie ('Winzig', 'Klein', 'Mittel (Menschengroß)', 'Groß (2 - 4 Meter)', 'Riesig (5 - 10 Meter)', 'Kolossal (Über 10 Meter)')
   - 'sensoryPerception': Sinne & Wahrnehmung (z.B. Dunkelsicht, Wärmesinn, Erschütterungssinn, Geruchssinn, Magiesinn)
3. Basis-Kampfwerte & KI-Taktik:
   - 'baseHp': Basis-Lebenspunkte (z.B. '120')
   - 'baseMp': Basis-Energie/Mana (z.B. '50')
   - 'armor': Rüstungswert / Physische Abwehr (z.B. '15')
   - 'magicResistance': Magiewiderstand (z.B. '10%')
   - 'movementSpeed': Bewegungsreichweite / Tempo / Mobilität (z.B. 'Sehr schnell (Sprint/Flug)' oder 'Normal')
   - 'combatBehavior': Taktisches Verhalten im Gefecht (z.B. 'Aggressiver Sturmangriff (Frontal)', 'Hinterhalt aus dem Schatten (Tarnung & Überfall)', 'Distanzkampf & Kiting (Rückzug bei Annäherung)', 'Defensiver Schildwall & Konter', 'Rudel-Koordination & Flankieren')
   - 'targetPriority': Zielpriorität (z.B. 'Magier und Heiler fokussieren', 'Schwächstes / verletztes Ziel angreifen', 'Nächstes Ziel / Nahkämpfer', 'Ziel mit höchster Bedrohung (Aggro/Frontkämpfer)')
   - 'moraleBehavior': Moral- und Fluchtverhalten (z.B. 'Kämpft bedingungslos bis zum Tod', 'Flieht bei schweren Verletzungen (<20% LP)', 'Gerät in Berserker-Raserei bei niedrigen LP', 'Ruft Verstärkung oder schlägt Alarm')
4. Resistenzen & Schwachstellen:
   - 'vulnerabilities': Physische oder elementare Schwachstellen (z.B. Anfällig für Feuerschaden (+100%), Schwachstelle am ungeschützten Nacken)
   - 'damageResistances': Schadensresistenzen (z.B. 50% Resistenz gegen Schnitt- und Stichwaffen, Hohe Frost-Resistenz)
   - 'statusImmunities': Immunitäten gegen Statuseffekte (z.B. Immun gegen Blutung, Gift, Betäubung, Furcht)
5. Beute & Rohstoffe (Loot):
   - 'guaranteedDrops': Garantierte Drops (100%)
   - 'rareDrops': Seltene Schätze & Drops mit %-Chance
   - 'harvestableParts': Verwertbare Handwerksmaterialien & Alchemiezutaten
   - 'goldDrop': Typische Währungsausbeute
6. Fähigkeiten & Macht:
   - 'abilities': Liste von 2-4 spezifischen Fähigkeiten mit Name, category ('Passive Fähigkeiten', 'Techniken', 'Ultimative Techniken', 'Transformationen', 'Talente'), cost, description und activationCondition.`;
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
          personalityArchetype: { type: Type.STRING, description: "Der passende Persönlichkeits-Archetyp oder Typus (z.B. Tsundere, Kuudere, Dandere, Deredere, Yandere, Kamidere, Himedere, Bakadere, Mayadere, Oujidere, Sadodere, Yangire, Bokukko, Nyandere, Chuunibyou, Dojikko, Gyaru, Tomboy, Yamato Nadeshiko, Genki, Kuudere-Typ, Ojou-sama, Femme Fatale, Anti-Held, Mentor, Trickster, Beschützer, Stratege, Rebell, Loyaler Ritter, Einzelgänger, Idealist, Melancholiker, Exzentriker) oder '-' falls neutral." },
          personalityTraits: this.getPersonalityTraitsSchema(),
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
          motivationCore: this.getMotivationCoreSchema(),
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
            items: this.getRelationshipItemSchema(),
            description: "Vollständig strukturierte Beziehungen zu anderen Charakteren der Welt (Codex-Einträge oder NPCs) inklusive Anreden, Wahrnehmung, Tabus, Vergangenheit, direktionale Werte und Ereignisse."
          }
        });
        requiredFields.push("role", "gender", "age", "race", "goal");
        
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
          type: { type: Type.STRING, description: "Typ des Ortes (z. B. 'Stadt', 'Ruine', 'Dungeon', 'Wald', 'Taverne', 'Gilde')." },
          climate: { type: Type.STRING, description: "Klima und Atmosphäre (z. B. 'Dauerhafter Nebel', 'Tropisch warm')." },
          landmarks: { type: Type.STRING, description: "Interessante Orte oder Landmarken (z. B. 'Ein verlassener Leuchtturm')." },
          mapLevel: { type: Type.STRING, description: "Ebene der Karte. Muss einer dieser Werte sein: 'macro' (Weltkarte/Königreiche/große Inseln), 'meso' (Städte/Dörfer/Wälder/große Dungeons), 'micro' (lokale POIs wie Taverne, Gilde, Marktplatz, Goblin-Höhle)." },
          parentPlaceId: { type: Type.STRING, description: "Der Name oder Titel des übergeordneten Ortes. Bei 'micro' ist es die zugehörige 'meso'-Stadt/Zone. Bei 'meso' ist es die zugehörige 'macro'-Insel/Königreich. Bei 'macro' leer lassen." },
          terrainTile: {
            type: Type.STRING,
            description: "Das passende Gelände-Symbol aus der Kachel-Bibliothek. Muss einer dieser 10 Strings sein: 'flüssigkeit' (Ozean/See/Fluss/Insel), 'hitze' (Vulkane/Feuer/Lava/Schmieden), 'kälte' (Eis/Schnee/Frost), 'natur_dicht' (Wald/Sumpf/Dschungel), 'natur_offen' (Wiese/Grasland/Ebene), 'trockenheit' (Wüste/Sand/Steppe/Ödland), 'fels' (Berge/Klippen/Felsen), 'struktur' (Stadt/Burg/Ruine/Straße), 'untergrund' (Höhle/Kanalisation/Tunnel), 'ungewissheit' (Nebel/Rauch/Portal)."
          },
          ruler: { type: Type.STRING, description: "Nur für 'macro': Herrscher / Fraktion (z. B. 'König Aldor', 'Das Rote Imperium')." },
          government: { type: Type.STRING, description: "Nur für 'macro': Regierungsform / System (z. B. 'Monarchie', 'Demokratie', 'Ratsrepublik')." },
          population: { type: Type.STRING, description: "Nur für 'macro': Einwohnerzahl & Demografie (z. B. '~500.000 (Menschen, Elfen)')." },
          culture: { type: Type.STRING, description: "Nur für 'macro': Kultur & Gesellschaftlicher Fokus (z. B. 'Militärisch, Ehrenkodex')." },
          currency: { type: Type.STRING, description: "Nur für 'macro': Währung (z. B. 'Goldmünzen', 'Kristallscherben')." },
          localLeader: { type: Type.STRING, description: "Nur für 'meso': Lokale Autorität / Anführer vor Ort (z. B. 'Bürgermeister Gerald')." },
          dangerLevel: { type: Type.STRING, description: "Nur für 'meso': Sicherheits- & Gefahrenstufe (z. B. 'Sicher', 'Hoch (Wegelagerer)')." },
          economicFocus: { type: Type.STRING, description: "Nur für 'meso': Wirtschaftlicher Fokus / Primäre Ressource (z. B. 'Bergbau', 'Fischerei')." },
          localReputation: { type: Type.STRING, description: "Nur für 'meso': Lokaler Ruf / Gesinnung (z. B. 'Gastfreundlich', 'Fremdenfeindlich')." },
          owner: { type: Type.STRING, description: "Nur für 'micro': Besitzer / Verwalter des Ortes (z. B. 'Wirt Barnaby')." },
          capacity: { type: Type.STRING, description: "Nur für 'micro': Kapazität / Betriebsamkeit (z. B. 'Hoch (gut besucht)', 'Begrenzt')." },
          coordinates: {
            type: Type.OBJECT,
            description: "XY-Koordinaten (0-100) auf der interaktiven Node-Map.",
            properties: {
              x: { type: Type.INTEGER, description: "X-Koordinate (0-100)" },
              y: { type: Type.INTEGER, description: "Y-Koordinate (0-100)" }
            },
            required: ["x", "y"]
          },
          physicalWidth: { type: Type.INTEGER, description: "Physische Breite (Ost-West Ausdehnung) des Ortes. Wenn mapLevel 'micro' ist, in Metern (m) (z.B. 10 bis 500). Wenn mapLevel 'meso' ist, in Kilometern (km) (z.B. 2 bis 50). Wenn mapLevel 'macro' ist, in Kilometern (km) (z.B. 200 bis 5000)." },
          physicalHeight: { type: Type.INTEGER, description: "Physische Höhe (Nord-Süd Ausdehnung) des Ortes. Wenn mapLevel 'micro' ist, in Metern (m) (z.B. 10 bis 500). Wenn mapLevel 'meso' ist, in Kilometern (km) (z.B. 2 bis 50). Wenn mapLevel 'macro' ist, in Kilometern (km) (z.B. 200 bis 5000)." }
        });
        requiredFields.push("type", "climate", "landmarks", "mapLevel", "coordinates", "terrainTile", "physicalWidth", "physicalHeight");
      } else if (category === 'Fraktionen') {
        Object.assign(detailsProperties, {
          // 1. Gründungsanlass & Ursprung
          foundingReason: { type: Type.STRING, description: "1. Warum wurde die Fraktion gegründet? Was war der ursprüngliche Anlass? (z.B. Schutz, Religion, Krieg, Handel, Widerstand, Machtstreben, Überleben etc.)" },
          // 2. Ursprüngliches Ziel
          originalGoal: { type: Type.STRING, description: "2. Was wollte die Fraktion ursprünglich bei ihrer Gründung erreichen? (Das historische Ziel)" },
          // 3. Aktuelle & langfristige Ziele
          currentGoal: { type: Type.STRING, description: "3. Was will die Fraktion heute erreichen? Aktuelles Hauptziel und langfristige Bestrebungen." },
          // 4. Prägende historische Ereignisse
          keyHistoricalEvents: { type: Type.STRING, description: "4. Was hat die Fraktion in ihrer bisherigen Geschichte geprägt? 2–4 prägende Schlüsselereignisse (Krieg, Verrat, Niederlage, Aufstieg eines Anführers, Katastrophe, großer Triumph)." },
          // 5. Wandel & Entwicklung
          evolutionAndChange: { type: Type.STRING, description: "5. Wie hat sich die Fraktion dadurch verändert? Entwicklung und Wandel seit der Gründung." },
          // 6. Führungsstruktur & Leitung
          leadershipStructure: { type: Type.STRING, description: "6. Wie wird die Fraktion geführt? (z.B. Einzelner Anführer, Rat, Königsfamilie, demokratisch, religiöse Hierarchie, Clan-Rat etc.)" },
          leader: { type: Type.STRING, description: "Name des aktuellen Anführers, Ratsvorsitzenden, Gründers oder der Leitfigur." },
          // 7. Zusammenhalt der Mitglieder
          cohesion: { type: Type.STRING, description: "7. Was hält die Mitglieder zusammen? (z.B. gemeinsame Ideologie, Loyalität, Sold/Geld, Glaube, Herkunft, Furcht, Feindbild, persönliche Eide)." },
          // 8. Interne Konflikte & Spannungen
          internalConflicts: { type: Type.STRING, description: "8. Welche internen Konflikte, Machtkämpfe, Ideologiespaltungen oder Generationenkonflikte existieren in der Fraktion?" },
          // 9. Beziehungen zu anderen Fraktionen
          allies: { type: Type.STRING, description: "9a. Wer sind natürliche Verbündete der Fraktion? (Gleiche Werte, geteilte Interessen)" },
          rivals: { type: Type.STRING, description: "9b. Wer sind Rivalen um Ressourcen, Einfluss oder Territorium?" },
          enemies: { type: Type.STRING, description: "9c. Wer sind offene Feinde (Krieg, Feindschaft)?" },
          convenienceAlliances: { type: Type.STRING, description: "9d. Mit wem besteht eine Zweckallianz oder ein brüchiges Bündnis?" },
          unresolvedConflicts: { type: Type.STRING, description: "9e. Welche ungelösten Konflikte oder alten Rechnungen bestehen noch?" },
          status: { type: Type.STRING, description: "Allgemeiner Beziehungsstatus zu Abenteurern / Spieler (z.B. 'Neutral', 'Verbündet', 'Misstrauisch', 'Feindselig')." },
          // 10. Ressourcen & Machtpotenzial
          resourceEconomy: { type: Type.STRING, description: "10a. Geld & Wirtschaft (Finanzen, Schatzkammern, Einnahmequellen)." },
          resourceTerritory: { type: Type.STRING, description: "10b. Territorium & Stützpunkte (Beherrschte Gebiete, Festungen, geheime Posten)." },
          resourceMaterials: { type: Type.STRING, description: "10c. Rohstoffe (Zugang zu Erzen, Magiekristallen, Getreide, Holz etc.)." },
          resourceMembers: { type: Type.STRING, description: "10d. Mitglieder & Personal (Mitgliederzahl, Rekrutierungsbasis, Ausbildungsstand)." },
          resourceMilitary: { type: Type.STRING, description: "10e. Militär & bewaffnete Kräfte (Truppenstärke, Flotte, Elitekämpfer, Bewaffnung)." },
          resourceInfluence: { type: Type.STRING, description: "10f. Politischer Einfluss (Einfluss auf Herrscher, Gesetze, Richter, Verträge)." },
          resourceKnowledge: { type: Type.STRING, description: "10g. Wissen, Technologie & Magie (Arkane Forschung, Artefakte, Spionagenetzwerk)." },
          resourceTrade: { type: Type.STRING, description: "10h. Handelsnetzwerk (Karawanenrouten, Handelsposten, Zölle, Monopole)." },
          // Ergänzend & Rückwärtskompatibilität
          philosophy: { type: Type.STRING, description: "Leitmotiv oder Grundphilosophie der Fraktion." },
          maxMembers: { type: Type.INTEGER, description: "Geschätzte maximale Mitgliederzahl für Rollenspiel- und Kampfsimulationen." },
          members: {
            type: Type.ARRAY,
            description: "Liste bedeutender Mitglieder mit Job und Aufgaben für das Wirtschafts- & Managementsystem.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING, description: "Name des Mitglieds" },
                job: { type: Type.STRING, description: "Job, Funktion oder Rolle in der Fraktion" },
                tasks: { type: Type.STRING, description: "Aufgaben für das Wirtschafts- & Managementsystem" },
                joinedDate: { type: Type.STRING, description: "Seit wann in der Fraktion (z.B. Seit 1042 / Seit 3 Jahren)" },
                status: { type: Type.STRING, description: "Status (z.B. Aktiv, Außendienst)" }
              },
              required: ["name", "job", "tasks", "joinedDate"]
            }
          }
        });
        requiredFields.push("foundingReason", "currentGoal", "leader");
      } else if (category === 'Rassen') {
        Object.assign(detailsProperties, {
          subraces: { type: Type.STRING, description: "Alternative Bezeichnungen, Unterarten, Stämme oder Sippen." },
          originHabitat: { type: Type.STRING, description: "Ursprünglicher Lebensraum, Kontinente, Biome." },
          rarity: { type: Type.STRING, description: "Verbreitung / Häufigkeit (z.B. Häufig, Regional, Selten, Legendär)." },
          lifespan: { type: Type.STRING, description: "Durchschnittliche Lebenserwartung & Reifealter." },
          languages: { type: Type.STRING, description: "Sprache, Dialekte und Schriftsystem." },
          averageHeight: { type: Type.STRING, description: "Durchschnittsgröße." },
          averageWeight: { type: Type.STRING, description: "Durchschnittliches Gewicht und Körperbau." },
          skinAndHair: { type: Type.STRING, description: "Typische Haut-, Fell- oder Schuppentöne sowie Haarfarben." },
          eyeFeatures: { type: Type.STRING, description: "Augenmerkmale, Nachtsicht oder Sinnesorgane." },
          distinctiveFeatures: { type: Type.STRING, description: "Besondere physische Merkmale (Hörner, Kiemen, Flügel etc.)." },
          biologyAndDiet: { type: Type.STRING, description: "Biologische Besonderheiten, Stoffwechsel, Ernährung und Schlaf." },
          socialStructure: { type: Type.STRING, description: "Gesellschaftsordnung und Herrschaftssystem." },
          valuesAndPhilosophy: { type: Type.STRING, description: "Kulturelle Grundwerte, Ehrenkodex und Philosophie." },
          religionsAndGods: { type: Type.STRING, description: "Religiöser Glaube, Gottheiten und Ahnenkult." },
          traditionsAndRituals: { type: Type.STRING, description: "Bräuche, Riten und Feste." },
          typicalProfessions: { type: Type.STRING, description: "Typische Tätigkeitsfelder und Handwerkskunst." },
          naturalTraits: { type: Type.STRING, description: "Angeborene Begabungen und körperliche Talente." },
          magicalAffinities: { type: Type.STRING, description: "Magische Begabung und Elementaraffinitäten." },
          resistances: { type: Type.STRING, description: "Resistenzen und Immunitäten." },
          weaknesses: { type: Type.STRING, description: "Schwächen und Verwundbarkeiten." },
          relationsAllies: { type: Type.STRING, description: "Befreundete oder verbündete Völker." },
          relationsRivals: { type: Type.STRING, description: "Angespannte Verhältnisse und Rivalitäten." },
          relationsEnemies: { type: Type.STRING, description: "Feindseligkeiten oder historische Feinde." },
          attitudeTowardsOutsiders: { type: Type.STRING, description: "Haltung gegenüber Fremden und Außenstehenden." },
          reputation: { type: Type.STRING, description: "Weltweiter Ruf und Stereotypen." },
          namingMale: { type: Type.STRING, description: "Männliche Beispielnamen." },
          namingFemale: { type: Type.STRING, description: "Weibliche Beispielnamen." },
          namingSurnames: { type: Type.STRING, description: "Sippennamen, Clan-Bezeichnungen oder Titel." },
          prominentFigures: { type: Type.STRING, description: "Bedeutende historische Persönlichkeiten oder Anführer." }
        });
        requiredFields.push("originHabitat", "distinctiveFeatures", "socialStructure");
      } else if (category === 'Gegenstände') {
        Object.assign(detailsProperties, {
          itemType: { type: Type.STRING, description: "Gegenstandsklasse (z. B. 'Waffen', 'Schiff / Fahrzeug / Transportmittel', 'Gebäude / Festung / Bauwerk', 'Belagerungsgerät / Geschütz', 'Artefakte / Zubehör', 'Verbrauchsgüter')." },
          isUnique: { type: Type.STRING, description: "Einzigartigkeit (z. B. 'Unikat (Existiert nur 1x auf der Welt)', 'Seltenes Einzelstück' oder 'Massenware / Gewöhnlich')." },
          currentLocation: { type: Type.STRING, description: "Aktueller Aufenthaltsort / Verbleib in der Welt (z. B. 'Im Besitz des Spielers', 'Gestohlen von den Schattendieben in Tiefwasser', 'Verschollen in den Ruinen')." },
          rarity: { type: Type.STRING, description: "Seltenheitswert (z. B. 'Legendär', 'Episch', 'Gewöhnlich')." },
          effects: { type: Type.STRING, description: "Wirkungen / Magische Effekte (z. B. '+12 Angriff, Lichtaura')." },
          owner: { type: Type.STRING, description: "Besitzer oder Verwalter dieses Gegenstands, Schiffs oder Gebäudes." },
          shipSize: { type: Type.STRING, description: "Größe bei Fahrzeugen/Schiffen/Gebäuden ('klein', 'mittel' oder 'groß')." },
          minCrew: { type: Type.INTEGER, description: "Minimale benötigte Besatzung." },
          maxCapacity: { type: Type.INTEGER, description: "Maximale Belegung / Transport-Kapazität." },
          population: { type: Type.INTEGER, description: "An Bord oder im Gebäude befindliche Personen/Besatzung." },
          defense: { type: Type.INTEGER, description: "Verteidigungswert / Panzerung." },
          attack: { type: Type.INTEGER, description: "Angriffskraft / Kanonen / Feuerkraft." },
          durability: { type: Type.INTEGER, description: "Haltbarkeit / Strukturpunkte / HP." }
        });
        requiredFields.push("itemType", "isUnique", "currentLocation", "rarity");
      } else if (category === 'Verbotenes Wissen') {
        Object.assign(detailsProperties, {
          confidentiality: { type: Type.STRING, description: "Geheimhaltungsstufe (z. B. 'Absolut Geheim', 'Bedingt Geheim')." },
          revealTrigger: { type: Type.STRING, description: "Konkrete Bedingung oder Ereignis, das dieses Geheimnis im Chat lüftet." },
          aiSecretInstruction: { type: Type.STRING, description: "Genaue Anweisungen an die KI, was auf keinen Fall preisgegeben werden darf." }
        });
        requiredFields.push("confidentiality", "revealTrigger", "aiSecretInstruction");
      } else if (category === 'Zeitlinie') {
        Object.assign(detailsProperties, {
          timeOfEvent: { type: Type.STRING, description: "Wann ist dieses Ereignis passiert? (z. B. 'Vor 10 Jahren', 'Jahr 345 der Drachenära', 'Tag 1 des Abenteuers', 'In der Abenddämmerung')" },
          location: { type: Type.STRING, description: "Wo hat dieses Ereignis stattgefunden? (z. B. 'Eldoria Hauptplatz', 'Im Schattental', 'In den Ruinen')" },
          involvedCharacters: { type: Type.STRING, description: "Wer war an diesem Ereignis beteiligt? (z. B. 'König Aldor, der dunkle Hexer, Himiko Frost')" }
        });
        requiredFields.push("timeOfEvent", "location", "involvedCharacters");
      } else if (category === 'Gegner') {
        Object.assign(detailsProperties, {
          enemyType: { type: Type.STRING, description: "Gegnertyp (z.B. 'Scherge / Fußsoldat (Minion)', 'Regulärer Gegner (Standard)', 'Elite / Champion', 'Miniboss', 'Dungeonboss / Gebietsboss', 'Weltboss / Epischer Boss', 'Schwarm / Rudel (Swarm)')." },
          species: { type: Type.STRING, description: "Spezies oder Kreaturenfamilie (z.B. Humanoid, Untoter, Bestie / Tier, Dämon / Unhold, Konstrukt, Elementar, Monstrum, Drache, Pflanze, Geist, Aberration)." },
          threatLevel: { type: Type.STRING, description: "Gefahrenstufe (z.B. 'Harmlos (Stufe 1)', 'Niedrig (Stufe 2 - 3)', 'Mittel (Stufe 4 - 5)', 'Gefährlich (Stufe 6 - 7)', 'Tödlich (Stufe 8 - 9)', 'Kataklysmisch (Stufe 10+)')." },
          habitat: { type: Type.STRING, description: "Bevorzugter Lebensraum, Spawn-Zonen und Dungeons." },
          typicalGroupSize: { type: Type.STRING, description: "Typische Gruppengröße (z.B. 'Einzelgänger (1)', 'Kleines Rudel (2 - 4)', 'Kampftrupp / Patrouille (4 - 8)', 'Große Horde (10 - 25)', 'Massenhafter Schwarm (30+)')." },
          tacticalFormation: { type: Type.STRING, description: "Taktische Standardformation (z.B. Keilformation, Schlachtlinie, Umzingelung, Zangenangriff, Plänkler)." },
          faction: { type: Type.STRING, description: "Zugehörige Fraktion oder Organisation." },
          alignment: { type: Type.STRING, description: "Gesinnung und Wesensart (z.B. Aggressiv-Raubtierhaft, Fanatisch-Böse, Territorial-Neutral)." },
          appearance: { type: Type.STRING, description: "Physische Gestalt, Anatomie, Panzerung, Klauen, Schuppen und optische Merkmale." },
          sizeCategory: { type: Type.STRING, description: "Größenkategorie (z.B. 'Mittel (Menschengroß)', 'Groß (2 - 4 Meter)', 'Riesig (5 - 10 Meter)', 'Kolossal (Über 10 Meter)')." },
          sensoryPerception: { type: Type.STRING, description: "Sinne und Wahrnehmung (z.B. Dunkelsicht, Erschütterungssinn, Geruchssinn für Blut)." },
          baseHp: { type: Type.STRING, description: "Basis-Lebenspunkte (z.B. '120' oder '650')." },
          baseMp: { type: Type.STRING, description: "Basis-Mana/Energie (z.B. '50' oder '200')." },
          armor: { type: Type.STRING, description: "Rüstungswert / Physische Abwehr (z.B. '15')." },
          magicResistance: { type: Type.STRING, description: "Magiewiderstand (z.B. '10%')." },
          movementSpeed: { type: Type.STRING, description: "Tempo und Mobilität (z.B. 'Schnell (Flug/Sprint)' oder 'Träge aber zäh')." },
          combatBehavior: { type: Type.STRING, description: "Kampfverhalten und KI-Taktik (z.B. 'Aggressiver Sturmangriff (Frontal)', 'Hinterhalt aus dem Schatten (Tarnung & Überfall)', 'Distanzkampf & Kiting (Rückzug bei Annäherung)', 'Defensiver Schildwall & Konter', 'Rudel-Koordination & Flankieren')." },
          combatBehaviorCustom: { type: Type.STRING, description: "Spezifische taktische Anweisungen für die KI." },
          targetPriority: { type: Type.STRING, description: "Zielpriorität (z.B. 'Magier und Heiler fokussieren', 'Schwächstes / verletztes Ziel angreifen', 'Nächstes Ziel / Nahkämpfer', 'Ziel mit höchster Bedrohung (Aggro/Frontkämpfer)')." },
          moraleBehavior: { type: Type.STRING, description: "Moral- und Fluchtverhalten (z.B. 'Kämpft bedingungslos bis zum Tod', 'Flieht bei schweren Verletzungen (<20% LP)', 'Gerät in Berserker-Raserei bei niedrigen LP')." },
          vulnerabilities: { type: Type.STRING, description: "Schwachstellen und Verwundbarkeiten (z.B. Feuerschaden, offener Rücken)." },
          damageResistances: { type: Type.STRING, description: "Schadensresistenzen (z.B. Stichschaden-Resistenz, Frost-Resistenz)." },
          statusImmunities: { type: Type.STRING, description: "Statuseffekt-Immunitäten (z.B. Immun gegen Blutung, Gift, Betäubung)." },
          guaranteedDrops: { type: Type.STRING, description: "Garantierte Beute (Drop 100%)." },
          rareDrops: { type: Type.STRING, description: "Seltene Drops mit Prozentangabe." },
          harvestableParts: { type: Type.STRING, description: "Verwertbare Materialien und Handwerksrohstoffe." },
          goldDrop: { type: Type.STRING, description: "Typische Währungsausbeute (z.B. 5 - 15 Silbermünzen)." },
          abilities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name der Fähigkeit." },
                category: { type: Type.STRING, description: "Eines aus: 'Passive Fähigkeiten', 'Techniken', 'Ultimative Techniken', 'Transformationen', 'Talente'." },
                cost: { type: Type.STRING, description: "Kosten oder Abklingzeit (z.B. '20 MP', 'Alle 3 Runden')." },
                description: { type: Type.STRING, description: "Wirkung und Ablauf der Fertigkeit." },
                activationCondition: { type: Type.STRING, description: "Auslöserbedingung (z.B. 'Bei <30% HP')." },
                transformName: { type: Type.STRING, description: "Name der Verwandlungsgestalt (falls Transformation)." },
                transformBuffs: { type: Type.STRING, description: "Attribut-Boni (falls Transformation)." }
              },
              required: ["name", "category", "description"]
            },
            description: "Liste von 2-4 spezifischen Fähigkeiten, Techniken oder Transformationen."
          }
        });
        requiredFields.push("enemyType", "species", "threatLevel", "habitat", "appearance", "combatBehavior", "vulnerabilities", "abilities");

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
          detailsProperties.campaignPowerData = {
            type: Type.OBJECT,
            properties: powerProps,
            required: Object.keys(powerSettings)
          };
          detailsProperties.campaignPowerLevels = {
            type: Type.OBJECT,
            properties: powerProps,
            required: Object.keys(powerSettings)
          };
          requiredFields.push("campaignPowerData");
        }
      } else if (category === 'Events' || category === 'Story & Quests') {
        Object.assign(detailsProperties, {
          eventSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING, description: "Kurzer, prägnanter Name dieses Meilensteins/Ablaufs." },
                description: { type: Type.STRING, description: "Detaillierte Beschreibung dieses Ereignisses." },
                status: { type: Type.STRING, description: "Muss 'planned' sein." },
                branch: { type: Type.STRING, enum: ["main", "side"], description: "Zugehöriger Handlungsstrang: 'main' (Hauptstory) oder 'side' (Nebenquest)." },
                unlockConditions: { type: Type.STRING, description: "Bedingungen, unter denen dieser Schritt im Spiel freigeschaltet wird." },
                chatInstruction: { type: Type.STRING, description: "Anweisung/Beschreibung, was im Chat passieren soll, wenn dieser Schritt aktiv wird." },
                travelPath: { type: Type.STRING, description: "Geografische Stationen / Der Reise-Pfad (z. B. 'Von Eldoria durch den Flüsterwald nach Silberhafen')." },
                travelDurationDays: { type: Type.INTEGER, description: "Reise-Dauer in Tagen (z. B. 3)." },
                timeOfDay: { type: Type.STRING, description: "Uhrzeit der Ankunft oder des Geschehens (z. B. '14:00 Uhr', 'Dämmerung', 'Mitternacht')." },
                trigger: { type: Type.STRING, description: "Auslöser (Trigger): Wann/wodurch startet das Event? z.B. Sobald der Spieler den Markt betritt..." },
                cast: { type: Type.STRING, description: "Besetzung (Wer): Welche Charaktere/NPCs tauchen auf? z.B. Der geheimnisvolle Magier..." },
                setting: { type: Type.STRING, description: "Kulisse (Wo): Wo genau spielt die Szene ab? z.B. Im staubigen Kellerarchiv..." },
                conflict: { type: Type.STRING, description: "Konflikt (Was): Was passiert und welcher Widerstand existiert? z.B. Der Dieb stiehlt das Medaillon und entkommt..." },
                revealedKnowledge: { type: Type.STRING, description: "Enthülltes / Verborgenes Wissen (optional): Geheime Details, die erst hier enthüllt werden dürfen." }
              },
              required: ["title", "description", "status", "branch", "unlockConditions", "chatInstruction"]
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
            description: category === 'Verbotenes Wissen'
              ? "Nur 1-2 kurze, sachliche Sätze: Der konkrete geheim zu haltende Fakt und dass die KI ihn nicht verraten darf (keine lange Geschichte oder ausschweifende Erklärung)."
              : "Ein detaillierter, packend geschriebener Fließtext als Hintergrundgeschichte, Herkunft und Legenden auf Deutsch (mindestens 1-2 Absätze)." 
          },
          details: {
            type: Type.OBJECT,
            properties: detailsProperties,
            required: requiredFields.length > 0 ? requiredFields : undefined
          },
          secretsStage1: {
            type: Type.STRING,
            description: "Stufe 1 (Öffentliches Wissen): Öffentliche Legenden/Gerüchte aus der Vorgeschichte. Muss zur Gesinnung und Rolle des Subjekts passen."
          },
          secretsStage2: {
            type: Type.STRING,
            description: "Stufe 2 (Indizien & Verdacht): Indizien oder begründeter Verdacht aus der Vorgeschichte. Keine unbegründeten Bösewicht-Klischees (wie Gehirnwäscher/Opferkulte) erfinden!"
          },
          secretsStage3: {
            type: Type.STRING,
            description: "Stufe 3 (Absolutes Geheimnis - Blackbox): Das tiefe, wahre Geheimnis aus der Vorgeschichte. MUSS zwingend im Einklang mit dem Hauptziel (goal) und der Gesinnung stehen."
          }
        },
        required: ["title", "description", "details", "secretsStage1", "secretsStage2", "secretsStage3"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      return this.parseJSONSafely(response.text || '{}', {});
    });
  }

  static async autofillMultipleLoreEntries(
    text: string,
    worldContext?: any,
    allLoreEntries?: any[],
    powerSettings?: any,
    playerName?: string,
    isNsfw?: boolean
  ): Promise<any[]> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      const existingTitles = allLoreEntries
        ? allLoreEntries.map(e => `Kategorie: "${e.category}" | Name: "${e.title || 'Unbenannt'}"`).join('\n')
        : '';

      const powerInstruction = powerSettings ? `\n### KAMPAGNEN-WERTE-SYSTEM:\nNutze diese Parameter, um sinnvolle \`campaignPowerLevels\` (mit \`value\` und \`potentialMax\` 0-100) für erstellte Charaktere und Gegner in deren \`details\` zu generieren:\n${JSON.stringify(powerSettings, null, 2)}\n` : "";

      const prompt = `Du bist ein hochkreativer RPG-Designer und Weltenbauer. Der Nutzer möchte ein UMFANGREICHES, REICHHALTIGES Set von MULTIPLEN, perfekt aufeinander abgestimmten Lore-Einträgen auf einmal generieren (mindestens 8 bis 15 relevante Einträge pro Nutzung des Omni-Füllers!).
      
### NUTZERPROMPT/BESCHREIBUNG:
"${text}"

### WELTHINTERGRUND & KONTEXT:
- Weltenname/Thema: "${worldContext?.title || ''}"
- Ära/Zeitpunkt der Story: "${worldContext?.era || ''}"
- Ton/Stimmung: "${worldContext?.tone || ''}"
- Welten-Beschreibung/Regeln: "${worldContext?.description || ''}"
${powerInstruction}

### BEREITS IM CODEX EXISTIERENDE EINTRÄGE (WICHTIG FÜR REVISION & NARRATIVE KONSISTENZ):
${existingTitles || '(Keine bisherigen Einträge vorhanden)'}

### DESIGN-AUFTRAG & ANWEISUNGEN:
1. Analysiere den Nutzerprompt gründlich. Generiere NICHT NUR 3 oder 4 Einträge, sondern ein VOLLSTÄNDIGES und UMFANGREICHES Set von ca. 8 bis 15 tiefgründigen, zusammenhängenden Codex-Einträgen!
2. Wenn der Nutzer beispielsweise eine Fraktion, eine Insel oder ein Ereignis beschreibt, erstelle:
   - Die primäre Entität (z. B. Fraktion oder Hauptort)
   - Mehrere Schlüssel-Charaktere (Anführer, Vize, Händler, Rivalen, Geheimnisvoller NPC)
   - Wichtige Orte (Übergeordnete Insel/Region, Hauptquartier, Hafen, Taverne, geheimer Unterschlupf)
   - Besondere Gegenstände (Relikte, Waffen, Verträge, Kaperbriefe)
   - Verbotenes Wissen / Geheimnisse
   - Relevante Zeitlinien-Ereignisse (Historische Vorgeschichte)
3. WICHTIGSTE REGELEINHALTUNG FÜR DIE KATEGORIE "Orte":
   - Wenn Orte (z. B. Hafen, Stadt, Dorf, Burg, Taverne, Festung, Tempel) auf einer Insel, Küste oder Region liegen, erstelle ZWINGEND auch den dazugehörigen übergeordneten Landmassen- bzw. Insel-Eintrag (z. B. Kategorie 'Orte', title: 'Insel Ouka' oder 'Provinz Eldoria', type: 'insel' oder 'region')!
   - Verknüpfe alle Unterorte/Siedlungen über ihr detail-Feld "parentPlaceId" exakt mit dem Namen des übergeordneten Landmassen-Eintrags (z. B. "parentPlaceId": "Insel Ouka").
   - Vergib für jeden Ort konkrete X/Y-Koordinaten (coordinates: { x: number, y: number }), die logisch und verteilt auf der Weltkarte liegen (x zwischen 15 und 85, y zwischen 15 und 85), sodass sich Punkte nahe der Insel/Region befinden und sich nicht alle am selben Fleck stapeln.
4. Fülle die 'details' für JEDE Kategorie EXAKT, LÜCKENLOS und VOLLSTÄNDIG aus! Fehlen Angaben im Text, erfinde fantastische, kreative RPG-Details (vollständige Techniken, Körpermaße, Machtwerte, Geheimnisse, verknüpfte Beziehungen)!
5. Verknüpfe alle Einträge intelligent! Zum Beispiel:
   - Wenn du eine Fraktion namens "Klingen der Nacht" erstellst und einen Charakter namens "Garrick", setze im detail-Feld "faction" des Charakters exakt "Klingen der Nacht".
   - Wenn du einen Ort namens "Turm der Schatten" erstellst, der das Hauptquartier dieser Fraktion ist, setze im detail-Feld "ruler" des Ortes "Klingen der Nacht".
   - Wenn du einen Charakter erstellst, der eine Spezialwaffe "Schattenklinge" trägt, erwähne diese Waffe in den Details/Kräften des Charakters und erstelle gleichzeitig den passenden Gegenstands-Eintrag.
6. Alle Beschreibungen müssen hochgradig atmosphärisch, packend und auf Deutsch geschrieben sein. Jede Beschreibung sollte mindestens 1-2 Absätze lang sein.
7. Generiere für jeden Eintrag die drei Geheimnis-Stufen ('secretsStage1', 'secretsStage2', 'secretsStage3') auf Deutsch aus Sicht der historischen Vorgeschichte. WICHTIG: Die Geheimnisse MÜSSEN zwingend zur Rolle und dem Hauptziel ('goal') der Figur/des Eintrags passen! Wandle beschützende, edle oder neutrale Figuren NIEMALS in böse Schurken, Opfersulte oder Ausbeuter um. Stufe 3 muss ihre wahre tiefe Motivation widerspiegeln (z.B. ein geheimes Schutznetzwerk oder verdecktes Asyl).
8. ABSOLUTES VERBOT VON ZUKÜNFTIGEN EREIGNISSEN / KEIN VORGRIFF: Generiere NIEMALS Einträge (insbesondere unter 'Zeitlinie' oder 'Story & Quests'), die in der Zukunft liegen, zukünftige Handlungen vorwegnehmen oder noch gar nicht passiert sind! Der Spielstart/Prolog stellt die absolute Gegenwart dar.
9. KEINE UNERLAUBTE SPIELER-BEZIEHUNG / DISTANZ HALTEN: Beziehe den Spieler oder Hauptcharakter (z. B. "${playerName || 'Spieler'}") NIEMALS eigenmächtig in Beziehungen, Treffen, Bekanntschaften oder Ereignisse ein, es sei denn, der Nutzer-Text verlangt dies explizit! Nutze stattdessen Beziehungen zwischen NPCs untereinander.
10. ZEITLINIE IST REINE VERGANGENHEIT: Einträge in der Kategorie "Zeitlinie" müssen historische Ereignisse sein, die vor Spielbeginn stattfanden.

### SPEZIFIKATION DER CATEGORIES & DEREN DETAILS-STRUKTUR:

#### 1. Kategorie "Charaktere"
- title: Kurzer Name (z.B. "Garrick")
- description: Biografie und Geschichte (Deutsch, detailreich). Beantworte zwingend die 8 Kernfragen mit jeweils 2 bis 3 Sätzen (Wo und in welchen Verhältnissen aufgewachsen? Kindheit beschreiben? Wichtige Menschen? Wichtigstes prägendes Ereignis? Weg zum heutigen Leben/Beruf/Rolle? Prägende Erfahrungen? Bereuen/Verlieren/Änderungswunsch? Verschwiegenes Geheimnis?)
- details-Objekt mit allen Pflichtfeldern: "rufName", "role", "nickname", "personality", "currentSituation", "gender", "age", "build", "hairColor", "eyeColor", "outfit", "height", "measurements", "cupSize", "race", "raceFeatures", "origin", "family", "faction", "goal", "skills", "powerSource", "powerCost", "techniques", "techniqueList", "relationship", "conduct", "relationships", "campaignPowerLevels"

#### 2. Kategorie "Orte"
- title: Name des Ortes (z.B. "Insel Ouka", "Der Hafen von Ouka" oder "Die Obsidian-Höhlen")
- description: Packende Geschichte und Aussehen des Ortes (Deutsch, detailreich)
- details-Objekt mit ALLEN Feldern des Weltkarte-Eintrags:
  * "type": 'insel' | 'kontinent' | 'region' | 'land' | 'stadt' | 'hafen' | 'dorf' | 'festung' | 'ort' | 'gebäude' | 'taverne'
  * "mapLevel": 'macro' (Kontinent/Ozean) | 'meso' (Insel/Region/Stadt) | 'micro' (POI/Hafen/Höhle/Taverne)
  * "parentPlaceId": Name des übergeordneten Ortes/Landmasse (z.B. "Insel Ouka" bei Hafen, Stadt oder Höhle)
  * "terrainTile": 'flüssigkeit' | 'hitze' | 'kälte' | 'natur_dicht' | 'natur_offen' | 'trockenheit' | 'fels' | 'struktur' | 'untergrund' | 'ungewissheit'
  * "population": Einwohnerzahl (z.B. "12.500" oder "Unbewohnt")
  * "ruler": Herrscher / Gouverneur / Kommandant (z.B. "Kapitän Vane")
  * "climate": Klima & Atmosphäre (z.B. "Tropisch maritim, stürmische Monsunwinde")
  * "culture": Kultur & Lebensart (z.B. "Seefahrer-Traditionen und Piratenkodex")
  * "terrain": Landschaftsbeschreibung (z.B. "Schwarzer Basalt, schroffe Klippen und tiefe Mangroven")
  * "faction": Herrschende Fraktion (z.B. "Die Schwarze Flagge")
  * "coordinates": { "x": number (15-85), "y": number (15-85) }
  * Geografie:
    - "biome": Genaues Biom (z.B. "Vulkanischer Dschungel", "Korallenküste", "Nebelgebirge")
    - "size": Ausdehnung (z.B. "ca. 450 km²")
    - "borders": Angrenzende Gewässer/Gebiete (z.B. "Umgeben von der Saphirsee")
    - "waters": Gewässer (z.B. "Smaragdbucht, Nebelfluss")
    - "mountains": Gebirge (z.B. "Obsidian-Kamm, Drachenzahn-Gipfel")
    - "forests": Wälder (z.B. "Flüsternder Urwald")
  * Gesellschaft:
    - "races": Völker & Spezies (z.B. "Menschen (60%), Fischmenschen (30%), Tiermenschen (10%)")
    - "language": Sprache (z.B. "Gemeinsprache, Seefahrer-Dialekt")
    - "religion": Glaube & Gottheiten (z.B. "Kult der Meerestiefe")
    - "livingStandard": Lebensstandard (z.B. "Gedeihend durch Fernhandel")
  * Politik & Wirtschaft:
    - "government": Regierungsform (z.B. "Freibeuter-Ratsversammlung")
    - "allies": Verbündete (z.B. "Freie Händlergilde")
    - "enemies": Feinde / Bedrohungen (z.B. "Kaiserliche Marineflotte")
    - "resources": Bodenschätze & Ressourcen (z.B. "Obsidianglas, Perlen, Seltene Hölzer")
    - "trade": Haupthandel (z.B. "Gewürz- und Waffenhandel")
    - "currency": Währung (z.B. "Golddublonen")
    - "exports": Exportgüter (z.B. "Vulkanisches Glas, Rum")
    - "imports": Importgüter (z.B. "Getreide, Schmiedeeisen")
  * Militär:
    - "dangerLevel": Gefahrenstufe (z.B. "Niedrig", "Mittel", "Gefährlich", "Tödlich")
    - "militaryStrength": Streitkräfte (z.B. "5 Kriegsschiffe, 300 Veteranen-Korsaren")
    - "defense": Wehranlagen (z.B. "Kanonenbatterie an den Klippen, Fallgitter")
  * Besonderheiten:
    - "landmarks": Wahrzeichen (z.B. "Der Leuchtturm des Ewigen Feuers")
    - "pointsOfInterest": Sehenswürdigkeiten (z.B. "Die Schwarze Taverne, Der Schmugglerbasar")
    - "dungeons": Dungeons / Katakomben (z.B. "Die Obsidian-Höhlen, Alte Flutgrüfte")
    - "magicPlaces": Magische Orte (z.B. "Der Gezeiten-Schrein")
    - "naturalWonders": Naturwunder (z.B. "Die Glimmende Thermalbucht")
  * KI-Kartengenerierung & Layout-Vorgaben:
    - "layoutPreset": 'hafenbucht' | 'insel_dorf' | 'gebirgspass' | 'waldlichtung' | 'festung_zitadelle' | 'freie_ebene' | 'keins'
    - "compassDirections": Himmelsrichtungen (z.B. "Norden: Obsidian-Höhlen, Süden: Hafenbucht, Westen: Dschungel")
    - "envNeighbours": Unmittelbare Umgebung (z.B. "Eingebettet zwischen schroffen Basaltklippen und blauem Ozean")
    - "distancesToNeighbours": Reisedistanzen (z.B. "1 Tagesreise zur Nachbarinsel")

#### 3. Kategorie "Rassen"
- title: Name des Volkes oder der Rasse (z.B. "Lunarier", "Hochelfen", "Mondschatten-Katzenvolk")
- description: Kultureller Hintergrund, Erscheinungsbild und Lebensweise (Deutsch, detailreich)
- details-Objekt mit Völker-Attributen: "subraces", "originHabitat", "rarity", "lifespan", "languages", "averageHeight", "averageWeight", "distinctiveFeatures", "skinAndHair", "eyeFeatures", "biologyAndDiet", "socialStructure", "valuesAndPhilosophy", "religionsAndGods", "traditionsAndRituals", "typicalProfessions", "naturalTraits", "magicalAffinities", "resistances", "weaknesses", "relationsAllies", "relationsRivals", "relationsEnemies", "attitudeTowardsOutsiders", "reputation", "namingMale", "namingFemale", "namingSurnames", "prominentFigures"

#### 4. Kategorie "Fraktionen"
- title: Name der Fraktion (z.B. "Klingen der Nacht")
- description: Hintergrundgeschichte, Entstehung und Machtbereich (Deutsch, detailreich)
- details-Objekt mit den 10 Kernfeldern:
  * "foundingReason": Warum wurde die Fraktion gegründet? Ursprünglicher Anlass (Schutz, Religion, Krieg, Handel, Widerstand, Machtstreben, Überleben etc.)
  * "originalGoal": Was wollte die Fraktion ursprünglich bei ihrer Gründung erreichen?
  * "currentGoal": Was will die Fraktion heute erreichen? (Hauptziel und langfristiges Bestreben)
  * "keyHistoricalEvents": 2–4 prägende historische Schlüsselereignisse (Krieg, Verrat, Niederlagen, Aufstieg, Katastrophen, Erfolge)
  * "evolutionAndChange": Wie hat sich die Fraktion dadurch im Laufe der Zeit verändert?
  * "leadershipStructure": Führungsstruktur (Einzelner Anführer, Rat, Königsfamilie, demokratisch, religiöse Hierarchie, Clans)
  * "leader": Name des aktuellen Anführers, Ratsvorsitzenden oder Gründers
  * "cohesion": Was hält die Mitglieder zusammen? (Ideologie, Loyalität, Sold, Glaube, Herkunft, Furcht, Feindbild, persönliche Eide)
  * "internalConflicts": Welche internen Konflikte und Machtkämpfe existieren?
  * Beziehungen: "allies" (Verbündete), "rivals" (Rivalen), "enemies" (Feinde), "convenienceAlliances" (Zweckallianzen), "unresolvedConflicts" (Ungelöste Konflikte), "status" (Haltung zu Abenteurern)
  * Ressourcen & Macht: "resourceEconomy" (Wirtschaft & Finanzen), "resourceTerritory" (Territorium & Stützpunkte), "resourceMaterials" (Rohstoffe), "resourceMembers" (Mitglieder & Rekrutierung), "resourceMilitary" (Militär & Bewaffnung), "resourceInfluence" (Politischer Einfluss), "resourceKnowledge" (Wissen & Magie), "resourceTrade" (Handelsnetzwerk)
  * "philosophy": Leitmotiv / Philosophie
  * "maxMembers": Maximale Mitgliederanzahl als Zahl

#### 4. Kategorie "Gegenstände"
- title: Name des Gegenstands (z.B. "Schattenklinge")
- description: Aussehen, Herkunft und Legende des Items (Deutsch, detailreich)
- details-Objekt: "itemType", "rarity"

#### 5. Kategorie "Verbotenes Wissen"
- title: Name des verbotenen Wissens (z.B. "Das Geheimnis des Schattenpakts")
- description: Nur 1-2 kurze, sachliche Sätze mit dem konkreten Fakt, den die KI nicht vorzeitig verraten darf
- details-Objekt: "confidentiality", "revealTrigger", "aiSecretInstruction"

#### 6. Kategorie "Weltregeln"
- title: Name der Weltregel
- description: Genaue Funktionsweise der Regel
- details-Objekt: {}

#### 7. Kategorie "Gegner"
- title: Name des Gegners
- description: Beschreibung der Kreatur
- details-Objekt: "role", "skills", "powerSource", "powerCost", "techniques", "techniqueList"

#### 8. Kategorie "Zeitlinie"
- title: Name des historischen Ereignisses
- description: Genaue historische Abhandlung (Vergangenheit)
- details-Objekt: "timeOfEvent", "location", "involvedCharacters"

### AUSGABEFORMAT:
Du MUSST ein valides JSON-Objekt zurückgeben mit genau einem Feld "entries", welches ein Array von 8 bis 15 dieser vollkommen ausgearbeiteten Lore-Objekte ist:
{
  "entries": [
    {
      "category": "Charaktere" | "Rassen" | "Orte" | "Fraktionen" | "Gegenstände" | "Verbotenes Wissen" | "Weltregeln" | "Gegner" | "Zeitlinie",
      "title": "Titel des Eintrags",
      "description": "Atmosphärische und detailreiche Beschreibung auf Deutsch",
      "isUnlocked": true,
      "details": { ... passend zur Kategorie ... },
      "secretsStage1": "Öffentliches Wissen / Legenden",
      "secretsStage2": "Verdachtsmomente / Gerüchte",
      "secretsStage3": "Absolutes Geheimnis / Blackbox"
    }
  ]
}

Antworte AUSSCHLIESSLICH mit diesem validen JSON-Objekt. Keine Einleitung, kein Outro, kein Markdown wie \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      const textResult = (response.text || '').trim();
      try {
        const parsed = this.parseJSONSafely(textResult, { entries: [] });
        return parsed.entries || [];
      } catch (e) {
        console.error("Fehler beim Parsen der Multi-Lore-Generierung:", e);
        return [];
      }
    });
  }

  static async autofillTerritory(
    text: string,
    type: string,
    worldContext?: any,
    existingTerritories?: any[],
    existingData?: any,
    loreEntries?: any[]
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      let contextPrompt = `Erstelle einen hochpräzisen, detailreichen Weltkarte-Eintrag (Territory) aus dem folgenden Text.
WICHTIGSTE DIREKTIVEN:
0. KEINE EMOJIS: Benutze KEINE Emojis in Namen oder Beschreibungen!
1. Bestimme den exakt passenden 'type' für dieses Gebiet. Gültige Typen:
   - Geografie & Gewässer: meer (Meer/Ozean), bucht (Bucht/Lagune/Küstengewässer), see (Binnensee), fluss (Fluss), kontinent (Kontinent), insel (Insel), region (Region/Provinz), zone (Zone/Sektor), welt (Weltkarte).
   - Landschaft & Biome: biome_gebirge (Gebirge/Bergmassiv), biome_vulkan (Vulkan), biome_wald (Wald/Dschungel), biome_gras (Ebene/Grasland), biome_wueste (Wüste/Ödland), biome_sumpf (Sumpf/Moor), biome_schnee (Eis/Tundra), biome_dungeon (Höhle/Gewölbe/Dungeon).
   - Siedlungen & Bauwerke: stadt (Stadt/Metropole), dorf (Dorf/Siedlung), hafen (Hafenstadt), festung (Festung/Burg), ort (Besonderer Ort/Landmarke), gebäude (Bauwerk/Monument).
   Falls z.B. nach einer Bucht (wie "Thermalbucht") gesucht wird, wähle zwingend 'bucht' oder 'see' und KEINESFALLS 'welt'! Falls es sich bei "Calm Belt" oder "Neue Welt" um Meereszonen handelt, wähle 'zone' oder 'meer'.
2. 'name' MUSS ausschließlich der kurze Name des Eintrags sein (z.B. "Thermalbucht", "Calm Belt").
3. 'description' MUSS eine packend geschriebene, detailreiche Beschreibung auf Deutsch sein (mindestens 1-2 Absätze). Nimm absolut KEINEN Bezug auf den Nutzer, den Spieler, oder dessen spezifische Charakter-Eigenschaften, Fähigkeiten oder Rassenmerkmale.
4. 'population', 'ruler', 'climate', 'culture', 'terrain', 'faction': Befülle diese Grundfelder sinnvoll oder erfinde passende Werte.
5. ERWEITERTER GEBIETS-CODEX: Befülle ZWINGEND auch die erweiterten JSON-Felder für Geografie (biome, size, borders, waters, mountains, forests), Gesellschaft (races, language, religion, livingStandard), Politik (allies, enemies, government), Wirtschaft (resources, trade, currency, exports, imports), Militär (dangerLevel, militaryStrength, defense) und Besonderheiten (landmarks, pointsOfInterest, dungeons, magicPlaces, naturalWonders).
6. Bestimme passende 'x' und 'y' Koordinaten (Ganzzahlen zwischen 10 und 90). Platziere es zwingend in einer FREIEN Zone ohne Überschneidung mit existierenden Orten.
7. PERSPEKTIVE: Beschreibe den Ort aus der neutralen Sicht eines objektiven Kartografen/Historikers.
8. KI-KARTEN-LAYOUT, HIMMELSRICHTUNGEN & ENTFERNUNGEN: Fülle 'layoutPreset', 'compassDirections', 'envNeighbours' und 'distancesToNeighbours'.

Schreibe alle Antworten auf Deutsch.`;

      let parentAndSubInfo = "";
      if (existingTerritories && existingTerritories.length > 0) {
        const parentId = existingData?.parentId;
        if (parentId) {
          const parent = existingTerritories.find((t: any) => t.id === parentId);
          if (parent) {
            parentAndSubInfo += `
### ÜBERGEORDNETES GEBIET (Dieses Gebiet ist ein Teil davon):
- Name: "${parent.name}" | Typ: "${parent.type}" | Einwohner: "${parent.population || 'Unbekannt'}" | Klima: "${parent.climate || ''}" | Terrain: "${parent.terrain || ''}" | Fraktion: "${parent.faction || ''}"
`;
          }
        }

        const currentId = existingData?.id;
        if (currentId) {
          const subs = existingTerritories.filter((t: any) => t.parentId === currentId);
          if (subs.length > 0) {
            parentAndSubInfo += `
### DIREKTE UNTERGEBIETE DIESES GEBIETS:
${subs.map((s: any) => `- Name: "${s.name}" | Typ: "${s.type}" | Einwohner: "${s.population || 'Unbekannt'}"`).join('\n')}
`;
          }
        }
      }

      if (existingData) {
        contextPrompt += `

### ERGÄNZUNGS-MODUS (MANUELLE BENUTZEREINGABEN VORHANDEN):
Der Nutzer hat bereits einige Felder manuell ausgefüllt oder vorgegeben:
${JSON.stringify(existingData, null, 2)}
STRIKTE VORGABE ZU BESTEHENDEN BENUTZEREINGABEN:
- Wenn ein Feld bereits befüllt ist, respektiere diesen Inhalt!
- Erfülle oder ergänze fehlende (leere) Felder passend zu den Vorgaben des Nutzers.
${parentAndSubInfo}`;
      } else if (parentAndSubInfo) {
        contextPrompt += `\n\n${parentAndSubInfo}`;
      }

      if (worldContext) {
        contextPrompt = `### WELTBESCHREIBUNG (Kontext):
Weltenname/Thema: "${worldContext.title || ''}" | Ton: "${worldContext.tone || ''}"
Beschreibung: "${worldContext.description || ''}"

` + contextPrompt;
      }

      if (existingTerritories && existingTerritories.length > 0) {
        contextPrompt += `\n\n### EXISTIERENDE GEBIETE AUF DER KARTE:
`;
        existingTerritories.forEach((t: any) => {
          contextPrompt += `- Name: "${t.name}" | Typ: "${t.type}" | X:${t.x}, Y:${t.y}\n`;
        });
      }

      if (loreEntries && loreEntries.length > 0) {
        const placeName = existingData?.name || text || '';
        const relevantLore = placeName.trim().length > 1 
          ? loreEntries.filter(l => JSON.stringify(l).toLowerCase().includes(placeName.toLowerCase()))
          : [];
        const entriesToUse = relevantLore.length > 0 ? relevantLore : loreEntries.slice(0, 35);

        contextPrompt += `\n\n### BESTEHENDE CODEX-EINTRÄGE IN DER WELT (Als primäre Faktenquelle nutzen!):
Nutze die folgenden Einträge aus dem Codex (Charaktere, Fraktionen, Ereignisse, Orte), um den Weltkarte-Eintrag absolut konsistent mit der bestehenden Welt zu befüllen:
${entriesToUse.slice(0, 35).map((l: any) => `- [${l.category || 'Codex'}] ${l.title || l.name}: ${l.content?.substring(0, 200) || JSON.stringify(l.details || {}).substring(0, 200)}`).join('\n')}`;
      }

      contextPrompt += `\n\n### ZU ANALYSIERENDER TEXT / SUCHBEFEHL:\n"${text}"`;

      const schema: any = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Der kurze Name des Gebiets (z. B. 'Eldoria')." },
          type: { type: Type.STRING, description: "Typ des Gebiets (meer, bucht, see, fluss, kontinent, insel, region, zone, biome_gebirge, biome_vulkan, biome_wald, biome_gras, biome_wueste, biome_sumpf, biome_schnee, biome_dungeon, ort, stadt, dorf, hafen, festung, gebäude, welt)." },
          description: { type: Type.STRING, description: "Ausführliche Beschreibung (1-2 Absätze) auf Deutsch." },
          population: { type: Type.STRING, description: "Einwohnerzahl (z. B. '50.000' oder 'Unbewohnt')." },
          ruler: { type: Type.STRING, description: "Herrscher / Anführer (z. B. 'König Alden III')." },
          climate: { type: Type.STRING, description: "Klima / Wetterbedingungen (z. B. 'Mediterran')." },
          culture: { type: Type.STRING, description: "Kultur / Gesellschaftliche Merkmale (z. B. 'Magisch und akademisch geprägt')." },
          terrain: { type: Type.STRING, description: "Terrain / Landschaft (z. B. 'Gebirgig mit Nadelwäldern')." },
          faction: { type: Type.STRING, description: "Herrschende Fraktion (z. B. 'Das Kaiserreich')." },
          x: { type: Type.INTEGER, description: "Eine Ganzzahl von 10 bis 90 für die X-Koordinate auf der Karte." },
          y: { type: Type.INTEGER, description: "Eine Ganzzahl von 10 bis 90 für die Y-Koordinate auf der Karte." },
          
          // Geografie
          biome: { type: Type.STRING, description: "Biom (z.B. 'Laubwald', 'Tundra')." },
          size: { type: Type.STRING, description: "Ungefähre Größe (z.B. 'ca. 500 km²')." },
          borders: { type: Type.STRING, description: "Angrenzende Gebiete (z.B. 'Grenzt im Norden an das Frostgebirge')." },
          waters: { type: Type.STRING, description: "Gewässer (z.B. 'Silberfluss')." },
          mountains: { type: Type.STRING, description: "Gebirge (z.B. 'Drachengrat')." },
          forests: { type: Type.STRING, description: "Wälder (z.B. 'Flüsterhain')." },

          // Gesellschaft
          races: { type: Type.STRING, description: "Vorherrschende Rassen (z.B. 'Menschen, Zwerge')." },
          language: { type: Type.STRING, description: "Sprache (z.B. 'Gemeinsprache')." },
          religion: { type: Type.STRING, description: "Religion / Glaube (z.B. 'Lichtkult')." },
          livingStandard: { type: Type.STRING, description: "Lebensstandard (z.B. 'Wohlhabend')." },

          // Politik
          allies: { type: Type.STRING, description: "Verbündete (z.B. 'Königreich Thal')." },
          enemies: { type: Type.STRING, description: "Feinde (z.B. 'Ork-Stämme')." },
          government: { type: Type.STRING, description: "Regierungsform (z.B. 'Monarchie')." },

          // Wirtschaft
          resources: { type: Type.STRING, description: "Wichtigste Ressourcen (z.B. 'Eisen, Weizen')." },
          trade: { type: Type.STRING, description: "Handel (z.B. 'Lebhafter Seehandel')." },
          currency: { type: Type.STRING, description: "Währung (z.B. 'Goldmünzen')." },
          exports: { type: Type.STRING, description: "Export (z.B. 'Stahlwaffen')." },
          imports: { type: Type.STRING, description: "Import (z.B. 'Seide, Gewürze')." },

          // Militär
          dangerLevel: { type: Type.STRING, description: "Gefahrenstufe (z.B. 'Sicher', 'Extrem hoch')." },
          militaryStrength: { type: Type.STRING, description: "Militärische Stärke (z.B. 'Starke Stadtwache')." },
          defense: { type: Type.STRING, description: "Verteidigung (z.B. 'Hohe Steinmauern')." },

          // Besonderheiten
          landmarks: { type: Type.STRING, description: "Wahrzeichen (z.B. 'Die Weiße Zitadelle')." },
          pointsOfInterest: { type: Type.STRING, description: "Sehenswürdigkeiten (z.B. 'Der fliegende Markt')." },
          dungeons: { type: Type.STRING, description: "Dungeons (z.B. 'Katakomben des Leids')." },
          magicPlaces: { type: Type.STRING, description: "Magische Orte (z.B. 'Kristallquelle')." },
          naturalWonders: { type: Type.STRING, description: "Naturwunder (z.B. 'Glühende Wasserfälle')." },

          // Karten-Vorgaben
          layoutPreset: { type: Type.STRING, description: "Karten-Layout (hafenbucht, insel_dorf, gebirgspass, waldlichtung, festung_zitadelle, freie_ebene, archipel, dungeon, keins)." },
          compassDirections: { type: Type.STRING, description: "Himmelsrichtungen (z.B. 'Norden: Hafen, Osten: Vulkan')." },
          envNeighbours: { type: Type.STRING, description: "Unmittelbare Umgebung (z.B. 'Umgeben von steilen Felswänden, ein kleiner Fluss fließt mittig.')." },
          distancesToNeighbours: { type: Type.STRING, description: "Reisedistanzen zu Nachbargebieten (z.B. '1 Tagesreise zum Hafen, 3 Stunden zum Gebirge')." }
        },
        required: ["name", "type", "description"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
        model: 'gemini-3.8-flash',
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
        model: 'gemini-3.8-flash',
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

  static async generatePlacesFromEvents(
    eventSteps: any[],
    existingPlaces: any[],
    world: any
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      
      const prompt = `Du bist ein Welt-Karten-Designer für ein RPG. Dir liegt eine chronologische Liste von Story-Stationen (Events/Timeline) einer Kampagne vor.
Deine Aufgabe ist es, zu analysieren, welche Orte (Macro-Ebene, Meso-Ebene, Micro-Ebene) diese Story-Stationen einführen oder benötigen, um den Weg, den der Nutzer gehen wird, geografisch auf der Weltkarte abzubilden und auszufüllen.

GEPLANTE STORY-STATIONEN DER KAMPAGNE:
${JSON.stringify(eventSteps, null, 2)}

BEREITS EXISTIERENDE ORTE (WELTKARTE):
${JSON.stringify(existingPlaces.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        mapLevel: p.details?.mapLevel,
        parentPlaceId: p.details?.parentPlaceId,
        coordinates: p.details?.coordinates,
        associatedEventStepId: p.details?.associatedEventStepId
      })), null, 2)}

WELTKONTEXT (STRENGSTENS BEACHTEN FÜR NAMENSGEBUNG, GENRE, ATMOSPHÄRE & DESIGN):
- Welttitel: "${world?.title || ''}"
- Weltbeschreibung: "${world?.description || ''}"
- Epoche / Genres / Tags: "${world?.era || ''}"
- Tonalität / Atmosphäre: "${world?.tone || ''}"

AUFGABENSTELLUNG & REGELN:
1. STRENGSTE GENRE- UND ATMOSPHÄRENKONFORMITÄT: 
   Alle generierten Orte, Bezeichnungen, Beschreibungen, Typen und Wahrzeichen MÜSSEN sich absolut treu nach der Weltbeschreibung, den Genres/Tags (z.B. Sci-Fi, Cyberpunk, Dark Fantasy, Post-Apokalypse, JRPG, Steampunk etc.) und der Tonalität richten. Verwende charakteristische, stimmungsvolle Namen und reichhaltige Vokabeln, die dieses Genre untermauern.

2. LOGISCHE ZWISCHENSTATIONEN (REISE-WEGPUNKTE):
   Ein kontinuierlicher Reiseweg benötigt stimmungsvolle Zwischenstationen! Generiere zusätzlich zu den Haupt-Story-Orten auch logische Zwischenstationen (z.B. ein einsamer Bergpass, ein bewachter Grenzposten, eine abgelegene Raststätte, ein verlassener Außenposten, eine uralte Brücke, eine Oase, ein Lagerplatz am Flussufer etc.) zwischen chronologisch benachbarten Story-Orten.
   - Diese Zwischenstationen dienen als Reiseknotenpunkte auf der Weltkarte, um die geografischen Distanzen auszufüllen.
   - Platziere sie geografisch (X- und Y-Koordinaten) genau auf dem Pfad zwischen den beiden Haupt-Orten, um eine lückenlose, wunderbare Reiseroute zu zeichnen.
   - Beschreibe sie als faszinierende Durchgangs- oder Erholungsorte im Stil der Spielwelt.

3. DREI KARTENEBENEN:
   Ordne jeden Ort einer passenden Ebene zu:
   - Macro-Ebene ('macro'): Große Königreiche, Kontinente, Weltmeere, Sektoren, Imperien.
   - Meso-Ebene ('meso'): Städte, Dörfer, Wälder, Dungeons, Regionen, sowie deine neu generierten Zwischenstationen/Landschafts-Passagen.
   - Micro-Ebene ('micro'): Lokale Points of Interest innerhalb der Meso-Orte (z.B. eine Taverne, ein Gildenhaus, ein Altar, ein Labor, ein Händlerladen etc.).

4. GEOGRAFISCHE SCHACHTELUNG (parentPlaceId):
   Setze 'parentPlaceId' auf den TITEL des direkt übergeordneten Ortes.
   - Ein Micro-Ort (z.B. Taverne) hat einen Meso-Ort (z.B. die Stadt) als parentPlaceId.
   - Ein Meso-Ort (z.B. die Stadt oder ein Zwischenstopp in einer Region) hat einen Macro-Ort (z.B. das Königreich oder den Sektor) als parentPlaceId.
   - Ein Macro-Ort hat leeres oder kein 'parentPlaceId' (bzw. "").

5. KOORDINATEN & SEQUENCE-PATHING:
   - Bestimme X- und Y-Koordinaten (jeweils 0 bis 100) auf der interaktiven Node-Map.
   - Die Koordinaten müssen so gewählt sein, dass die Haupt-Orte und ihre Zwischenstationen einen flüssigen, sequentiellen, ästhetisch ansprechenden Pfad bilden, der der Chronologie der Story-Stationen folgt. Sie dürfen nicht chaotisch verstreut sein.
   - Vermeide unbedingt, dass Orte exakt auf denselben Koordinaten liegen (mindestens 5-10 Einheiten Abstand).

6. STORY-VERKNÜPFUNG:
   - Für Haupt-Orte, die direkt einer Story-Station zugeordnet sind: Trage im detail-Feld "associatedEventStepId" die "id" des jeweiligen Event-Schritts ein.
   - For Zwischenstationen: Du kannst "associatedEventStepId" leer lassen oder auf die ID des nachfolgenden Haupt-Events setzen, um anzuzeigen, dass man diesen Ort auf dem Weg zu jenem Event durchquert.

7. DETAILREICHE AUSFÜLLUNG:
   Fülle alle details-Felder absolut detailreich, immersiv und vollständig auf Deutsch aus:
   - Für 'macro': ruler (Herrscher/Fraktion), government (Regierungsform), population (Einwohnerzahl/Demografie), culture (Kultur/Fokus), currency (Währung).
   - Für 'meso': localLeader (Anführer vor Ort), dangerLevel (Gefahrenstufe), economicFocus (Wirtschaftlicher Fokus), localReputation (Ruf/Gesinnung).
   - Für 'micro': owner (Besitzer/Wirt/Verwalter), capacity (Kapazität/Betriebsamkeit).
   - Sowie allgemeine Felder: type (Ortstyp wie Stadt, Wald, Taverne, etc.), climate (Klima/Atmosphäre), landmarks (Besonderheiten).

8. BEHALTEN & AKTUALISIEREN:
   Wenn ein Ort bereits existiert (Abgleich über Namen/Titel), behalte seine ID und seine Koordinaten/Bedingungen bei, aktualisiere/ergänze jedoch seine Details, um mit der neuesten Story und Weltkonsistenz übereinzustimmen.

Gib das Ergebnis streng im geforderten JSON-Format zurück, bestehend aus einer Liste aller benötigten Orte (existierende, neu generierte Hauptorte und atmosphärische Zwischenstationen).`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          places: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Die ID des Ortes. Behalte bei existierenden Orten ihre ID bei, ansonsten generiere eine neue eindeutige ID." },
                title: { type: Type.STRING, description: "Der Name des Ortes." },
                description: { type: Type.STRING, description: "Eine detaillierte Beschreibung des Ortes (1-2 Absätze)." },
                category: { type: Type.STRING, description: "Muss 'Orte' sein." },
                isUnlocked: { type: Type.BOOLEAN, description: "Ob der Ort standardmäßig freigeschaltet ist." },
                details: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Typ des Ortes, z.B. 'Königreich', 'Stadt', 'Wald', 'Taverne'." },
                    climate: { type: Type.STRING, description: "Klima und Atmosphäre." },
                    landmarks: { type: Type.STRING, description: "Interessante Landmarken oder Sehenswürdigkeiten." },
                    mapLevel: { type: Type.STRING, description: "Muss 'macro', 'meso' oder 'micro' sein." },
                    parentPlaceId: { type: Type.STRING, description: "Der Name (Titel) des übergeordneten Ortes." },
                    terrainTile: {
                      type: Type.STRING,
                      description: "Das passende Gelände-Symbol. Muss einer dieser 10 vordefinierten Strings sein: 'flüssigkeit', 'hitze', 'kälte', 'natur_dicht', 'natur_offen', 'trockenheit', 'fels', 'struktur', 'untergrund', 'ungewissheit'."
                    },
                    associatedEventStepId: { type: Type.STRING, description: "Die ID der Story-Station (des Event-Schritts), die mit diesem Ort verknüpft ist." },
                    
                    // Macro-Ebene
                    ruler: { type: Type.STRING, description: "Nur für macro: Herrscher / Fraktion" },
                    government: { type: Type.STRING, description: "Nur für macro: Regierungsform / System" },
                    population: { type: Type.STRING, description: "Nur für macro: Einwohnerzahl & Demografie" },
                    culture: { type: Type.STRING, description: "Nur für macro: Kultur & Gesellschaftlicher Fokus" },
                    currency: { type: Type.STRING, description: "Nur für macro: Währung" },
                    
                    // Meso-Ebene
                    localLeader: { type: Type.STRING, description: "Nur für meso: Lokale Autorität / Anführer vor Ort" },
                    dangerLevel: { type: Type.STRING, description: "Nur für meso: Sicherheits- & Gefahrenstufe" },
                    economicFocus: { type: Type.STRING, description: "Nur für meso: Wirtschaftlicher Fokus / Primäre Ressource" },
                    localReputation: { type: Type.STRING, description: "Nur für meso: Lokaler Ruf / Gesinnung" },
                    
                    // Micro-Ebene
                    owner: { type: Type.STRING, description: "Nur für micro: Besitzer / Verwalter des Ortes" },
                    capacity: { type: Type.STRING, description: "Nur für micro: Kapazität / Betriebsamkeit" },
                    
                    coordinates: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.INTEGER, description: "X-Koordinate (0-100)" },
                        y: { type: Type.INTEGER, description: "Y-Koordinate (0-100)" }
                      },
                      required: ["x", "y"]
                    }
                  },
                  required: ["type", "climate", "landmarks", "mapLevel", "coordinates", "terrainTile"]
                },
                secretsStage1: { type: Type.STRING, description: "Stufe 1 Wissen." },
                secretsStage2: { type: Type.STRING, description: "Stufe 2 Wissen." },
                secretsStage3: { type: Type.STRING, description: "Stufe 3 Wissen." }
              },
              required: ["title", "description", "category", "isUnlocked", "details", "secretsStage1", "secretsStage2", "secretsStage3"]
            }
          }
        },
        required: ["places"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          safetySettings: world?.isNsfw ? this.getSafetySettings() : undefined
        }
      });

      return this.parseJSONSafely(response.text || '{}', { places: [] });
    });
  }

  private static lastChronicleTime = 0;
  private static lastLoreTime = 0;

  static async extractChronicle(prologue: string, currentChronicle: string, recentMessages: ChatMessage[], isNsfw?: boolean): Promise<string> {
    const now = Date.now();
    if (now - this.lastChronicleTime < 45000) {
      return currentChronicle || '';
    }
    this.lastChronicleTime = now;
    try {
      return await this.callWithRetry(async () => {
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
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            safetySettings: isNsfw ? this.getSafetySettings() : undefined
          }
        });

        return (response.text || '').trim();
      }, 2, 1000);
    } catch (err: any) {
      console.warn("[Gemini Background Chronicle] Optional extraction skipped:", err?.message || err);
      return currentChronicle || '';
    }
  }

  static async extractNewLoreEntries(
    recentMessages: ChatMessage[],
    existingLore: LoreEntry[],
    isNsfw?: boolean
  ): Promise<any[]> {
    const now = Date.now();
    if (now - this.lastLoreTime < 45000) {
      return [];
    }
    this.lastLoreTime = now;
    try {
      return await this.callWithRetry(async () => {
        const ai = this.getAI();
        
        const existingTitles = existingLore.map(l => `${l.category}: ${l.title}`).join('\n');
        const existingPlacesInfo = existingLore
          .filter(l => (l.category as string) === 'Orte' || (l.category as string) === 'Weltkarte')
          .map(p => `- Ort: "${p.title}" | Ebene: ${p.details?.mapLevel || 'Unbekannt'} | Parent: "${p.details?.parentPlaceId || ''}" | Koordinaten: x=${p.details?.coordinates?.x || 0}, y=${p.details?.coordinates?.y || 0}`)
          .join('\n');
        
        const prompt = `Analysiere die folgenden jüngsten Chat-Nachrichten eines Rollenspiels und vergleiche die darin erwähnten Elemente (Charaktere, Orte/Gebiete, Fraktionen, Gegenstände, Verbotenes Wissen, Gegner, Weltregeln) mit der Liste der bereits existierenden Einträge im Codex.
        
Falls neue Elemente eingeführt, erwähnt oder benannt wurden, die NICHT in der Liste der existierenden Titel stehen (oder eine Variante davon sind), erstelle für jedes neue Element einen passenden Eintrag für unsere Lore-Datenbank (Codex).
Gegenstände, die der Spieler erhält oder besitzt, sollten der Kategorie 'Gegenstände' zugeordnet werden. Neue wichtige Gebiete, Städte, Inseln oder Orte der Kategorie 'Weltkarte'. Neue wichtige Personen der Kategorie 'Charaktere'. Monster oder Feinde der Kategorie 'Gegner'. Fraktionen der Kategorie 'Fraktionen'. Geheimnisse, verbotene Wahrheiten oder Spoiler der Kategorie 'Verbotenes Wissen'.

### WICHTIG FÜR NEUE ORTE & GEBIETE (KATEGORIE 'Weltkarte'):
Wenn du einen neuen Ort erstellst, musst du im Feld "details" zwingend vollständige Kartendetails mitsenden, damit dieses Gebiet sofort korrekt auf der Weltkarte verzeichnet wird:
1. "mapLevel": Die Zoom-Ebene. Muss exakt "macro" (Königreich/Ozean/Weltkarte), "meso" (Stadt/Region/Wald/Dungeon) oder "micro" (Taverne/Gilde/Shop innerhalb einer Stadt) sein.
2. "parentPlaceId": Der Name (Titel) des übergeordneten Ortes (z.B. "Eldoria" als Meso-Stadt für eine Micro-Taverne). Bei "macro" leer lassen ("").
3. "coordinates": Ein Objekt {"x": Zahl, "y": Zahl}. Beide Werte müssen Ganzzahlen zwischen 0 und 100 sein. Wähle die Koordinaten so, dass sie thematisch passen, aber NICHT exakt auf existierenden Orten liegen (mindestens 5-10 Einheiten Abstand!).
4. "terrainTile": Das am besten passende visuelle Gelände-Symbol aus unserer Kachel-Bibliothek. Muss exakt einer dieser 10 Strings sein:
   - "flüssigkeit" (für Ozeane, Seen, Meere, Flüsse, Häfen, Strände, Inseln)
   - "hitze" (für Vulkane, Magma, Wüstenhitze, Schmieden, Feuertempel)
   - "kälte" (für Gletscher, Eis, Schnee, Frost-Ebenen, kalte Bergspitzen)
   - "natur_dicht" (für Wälder, Urwälder, Dschungel, Sümpfe, dichte Gehölze)
   - "natur_offen" (für Wiesen, Felder, Weiden, Ebenen, Lichtungen, Gärten)
   - "trockenheit" (für Sandwüsten, Steppen, felsige Ödländer, trockene Canyons)
   - "fels" (für Hochgebirge, Klippen, Klettersteige, Bergpässe, Schluchten)
   - "struktur" (für Städte, Siedlungen, Burgen, Ruinen, Festungen, Straßen)
   - "untergrund" (für Höhlen, Tunnel, Minen, Katakomben, Keller)
   - "ungewissheit" (für Nebel, Rauch, Portale, magische Anomalien, Dimensionen)
5. "type": Typ des Ortes (z.B. "Taverne", "Stadt", "Bergpass", "Wald", "Königreich").
6. "climate": Klima und Atmosphäre (z.B. "Feucht und modrig", "Warm und sonnig").
7. "landmarks": Besondere Landmarken oder Merkmale (z.B. "Ein uraltes Stadttor").

### STRENGE FILTER-RICHTLINIEN (UM ZU VIELE EINTRÄGE ZU VERMEIDEN - SELEKTIVER CODEX):
1. SEHR HOHE RELEVANZ-SCHWELLE: Erstelle NUR Einträge für wirklich bedeutsame, dauerhafte Elemente, die eine zentrale Rolle im Abenteuer spielen!
2. KEINE FLÜCHTIGEN ODER TRIVIALEN ERWÄHNUNGEN: Wenn ein Ort nur im Vorbeigehen genannt wird (z. B. "er läuft über den Flur", "sie blickt aus dem Fenster", "er geht in die Küche"), ein Charakter nur ein namenloser Statist ist (z. B. "der Lehrer", "ein Polizist", "die Schüler") oder ein Gegenstand ein alltäglicher Gebrauchsgegenstand ist (z. B. "ein Stift", "das Mathebuch", "die Schultasche", "eine Tasse Kaffee"), darfst du dafür KEINEN Eintrag anlegen!
3. KEINE GEWÖHNLICHEN ALLTAGSDINGE: Nur legendäre, magische, technologisch hochentwickelte oder handlungsentscheidende Gegenstände erhalten einen Eintrag.
4. EINZELNE PERSONEN & SPEZIFISCHE ORTE: Nur namentlich genannte oder für die Story essenzielle Charaktere/Orte erhalten einen Eintrag.
5. KLEIDUNG & OUTFITS (MANDATORY): Erstelle NIEMALS separate Einträge für einzelne Kleidungsstücke (wie "Kochhemd", "Schürze", "Stiefel", "Nachthemd", "Hose") oder Platzhalter-Zustände (wie "barfuß", "keine Kopfbedeckung", "keine"). Wenn der Spieler oder ein Charakter Kleidung erhält oder trägt, fasse alle Kleidungsstücke IMMER direkt zu EINEM EINZIGEN zusammenhängenden Outfit-Eintrag zusammen (z.B. "Kochkluft (Kochhemd, Lederschürze, Arbeitsstiefel)").
6. Im Zweifelsfall erstelle KEINEN Eintrag. Antworte lieber mit einem leeren Array [], anstatt flüchtige Details zu erfassen!

Bestehende Codex-Einträge (Format: Kategorie: Name):
${existingTitles || '(Keine bisherigen Einträge vorhanden)'}

Bestehende Orte auf der Karte (und deren Ebenen/Koordinaten):
${existingPlacesInfo || '(Keine bisherigen Orte vorhanden)'}

Jüngste Nachrichten:
${recentMessages.map(m => `${m.role === 'user' ? 'Spieler' : 'DM'}: ${m.text}`).join('\n\n')}

Gib das Ergebnis als ein valides JSON-Array von Objekten aus. Jedes Objekt muss folgende Struktur haben:
[
  {
    "category": "Charaktere" | "Weltkarte" | "Fraktionen" | "Gegenstände" | "Verbotenes Wissen" | "Story & Quests" | "Weltregeln" | "Gegner" | "Zeitlinie",
    "title": "Name des Elements",
    "description": "Eine passende, kurze, atmosphärische Beschreibung auf Deutsch basierend auf dem Chat-Kontext",
    "details": {
      // Nur befüllen, wenn category === "Weltkarte" oder "Orte". Bei anderen Kategorien {} oder weglassen.
      "mapLevel": "macro" | "meso" | "micro",
      "parentPlaceId": "Titel des übergeordneten Ortes",
      "coordinates": { "x": 50, "y": 45 },
      "terrainTile": "flüssigkeit" | "hitze" | "kälte" | "natur_dicht" | "natur_offen" | "trockenheit" | "fels" | "struktur" | "untergrund" | "ungewissheit",
      "type": "Ortstyp",
      "climate": "Klima",
      "landmarks": "Sehenswürdigkeiten"
    }
  }
]
WICHTIG: Antworte AUSSCHLIESSLICH mit dem validen JSON-Array. Keine Einleitung, kein Outro, kein Markdown wie \`\`\`json oder \`\`\`. Wenn keine neuen Elemente gefunden werden, antworte mit einem leeren Array: []`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            safetySettings: isNsfw ? this.getSafetySettings() : undefined
          }
        });

        const text = (response.text || '').trim();
        if (!text || text === '[]') return [];
        
        try {
          const parsed = this.parseJSONSafely(text, []);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          return [];
        } catch (e) {
          console.warn("Fehler beim Parsen der extrahierten Lore-Einträge:", e);
          return [];
        }
      }, 2, 1000);
    } catch (err: any) {
      console.warn("[Gemini Background Lore] Optional extraction skipped:", err?.message || err);
      return [];
    }
  }

  static async harmonizeWorldWithSecrets(
    world: any,
    prologue: string,
    firstMessage: string,
    npcs: any[],
    loreDatabase: any[],
    isNsfw?: boolean
  ): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();

      const secrets = loreDatabase.filter(l => l.category === 'Verbotenes Wissen' || (l.category as string) === 'Geheimnisse & Verborgenes Wissen' || (l.category as string) === 'Verhüllung');
      if (secrets.length === 0) {
        return {
          worldDescription: world.description,
          prologue,
          firstMessage,
          npcs: npcs.map(n => ({ id: n.id, bio: n.bio, currentSituation: n.currentSituation, relationship: n.relationship, conduct: n.conduct })),
          loreDatabase: loreDatabase.map(l => ({ id: l.id, title: l.title, description: l.description }))
        };
      }

      const secretsText = secrets.map(s => {
        const details = s.details || {};
        return `- Geheimnis/Fakt: "${s.title}"\n  Beschreibung: ${s.description}\n  Stufe: ${details.confidentiality || 'Geheim'}\n  Enthüllungstrigger: ${details.revealTrigger || 'Unbekannt'}\n  KI-Anweisung: ${details.aiSecretInstruction || ''}`;
      }).join('\n\n');

      const npcsText = npcs.map(n => `- Name: ${n.name}\n  Bio: ${n.bio}\n  Situation: ${n.currentSituation || ''}\n  Beziehung: ${n.relationship || ''}\n  Verhaltensmuster: ${n.conduct || ''}`).join('\n\n');

      const loreText = loreDatabase.filter(l => l.category !== 'Verbotenes Wissen').map(l => `- Name: ${l.title} (${l.category})\n  Beschreibung: ${l.description}`).join('\n\n');

      const prompt = `Du bist ein erfahrener Rollenspiel-Designer und Konsistenz-Experte.
Deine Aufgabe ist es, die gesamte Spielwelt (Welten-Beschreibung, Prolog, Spielstart, NPC-Biografien und andere Lore-Codex-Einträge) auf absolute Konsistenz mit dem definierten 'Verbotenen Wissen' (Geheimnisse) zu prüfen und anzupassen.

Hier ist das definierte VERBOTENE WISSEN (Geheimnisse), das NIEMALS unaufgefordert gespoilert, verraten oder unpassend angedeutet werden darf, bis die jeweiligen Enthüllungstrigger erfüllt sind:
${secretsText}

Hier sind die aktuellen Daten, die du prüfen, bereinigen und anpassen musst:

1. WELTEN-BESCHREIBUNG:
"${world.description || ''}"

2. PROLOG (Vorgeschichte):
"${prologue || ''}"

3. SPIELSTART / ERSTE SZENE (firstMessage):
"${firstMessage || ''}"

4. NPCs (Nicht-Spieler-Charaktere):
${npcsText || '(Keine NPCs definiert)'}

5. ANDERE LORE-CODEX-EINTRÄGE:
${loreText || '(Keine anderen Einträge definiert)'}

MANDATE & REGELN FÜR DIE ANPASSUNG:
1. SPOILER-REINIGUNG: Durchsuche alle Texte (Welten-Beschreibung, Prolog, Spielstart, NPC-Bios, andere Lore-Einträge) nach Erwähnungen, Spoilern oder Leaks des oben genannten 'Verbotenen Wissens'. Falls ein Geheimnis dort vorab ausgeplaudert oder zu offensichtlich verraten wird, formuliere oder schwäche die Stelle so ab, dass das Geheimnis bewahrt bleibt, aber die Atmosphäre erhalten bleibt.
2. STORY-KONSISTENZ: Stelle sicher, dass die Hintergrund-Bios der NPCs und andere Lore-Einträge mit den verbotenen Geheimnissen im Einklang stehen. Sie dürfen dem verbotenen Wissen nicht widersprechen, sondern müssen sich logisch und unauffällig daran anschließen.
3. BEHALTE ALLE INFOS: Keine unbeteiligten Details des Nutzers dürfen gelöscht werden. Ändere die Texte NUR da, wo es nötig ist, um Geheimhaltung und Konsistenz zu wahren.

Gib das Ergebnis als valides JSON-Objekt zurück mit genau dieser Struktur:
{
  "worldDescription": "Die angepasste Welten-Beschreibung auf Deutsch",
  "prologue": "Der angepasste Prolog auf Deutsch",
  "firstMessage": "Der angepasste Spielstart auf Deutsch",
  "npcs": [
    {
      "name": "Name des NPCs",
      "bio": "Die angepasste Bio auf Deutsch",
      "currentSituation": "Die angepasste Situation auf Deutsch",
      "relationship": "Die angepasste Beziehung",
      "conduct": "Das angepasste Verhaltensmuster"
    }
  ],
  "loreDatabase": [
    {
      "title": "Titel des Lore-Eintrags",
      "description": "Die angepasste Beschreibung auf Deutsch"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          safetySettings: isNsfw ? this.getSafetySettings() : undefined
        }
      });

      const text = (response.text || '').trim();
      if (!text) {
        throw new Error("Leere Rückgabe von Gemini beim Konsistenz-Scan");
      }

      const parsed = this.parseJSONSafely(text, null);
      if (!parsed) {
        throw new Error("Fehler beim Parsen der konsistenten Weltdaten.");
      }
      return parsed;
    });
  }

  static async generateLinkedWorldEntities(params: {
    userPrompt: string;
    world: any;
    loreDatabase: any[];
    isNsfw?: boolean;
    source?: 'worldmap' | 'codex' | 'economy';
    targetTerritoryId?: string | null;
    targetLoreEntryId?: string | null;
    targetHoldingId?: string | null;
  }): Promise<{ updatedWorld: any; updatedLoreDatabase: any[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const world = params.world;
      const loreDatabase = params.loreDatabase || [];
      const territories = world.territories || [];
      const holdings = world.economyConfig?.holdings || [];

      // 1. Compile concise lists of existing entities for the model
      const territoriesList = territories.map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        parentId: t.parentId,
        population: t.population,
        ruler: t.ruler,
        faction: t.faction
      }));

      const loreList = loreDatabase.map((l: any) => ({
        id: l.id,
        title: l.title,
        category: l.category,
        faction: l.details?.faction || l.details?.alliance || '',
        parentPlaceId: l.details?.parentPlaceId || ''
      }));

      const holdingsList = holdings.map((h: any) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        locationName: h.locationName,
        assignedCharacterId: h.assignedCharacterId,
        assignedCharacterName: h.assignedCharacterName
      }));

      const prompt = `Du bist ein genialer Weltenbauer-Algorithmus (Master RPG Engine) für ein vollvernetztes Rollenspiel-System.
In unserem System sind die drei Hauptpfeiler nahtlos miteinander verknüpft:
1. GEOGRAFIE & LANDKARTEN-GEBIETE (Territories - Makroflächen, Inseln, Siedlungen, Landmarken/POIs)
2. DER CODEX / DIE LORE-DATENBANK (LoreEntries - NPCs/Charaktere, Fraktionen, einzigartige Orte, seltene Items, Kampagnen-Ereignisse)
3. WIRTSCHAFTS- & MANAGEMENT-BETRIEBE (EconomyHoldings - Tavernen, Schmieden, Bäckereien, Märkte, Händler, Bergwerke, Handelsschiffe, etc.)

STRENGE TAXONOMIE & TYP-TRENNUNG (UNBEDINGT EINHALTEN):
A. GEOGRAFISCHE FLÄCHEN (Territory.type: 'welt', 'meer', 'ozean', 'kontinent', 'insel', 'region', 'zone', 'bucht', 'see', 'fluss'):
   - Dies sind rein physisch-räumliche Großstrukturen auf der Weltkarte.
   - Die 'parentId' verweist STRENG auf das räumlich übergeordnete Gebiet (z.B. Insel liegt im Ozean, Region liegt auf Kontinent).
   - NIEMALS eine Fraktion oder ein politisches Bündnis als 'parentId' setzen!

B. SIEDLUNGEN (Territory.type: 'stadt', 'dorf', 'hafen'):
   - Typ: 'stadt' oder 'dorf' oder 'hafen'.
   - 'settlementType': Eines aus ['hauptstadt', 'grossstadt', 'stadt', 'kleinstadt', 'dorf', 'hafenstadt'].
   - 'controlledByFactionId': ID der Fraktion, die die Stadt politisch beherrscht.
   - 'parentId': ID der Region/Insel, in der die Siedlung physisch liegt.

C. LANDMARKEN & POIs (Territory.type: 'ort', 'festung', 'gebäude'):
   - Typ: 'ort' oder 'festung' oder 'gebäude'.
   - 'poiType': Eines aus ['festung', 'burg', 'ruine', 'turm', 'tempel', 'hoehle', 'leuchtturm', 'bruecke', 'tor', 'mine', 'ort', 'gebaeude'].
   - 'parentId': ID der Siedlung, Region oder Insel, in der dieser POI liegt.

D. WIRTSCHAFTSBETRIEBE (EconomyHoldings - ZWINGEND in 'upsertHoldings', NIEMALS als Territory!):
   - Tavernen, Schmieden, Bäckereien, Märkte, Händlerläden, Gasthäuser, Sägewerke, Werften, Hafenbetriebe, Manufakturen, Alchemieläden, Mühlen, Werkstätten etc. SIND KEINE GEOGRAPHISCHEN TERRITORIES!
   - Erstelle für solche Betriebe IMMER ein Element in 'upsertHoldings'.
   - Setze 'territoryId' auf die ID der Stadt/des Ortes, in der der Betrieb steht.
   - Setze 'assignedCharacterId' auf die ID des NPCs, der den Betrieb führt (falls vorhanden).

E. ENTITY RESOLUTION & VERKNÜPFUNG:
   - Erkenne bestehende Entitäten per ID und erfinde keine Duplikate.
   - Wenn der Nutzer z.B. sagt "In Silberhafen betreibt Karin die Taverne Zum Seebären":
     * Silberhafen = Territory (type: 'stadt', settlementType: 'hafenstadt')
     * Karin = LoreEntry (category: 'Charaktere', role: 'Wirtin')
     * Zum Seebären = EconomyHolding (type: 'taverne', territoryId: [Silberhafen-ID], assignedCharacterId: [Karin-ID], locationName: 'Silberhafen')

F. FRAKTIONEN-SYNCHRONISATION (WICHTIG!):
   - Wenn eine Fraktion (z.B. Gilde, Kult, Königreich) involviert ist, MUSS sie über alle 3 Systeme synchron sein:
     1. CODEX (upsertLoreEntries): Erstelle/Update einen Eintrag mit category 'Fraktionen'. Setze in "details" Felder wie "currentGoal", "headquarters", "members" (Array von Mitgliedern).
     2. WELTKARTE (upsertTerritories): Setze bei zugehörigen Gebieten unbedingt "controlledByFactionId" auf die Fraktions-ID und "faction" auf den Fraktionsnamen.
     3. WIRTSCHAFT & MANAGEMENT (upsertHoldings): Setze bei fraktionseigenen Betrieben "ownerType" auf "faction", "ownerFactionId" auf die Fraktions-ID und "ownerFactionName" auf den Fraktionsnamen. Setze "controlledByFactionId" und "controlledByFactionName", falls eine andere Fraktion die Kontrolle ausübt.

NUTZER-ANWEISUNG / PROMPT:
"${params.userPrompt}"

KONTEXT DER BESTEHENDEN WELT:
- Welten-Titel: "${world.title || 'Unbenannt'}"
- Genres: ${(world.genres || []).join(', ')}
- Welten-Beschreibung: "${world.description || 'Keine Beschreibung'}"

BESTEHENDE GEOGRAPHISCHE GEBIETE (KARTENELEMENTE):
${JSON.stringify(territoriesList, null, 2)}

BESTEHENDE KODEX-EINTRÄGE (LORE-DATENBANK):
${JSON.stringify(loreList, null, 2)}

BESTEHENDE WIRTSCHAFTSBETRIEBE (HOLDINGS):
${JSON.stringify(holdingsList, null, 2)}

FORMATIERUNGS-REGELN FÜR DIE AUSGABE:
Gib ausschließlich valides JSON mit folgenden vier Listen zurück:
1. "upsertTerritories": Liste von Gebieten, die neu erstellt oder aktualisiert werden sollen.
   Jedes Element MUSS folgende Struktur haben:
   {
     "id": "bestehende-ID-oder-temp-ID",
     "parentId": "übergeordnete-geografische-ID-oder-null",
     "controlledByFactionId": "politische-fraktions-ID-oder-null",
     "name": "Name des Gebietes",
     "type": "Eines aus: ['welt', 'meer', 'kontinent', 'insel', 'region', 'zone', 'stadt', 'dorf', 'hafen', 'festung', 'ort', 'gebäude', 'fluss', 'see']",
     "settlementType": "Nur bei stadt/dorf/hafen: 'hauptstadt' | 'grossstadt' | 'stadt' | 'kleinstadt' | 'dorf' | 'hafenstadt'",
     "poiType": "Nur bei ort/festung/gebäude: 'festung' | 'burg' | 'ruine' | 'turm' | 'tempel' | 'hoehle' | 'leuchtturm' | 'bruecke' | 'tor' | 'mine' | 'ort' | 'gebaeude'",
     "description": "Detaillierte atmosphärische Beschreibung auf Deutsch...",
     "spatialRelation": {
       "fromId": "Referenzort-ID (z.B. aus der Liste der bestehenden Gebiete)",
       "direction": "south", // 'north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'
       "distanceKm": 500 // Entfernung in Kilometern
     },
     "x": 120, // Nur angeben falls bekannte oder fixe Koordinate. spatialRelation ist für neue Gebiete bevorzugt.
     "y": 70,
     "population": "z.B. '4.500 Einwohner'",
     "ruler": "Name des Herrschers/Leiters",
     "faction": "Zugehörige Fraktion",
     "climate": "z.B. Gemäßigt",
     "terrain": "z.B. Hügelland",
     "biome": "z.B. biome_wald",
     "resources": "z.B. Holz, Fisch",
     "trade": "z.B. Florierend",
     "exports": "Exportgüter",
     "imports": "Importgüter",
     "militaryStrength": "Stärke",
     "defense": "Verteidigung",
     "dangerLevel": "z.B. Sicher"
   }

2. "upsertLoreEntries": Liste von Codex-Einträgen, die neu erstellt oder aktualisiert werden sollen.
   Jedes Element MUSS folgende Struktur haben:
   {
     "id": "bestehende-ID-oder-temp-ID",
     "category": "Eines aus: ['Charaktere', 'Orte', 'Fraktionen', 'Gegenstände', 'Verbotenes Wissen', 'Story & Quests', 'Events', 'Gegner', 'Weltregeln']",
     "title": "Name/Titel des Eintrags",
     "description": "Fesselnde Hintergrundgeschichte auf Deutsch (1-2 Absätze)...",
     "details": {
       "role": "Rolle/Beruf",
       "faction": "Fraktionsname",
       "height": "z.B. '180 cm'",
       "age": "z.B. '34 Jahre'",
       "gender": "Geschlecht",
       "personalityArchetype": "Archetyp",
       "goal": "Hauptziel des NPCs",
       "skills": "Beschreibung der Fähigkeiten",
       "powerSource": "Quelle der Macht",
       "powerCost": "Grenzen/Kosten",
       "techniques": "Kommagetrennte Liste der Techniknamen",
       "techniqueList": [
         { "name": "Technik 1", "description": "Effektbeschreibung" }
       ],
       "personalityTraits": {},
       "mapLevel": "Eines aus: ['macro', 'meso', 'micro']",
       "parentPlaceId": "Zugehöriger Ort Name",
       "type": "Ortstyp (z.B. Taverne, Gilde, Schloss)",
       "owner": "Name des Besitzers",
       "capacity": "Kapazität",
       "coordinates": { "x": 50, "y": 50 }
     },
     "secretsStage1": "Geheimnis Stufe 1",
     "secretsStage2": "Geheimnis Stufe 2",
     "secretsStage3": "Geheimnis Stufe 3"
   }

3. "upsertHoldings": Liste von Wirtschaftsbetrieben, die neu erstellt oder aktualisiert werden sollen.
   Jedes Element MUSS folgende Struktur haben:
   {
     "id": "bestehende-ID-oder-temp-ID",
     "name": "Name des Betriebs (z.B. 'Taverne Zum Seebären', 'Waffenschmiede Eisenfaust')",
     "type": "Eines aus: ['taverne', 'schmiede', 'baeckerei', 'markt', 'haendler', 'gasthaus', 'mine', 'bauernhof', 'saegewerk', 'werft', 'hafenbetrieb', 'manufaktur', 'magierladen', 'anwesen', 'schloss', 'koenigreich', 'schiff', 'werkstatt', 'gilde', 'custom']",
     "icon": "Passendes Icon-Symbol",
     "description": "Kurze Beschreibung des Betriebs (20-40 Wörter)...",
     "level": 1,
     "ownerType": "Eines aus: ['user', 'character', 'faction']",
     "ownerFactionId": "Fraktions-ID (falls ownerType = faction)",
     "ownerFactionName": "Fraktionsname (falls ownerType = faction)",
     "controlledByFactionId": "ID der kontrollierenden Fraktion",
     "controlledByFactionName": "Name der kontrollierenden Fraktion",
     "assignedCharacterName": "Name des Verwalters/Besitzers",
     "assignedCharacterId": "Zugehörige NPC ID oder temp-ID",
     "incomePerInterval": 250,
     "upkeepPerInterval": 50,
     "staffCount": 4,
     "locationName": "Name des Ortes/der Stadt",
     "territoryId": "Zugehörige Gebiets ID oder temp-ID"
   }

4. "obsoleteIds": Liste von IDs, die aus der Datenbank entfernt werden sollen (falls veraltet oder ersetzt).

GIB NUR DAS REINE JSON-OBJEKT ZURÜCK, KEINE TEXTERKLÄRUNGEN DRUMHERUM!`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          safetySettings: params.isNsfw ? this.getSafetySettings() : undefined
        }
      });

      const text = (response.text || '').trim();
      if (!text) {
        throw new Error("Keine Antwort bei der vernetzten Smart-Fill Generierung erhalten.");
      }

      const parsed = this.parseJSONSafely(text, null);
      if (!parsed) {
        throw new Error("Fehler beim Parsen der vernetzten Smart-Fill Daten.");
      }

      const { upsertTerritories = [], upsertLoreEntries = [], upsertHoldings = [], obsoleteIds = [] } = parsed;

      // Create a map of temp IDs to final stable UUIDs
      const idMap: Record<string, string> = {};
      const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Initialize mapping for existing entities (which have real IDs)
      upsertTerritories.forEach((t: any) => {
        if (t.id && !t.id.startsWith('temp-')) {
          idMap[t.id] = t.id;
        }
      });
      upsertLoreEntries.forEach((l: any) => {
        if (l.id && !l.id.startsWith('temp-')) {
          idMap[l.id] = l.id;
        }
      });
      upsertHoldings.forEach((h: any) => {
        if (h.id && !h.id.startsWith('temp-')) {
          idMap[h.id] = h.id;
        }
      });

      // Generate stable IDs for new elements
      upsertTerritories.forEach((t: any) => {
        if (!t.id || t.id.startsWith('temp-')) {
          const temp = t.id || `temp-terr-${t.name || Math.random()}`;
          idMap[temp] = generateId('terr');
          t.id = idMap[temp];
        }
      });

      upsertLoreEntries.forEach((l: any) => {
        if (!l.id || l.id.startsWith('temp-')) {
          const temp = l.id || `temp-lore-${l.title || Math.random()}`;
          idMap[temp] = generateId('lore');
          l.id = idMap[temp];
        }
      });

      upsertHoldings.forEach((h: any) => {
        if (!h.id || h.id.startsWith('temp-')) {
          const temp = h.id || `temp-holding-${h.name || Math.random()}`;
          idMap[temp] = generateId('holding');
          h.id = idMap[temp];
        }
      });

      // Resolve reference IDs in the entities
      const resolveId = (id: string | null | undefined): string | null => {
        if (!id) return null;
        if (idMap[id]) return idMap[id];
        return id;
      };

      upsertTerritories.forEach((t: any) => {
        if (t.parentId) t.parentId = resolveId(t.parentId);
        if (t.controlledByFactionId) t.controlledByFactionId = resolveId(t.controlledByFactionId);
        if (t.ownerCharacterId) t.ownerCharacterId = resolveId(t.ownerCharacterId);
        if (t.ownerFactionId) t.ownerFactionId = resolveId(t.ownerFactionId);
        if (t.loreEntryId) t.loreEntryId = resolveId(t.loreEntryId);
      });

      upsertLoreEntries.forEach((l: any) => {
        if (l.details) {
          if (l.details.parentPlaceId) l.details.parentPlaceId = resolveId(l.details.parentPlaceId) || l.details.parentPlaceId;
          if (l.details.territoryId) l.details.territoryId = resolveId(l.details.territoryId) || l.details.territoryId;
          if (l.details.holdingId) l.details.holdingId = resolveId(l.details.holdingId) || l.details.holdingId;
          if (l.details.ownerCharacterId) l.details.ownerCharacterId = resolveId(l.details.ownerCharacterId) || l.details.ownerCharacterId;
          if (l.details.ownerFactionId) l.details.ownerFactionId = resolveId(l.details.ownerFactionId) || l.details.ownerFactionId;
        }
      });

      upsertHoldings.forEach((h: any) => {
        if (h.territoryId) h.territoryId = resolveId(h.territoryId) || h.territoryId;
        if (h.assignedCharacterId) h.assignedCharacterId = resolveId(h.assignedCharacterId) || h.assignedCharacterId;
        if (h.assignedManagerId) h.assignedManagerId = resolveId(h.assignedManagerId) || h.assignedManagerId;
        if (h.ownerCharacterId) h.ownerCharacterId = resolveId(h.ownerCharacterId) || h.ownerCharacterId;
        if (h.ownerFactionId) h.ownerFactionId = resolveId(h.ownerFactionId) || h.ownerFactionId;
        if (h.loreEntryId) h.loreEntryId = resolveId(h.loreEntryId) || h.loreEntryId;
      });

      // Now merge the results into world & loreDatabase
      const obsoleteSet = new Set(obsoleteIds.map((id: string) => id.toString()));

      // 1. Process Territories
      let nextTerritories = (world.territories || []).filter((t: any) => !obsoleteSet.has(t.id));
      
      const kmPerUnit = world.mapConfig?.kmPerCoordinateUnit || 10;
      
      upsertTerritories.forEach((newT: any) => {
        // Calculate coordinates from spatial relation if provided
        if (newT.spatialRelation && newT.spatialRelation.fromId) {
          const refId = resolveId(newT.spatialRelation.fromId) || newT.spatialRelation.fromId;
          const refTerritory = nextTerritories.find((t: any) => t.id === refId) || world.territories?.find((t: any) => t.id === refId);
          if (refTerritory) {
            const distUnits = (newT.spatialRelation.distanceKm || 50) / kmPerUnit;
            let dx = 0; let dy = 0;
            switch (newT.spatialRelation.direction?.toLowerCase()) {
              case 'north': dy = -distUnits; break;
              case 'south': dy = distUnits; break;
              case 'east': dx = distUnits; break;
              case 'west': dx = -distUnits; break;
              case 'northeast': dx = distUnits * 0.707; dy = -distUnits * 0.707; break;
              case 'northwest': dx = -distUnits * 0.707; dy = -distUnits * 0.707; break;
              case 'southeast': dx = distUnits * 0.707; dy = distUnits * 0.707; break;
              case 'southwest': dx = -distUnits * 0.707; dy = distUnits * 0.707; break;
            }
            newT.x = Math.max(0, Math.min(100, (refTerritory.x || 50) + dx));
            newT.y = Math.max(0, Math.min(100, (refTerritory.y || 50) + dy));
          }
        }

        const idx = nextTerritories.findIndex((t: any) => t.id === newT.id);
        if (idx >= 0) {
          nextTerritories[idx] = { ...nextTerritories[idx], ...newT };
        } else {
          // Create placedObjects / tileData automatically for any sub-territory
          const w = 30;
          const h = 20;
          const tilesMap: Record<string, string> = {};
          for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
              tilesMap[`${c},${r}`] = (r === 0 || r === h - 1 || c === 0 || c === w - 1) ? 'ozean' : 'gras';
            }
          }
          newT.tileData = {
            gridWidth: w,
            gridHeight: h,
            tiles: tilesMap,
            placedObjects: [],
            positions: { 'Spieler': { x: Math.floor(w / 2), y: Math.floor(h / 2) } }
          };
          nextTerritories.push(newT);
        }
      });

      // 2. Process Lore Database
      let nextLore = loreDatabase.filter((l: any) => !obsoleteSet.has(l.id));
      upsertLoreEntries.forEach((newL: any) => {
        const idx = nextLore.findIndex((l: any) => l.id === newL.id || (l.title || '').toLowerCase().trim() === (newL.title || '').toLowerCase().trim());
        if (idx >= 0) {
          nextLore[idx] = {
            ...nextLore[idx],
            ...newL,
            id: nextLore[idx].id, // Keep stable ID
            details: { ...nextLore[idx].details, ...newL.details }
          };
        } else {
          nextLore.push({
            isUnlocked: true,
            ...newL
          });
        }
      });

      // 3. Process Holdings
      const economy = world.economyConfig || {
        currencyName: 'Goldmünzen',
        currencyIcon: '🪙',
        payoutInterval: 'weekly',
        allowPassiveIncome: true,
        enableRandomEvents: true,
        holdings: []
      };
      let nextHoldings = (economy.holdings || []).filter((h: any) => !obsoleteSet.has(h.id));
      upsertHoldings.forEach((newH: any) => {
        const idx = nextHoldings.findIndex((h: any) => h.id === newH.id);
        const mappedHolding = {
          reputation: 60,
          status: 'active',
          upgrades: [
            { id: `upg-${newH.id}-1`, name: 'Renovierung', cost: 150, levelRequired: 1, unlocked: false, description: 'Erhöht die Einnahmen um 15%' },
            { id: `upg-${newH.id}-2`, name: 'Sicherheit', cost: 300, levelRequired: 2, unlocked: false, description: 'Reduziert das Risiko für negative Vorfälle' }
          ],
          ...newH
        };
        if (idx >= 0) {
          nextHoldings[idx] = { ...nextHoldings[idx], ...mappedHolding };
        } else {
          nextHoldings.push(mappedHolding);
        }
      });

      const updatedWorld = {
        ...world,
        territories: nextTerritories,
        economyConfig: {
          ...economy,
          holdings: nextHoldings
        }
      };

      return {
        updatedWorld,
        updatedLoreDatabase: nextLore
      };
    });
  }

  static async smartFillTerritoryAndCodex(
    world: any,
    territoryId: string | null,
    userInstructions: string,
    loreDatabase: any[],
    isNsfw?: boolean
  ): Promise<{ updatedWorld: any; updatedLoreDatabase: any[] }> {
    return this.generateLinkedWorldEntities({
      userPrompt: userInstructions,
      world,
      loreDatabase,
      isNsfw,
      targetTerritoryId: territoryId,
      source: 'worldmap'
    });
  }

  static async generateEconomyHoldings(world: WorldSetting, loreDatabase: any[]): Promise<EconomyHolding[]> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Erstelle 3-5 passende Besitztümer / Wirtschafts- und Management-Objekte (Holdings) für eine Rollenspielwelt.
Welten-Titel: "${world.title || 'Unbenannt'}"
Epoche/Genre: "${world.era || 'Fantasy'}"
Welten-Beschreibung: "${world.description || 'Keine Angabe'}"

Verfügbare Kodex-Einträge / Charaktere in der Welt:
${(loreDatabase || []).slice(0, 20).map((l: any) => `- [${l.category}] ${l.title}: ${l.description?.slice(0, 70)}...`).join('\n')}

Generiere ein detailliertes JSON Array von Objekten mit folgenden Feldern:
- name: Name des Betriebs/Anwesens/Schiffs/Burg (z.B. "Taverne Zum Tanzenden Drachen", "Weingut Eichenhain", "Garnison Silberfels", "Handelskontor van Dyk", "Schmiede Eisenherz", "Burg Rabenwacht", "Adelssitz Grafschaft Valerius")
- type: Eines aus ["taverne", "gasthaus", "schmiede", "baeckerei", "markt", "haendler", "bauernhof", "saegewerk", "mine", "werft", "hafenbetrieb", "manufaktur", "magierladen", "werkstatt", "anwesen", "adelssitz", "schloss", "burg", "koenigreich", "schiff", "gilde", "fraktionsgebaeude", "custom"]
- icon: Ein passendes Symbol (z.B. 🍺, 🏡, 🏰, 👑, ⛵, 🔨, ⛏️, 🪙, 🌾, 🪓, ⚓, 🚢, 🧵, 🧪, 🔧, ⚖️)
- description: Lebendige Beschreibung des Betriebs und seiner Funktion (30-60 Wörter)
- level: Zahl zwischen 1 und 4
- ownerType: "user" (vom Spieler geführt) ODER "character" (einem NPC zugewiesen) ODER "faction"
- assignedCharacterName: Name des Besitzers oder Wirts
- assignedManagerName: Name des Verwalters / Butlers / Meisters
- incomePerInterval: Wöchentliche Einnahmen (z.B. 120 bis 1000)
- upkeepPerInterval: Unterhaltskosten (z.B. 25 bis 250)
- staffCount: Gesamtzahl Mitarbeiter
- status: "active"
- locationName: Ort oder Region
- physicalCondition: Zustand (z.B. "Hervorragend", "Gepflegt", "Reparaturbedürftig")
- physicalUsage: Zweck (z.B. "Gastronomie & Quartier", "Adelsresidenz & Landgut", "Rüstungsschmiede", "Bergbau & Veredelung")
- roomsOrAreas: Wichtige Räume / Zonen
- resources: Array von 3-5 Ressourcen (id, name, category, amount, maxCapacity, unit, pricePerUnit, condition)
- roles: Array von 2-4 Positionen (id, name, assignedToName, authorities, responsibilities, salary, workplaceArea)
- staffGroups: Array von 2-4 namenlosen Personalgruppen (id, roleName, count, workplaceArea, duties, status, assignedLeaderOrManager, dailyCostPerUnit) (z.B. Mägde, Diener, Wachen, Köche, Stallpersonal)
- tasks: Array von 2-3 konkreten Aufgaben (id, title, description, status, priority, deadline, reward, assigneeName)
- duties: Array von 2-3 dauerhaften Pflichten (id, title, description, frequency, isFulfilled, consequences)
- orders: Array von 1-2 Aufträgen (id, title, issuerName, recipientName, targetGoal, requiredResources, deadline, priority, progress, reward, consequences, status)
- decisions: Array von 1-2 aktuellen Management-Entscheidungen (id, title, description, category, urgency, requiredAuthority, options, status)
- activityLogs: Array von 2-3 lebendigen Hintergrund-Meldungen (id, timestamp, actorName, actorRole, type, message, severity)
- upgrades: Array von 2-3 Upgrades (id, name, cost, levelRequired, unlocked: false, description)
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      return parsed.map((item: any, idx: number) => ({
        id: `holding-gen-${Date.now()}-${idx}`,
        name: item.name || 'Wirtschaftsbetrieb',
        type: item.type || 'taverne',
        icon: item.icon || '🏠',
        description: item.description || '',
        level: item.level || 1,
        ownerType: item.ownerType === 'character' ? 'character' : item.ownerType === 'faction' ? 'faction' : 'user',
        assignedCharacterName: item.assignedCharacterName || '',
        assignedManagerName: item.assignedManagerName || '',
        incomePerInterval: item.incomePerInterval || 150,
        upkeepPerInterval: item.upkeepPerInterval || 30,
        staffCount: item.staffCount || 5,
        reputation: item.reputation || 60,
        status: item.status || 'active',
        locationName: item.locationName || '',
        physicalCondition: item.physicalCondition || 'Gut',
        physicalUsage: item.physicalUsage || '',
        roomsOrAreas: item.roomsOrAreas || '',
        resources: Array.isArray(item.resources) ? item.resources.map((r: any, rIdx: number) => ({
          id: r.id || `res-${Date.now()}-${rIdx}`,
          name: r.name || 'Ressource',
          category: r.category || 'goods',
          amount: Number(r.amount) || 20,
          maxCapacity: Number(r.maxCapacity) || 100,
          unit: r.unit || 'Einheiten',
          pricePerUnit: Number(r.pricePerUnit) || 5,
          condition: r.condition || 'gut',
          notes: r.notes || ''
        })) : [],
        roles: Array.isArray(item.roles) ? item.roles.map((ro: any, roIdx: number) => ({
          id: ro.id || `role-${Date.now()}-${roIdx}`,
          name: ro.name || 'Position',
          assignedToName: ro.assignedToName || 'Unbesetzt',
          authorities: Array.isArray(ro.authorities) ? ro.authorities : ['Tagesgeschäft leiten'],
          responsibilities: Array.isArray(ro.responsibilities) ? ro.responsibilities : [],
          salary: Number(ro.salary) || 10,
          workplaceArea: ro.workplaceArea || ''
        })) : [],
        staffGroups: Array.isArray(item.staffGroups) ? item.staffGroups.map((sg: any, sgIdx: number) => ({
          id: sg.id || `staff-${Date.now()}-${sgIdx}`,
          roleName: sg.roleName || 'Bedienstete',
          count: Number(sg.count) || 4,
          workplaceArea: sg.workplaceArea || 'Betrieb',
          duties: Array.isArray(sg.duties) ? sg.duties : ['Laufende Arbeiten verrichten'],
          status: sg.status || 'aktiv',
          assignedLeaderOrManager: sg.assignedLeaderOrManager || '',
          dailyCostPerUnit: Number(sg.dailyCostPerUnit) || 2,
          notes: sg.notes || ''
        })) : [],
        tasks: Array.isArray(item.tasks) ? item.tasks.map((t: any, tIdx: number) => ({
          id: t.id || `tsk-${Date.now()}-${tIdx}`,
          title: t.title || 'Aufgabe',
          description: t.description || '',
          status: t.status || 'pending',
          priority: t.priority || 'medium',
          deadline: t.deadline || '',
          progress: Number(t.progress) || 0,
          requiredResources: t.requiredResources || '',
          reward: t.reward || '',
          assigneeName: t.assigneeName || ''
        })) : [],
        duties: Array.isArray(item.duties) ? item.duties.map((d: any, dIdx: number) => ({
          id: d.id || `dty-${Date.now()}-${dIdx}`,
          title: d.title || 'Pflicht',
          description: d.description || '',
          frequency: d.frequency || 'daily',
          assignedRoleName: d.assignedRoleName || '',
          isFulfilled: d.isFulfilled !== undefined ? !!d.isFulfilled : true,
          consequences: d.consequences || ''
        })) : [],
        orders: Array.isArray(item.orders) ? item.orders.map((o: any, oIdx: number) => ({
          id: o.id || `ord-${Date.now()}-${oIdx}`,
          title: o.title || 'Auftrag',
          issuerName: o.issuerName || 'Besitzer',
          recipientName: o.recipientName || 'Verwalter',
          targetGoal: o.targetGoal || '',
          requiredResources: o.requiredResources || '',
          deadline: o.deadline || '',
          priority: o.priority || 'normal',
          progress: Number(o.progress) || 0,
          reward: o.reward || '',
          consequences: o.consequences || '',
          status: o.status || 'offen',
          delegatedTo: o.delegatedTo || '',
          notes: o.notes || ''
        })) : [],
        decisions: Array.isArray(item.decisions) ? item.decisions.map((dec: any, decIdx: number) => ({
          id: dec.id || `dec-${Date.now()}-${decIdx}`,
          title: dec.title || 'Entscheidung',
          description: dec.description || '',
          category: dec.category || 'finanzen',
          urgency: dec.urgency || 'mittel',
          requiredAuthority: dec.requiredAuthority || 'Geschäftsführung',
          options: Array.isArray(dec.options) ? dec.options : [
            { id: 'opt-1', label: 'Zustimmen', outcomeDescription: 'Maßnahme wird umgesetzt.' },
            { id: 'opt-2', label: 'Ablehnen', outcomeDescription: 'Keine Veränderung.' }
          ],
          status: dec.status || 'offen'
        })) : [],
        activityLogs: Array.isArray(item.activityLogs) ? item.activityLogs.map((log: any, lIdx: number) => ({
          id: log.id || `log-${Date.now()}-${lIdx}`,
          timestamp: log.timestamp || 'Heute',
          actorName: log.actorName || 'Personal',
          actorRole: log.actorRole || 'Mitarbeiter',
          type: log.type || 'staff_action',
          message: log.message || '',
          severity: log.severity || 'info'
        })) : [],
        upgrades: (item.upgrades || []).map((u: any, uIdx: number) => ({
          id: u.id || `upg-${idx}-${uIdx}`,
          name: u.name || 'Erweiterung',
          cost: u.cost || 200,
          levelRequired: u.levelRequired || 1,
          unlocked: !!u.unlocked,
          description: u.description || ''
        }))
      }));
    });
  }

  static async smartFillEconomyHolding(
    promptText: string,
    existingHolding: Partial<EconomyHolding>,
    world: WorldSetting,
    loreDatabase: any[] = [],
    isSupplementMode: boolean = true
  ): Promise<Partial<EconomyHolding>> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Du bist ein erfahrener Worldbuilding- und Wirtschafts-Architekt. Fülle oder erweitere einen Wirtschafts- und Managementbetrieb präzise basierend auf folgenden Vorgaben.

WICHTIGSTE REGEL: KEINE EMOJIS! Verwende in keinem Feld Emojis, Symbole oder Sonderzeichen dieser Art.

NUTZER-VORGABE: "${promptText}"
AKTUELLER TYP: "${existingHolding.type || 'taverne'}"
AKTUELLER NAME: "${existingHolding.name || ''}"
AKTUELLER ZUSTAND/DETAILS: "${existingHolding.description || ''}"
WELT: "${world.title || ''}" (${world.era || 'Fantasy'})

${isSupplementMode ? `### ERGÄNZUNGS-MODUS AKTIV:
Der Nutzer möchte bestehende Daten behalten und nur fehlende Informationen ergänzen oder bestehende logisch erweitern.
BESTEHENDE DATEN:
${JSON.stringify(existingHolding, null, 2)}
RECHTLICHER HINWEIS: Behalte IDs von Unterobjekten (Ressourcen, Rollen, Aufgaben) bei, falls du diese aktualisierst!` : `### NEUERSTELLUNGS-MODUS (KEINE ERGÄNZUNG):
Der Nutzer möchte den Betrieb basierend auf der Vorgabe neu generieren. Du kannst bestehende Werte (außer ID) überschreiben, um ein konsistentes neues Gesamtbild zu erzeugen.`}

Erstelle oder aktualisiere:
- name: Aussagekräftiger Name (KEINE EMOJIS)
- type: Einer der unterstützten Typen (taverne, handelshaus, mine, bauernhof, werkstatt, gilde, hafen, festung, anwesen, bank, kirche, schule, kaserne, hospital, labor, theater, magieturm, lagerhaus, stallung, jagdhuette, muenze, bibliothek, schmiede, saegewerk, steinbruch, weberei, gerberei, brauerei, weingut, imkerei, fischerei, saline, plantage, herrenhaus, kloster, tempel, schrein, grabmal, palast, rathaus, marktplatz, kaufhaus, kontor, wehranlage, wachtturm, gefaengnis, arsenal, werft, trockenbecken, aquarium, observatorium, menagerie, botanischer_garten, park, badehaus, arena, spielhalle, bordell, asyl, waisenhaus, hospiz, friedhof, krematorium, katakomben, kanalisation, bruecke, tunnel, monument, ruine, ausgrabung, portal, schiff)
- icon: NUR Lucide Icon Name (z.B. 'Beer', 'Hotel', 'Hammer', 'Wheat', 'Castle', 'Shield', 'Home', 'Anchor', 'Ship', 'Cross', 'Book', 'Swords', 'Tent'). ABSOLUT KEINE EMOJIS!
- description: Detaillierte, stimmungsvolle Beschreibung (40-80 Wörter) (KEINE EMOJIS)
- level: 1-5
- locationName: Ort / Bezirk
- incomePerInterval: Ertrag pro Woche/Intervall
- upkeepPerInterval: Unterhalt pro Woche/Intervall
- staffCount: Gesamtpersonal (Summe aller Gruppen)
- physicalCondition: Zustand (z.B. Exzellent, Gut, Abgenutzt, Baufällig, Ruine)
- physicalSize: Größe (z.B. Winzig, Klein, Mittel, Groß, Monumental)
- physicalCapacity: Kapazität (z.B. "40 Gäste", "120 Tonnen Erz", "500 Soldaten")
- physicalUsage: Aktuelle Nutzung
- roomsOrAreas: Liste wichtiger Räume/Bereiche
- resources: Liste von 3-6 Ressourcen (mit id, name, amount, maxCapacity, unit, pricePerUnit, category) (Namen ohne Emojis)
- roles: Liste von 3-5 Positionen (mit id, roleName, assignedCharacterId, workplaceArea, salary, duties[], authorities[])
- staffGroups: Liste von 2-4 namenlosen Personalgruppen (mit id, name, count, description)
- tasks: Liste von 2-4 anstehenden Aufgaben (mit id, title, description, priority, status, deadline)
- duties: Liste von 2-4 dauerhaften Pflichten (mit id, title, description, frequency)
- orders: Liste von 1-3 Aufträgen (mit id, title, description, issuerId, recipientId, status)
- decisions: Liste von 1-2 Management-Besonderheiten (mit id, title, description, options[], impact)
- activityLogs: Liste von 3-5 lebendigen Hintergrund-Meldungen (mit id, timestamp, type, title, message)

WICHTIG:
- Falls isSupplementMode=true: Ändere bestehende Namen/Typen nur wenn unbedingt nötig für Konsistenz.
- Falls isSupplementMode=false: Erfinde alles passend zur Vorgabe neu.
- Antworte immer auf DEUTSCH.
- Gib ein valides JSON-Objekt zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return parsed;
    });
  }

  static async upgradeNamelessStaffToCharacter(
    staff: { roleName: string; workplaceArea?: string; duties?: string[]; holdingName: string; holdingType?: string },
    world: WorldSetting
  ): Promise<{
    name: string;
    role: string;
    gender: string;
    age: string;
    race: string;
    appearance: string;
    personality: string;
    bio: string;
    secrets: string;
    quirk: string;
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Erstelle einen vollwertigen, lebendigen Charakter aus einem bisher namenlosen Mitarbeiter in einem Betrieb.
Betrieb: "${staff.holdingName}" (${staff.holdingType || 'Betrieb'})
Bisherige Rolle/Gruppe: "${staff.roleName}"
Arbeitsbereich: "${staff.workplaceArea || 'Allgemein'}"
Typische Aufgaben: ${(staff.duties || []).join(', ')}
Welt: "${world.title || ''}" (${world.era || 'Fantasy'})

Der Charakter soll vollkommen widerspruchsfrei in seine bisherige Rolle passen, aber eine eigene Persönlichkeit, ein Aussehen, persönliche Eigenheiten und ein kleines Geheimnis oder eine Motivation erhalten.

Gib ein JSON-Objekt mit folgenden Feldern zurück:
- name: Vollständiger Name
- role: Genaue Berufsbezeichnung / Rolle
- gender: Geschlecht
- age: Alter (z.B. "24")
- race: Rasse / Spezies
- appearance: Aussehen & Kleidung (Gesicht, Haare, Statur, Arbeitskleidung)
- personality: Charakterzüge & Verhalten
- bio: Hintergrundgeschichte & wie die Person an diese Anstellung kam (3-5 Sätze)
- secrets: Ein kleines persönliches Geheimnis oder Anliegen
- quirk: Eine charmante Eigenart oder Angewohnheit
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      return JSON.parse(response.text || '{}');
    });
  }

  static async generateHoldingActivityLog(
    holding: EconomyHolding,
    world: WorldSetting
  ): Promise<EconomyLogEntry[]> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Generiere 4-6 lebendige, glaubwürdige Hintergrund-Ereignisse und Meldungen von Angestellten für folgenden Betrieb:
Betrieb: "${holding.name}" (${holding.type})
Personal: ${holding.staffGroups?.map(sg => `${sg.count}x ${sg.roleName}`).join(', ') || `${holding.staffCount} Mitarbeiter`}
Ressourcen: ${holding.resources?.map(r => `${r.amount} ${r.unit} ${r.name}`).join(', ') || 'Standard'}
Aktuelle Probleme: ${Array.isArray(holding.currentIssuesOrDecisions) ? holding.currentIssuesOrDecisions.join(', ') : holding.currentIssuesOrDecisions || 'Keine'}

Erzeuge eine Mischung aus:
- Bedienstete führen Alltagsarbeiten aus (z.B. "Magd Elsa bringt frische Wäsche", "Butler Johann bereitet den Speisesaal vor")
- Wachen / Sicherheit melden Beobachtungen
- Meldungen über knappe Vorräte oder Lieferungen
- Kleine Vorkommnisse oder Besucher

Gib ein JSON Array mit Objekten zurück:
- id: Eindeutige ID
- timestamp: Textuelle Zeitangabe (z.B. "Heute, 08:30", "Heute, 12:15", "Gestern Abend")
- actorName: Name oder Bezeichnung der handelnden Person (z.B. "Magd Greta", "Stallmeister Karl", "Wachposten Boris", "Butler James")
- actorRole: Rolle der Person
- type: Eines aus ["staff_action", "issue_report", "task_update", "financial", "order_progress", "visitor", "incident"]
- message: Die detaillierte Meldung oder Aktion (1-2 Sätze)
- severity: "info", "warning", "urgent" oder "positive"
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      return parsed.map((p: any, idx: number) => ({
        id: `log-gen-${Date.now()}-${idx}`,
        timestamp: p.timestamp || 'Heute',
        actorName: p.actorName || 'Personal',
        actorRole: p.actorRole || 'Mitarbeiter',
        type: p.type || 'staff_action',
        message: p.message || '',
        severity: p.severity || 'info'
      }));
    });
  }

  static async generateSubtasksForOrder(
    order: EconomyOrder,
    holding: EconomyHolding,
    player?: Character,
    world?: WorldSetting
  ): Promise<EconomyTask[]> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const rolesDesc = holding.roles?.map(r => `${r.name} (${r.assignedToName})`).join(', ') || 'Keine speziellen Rollen';
      const staffGroupsDesc = holding.staffGroups?.map(sg => `${sg.count}x ${sg.roleName} (Status: ${sg.status})`).join(', ') || 'Kein Gruppenpersonal';
      const resourcesDesc = holding.resources?.map(r => `${r.amount} ${r.unit} ${r.name}`).join(', ') || 'Keine Ressourcen gelistet';

      const prompt = `Du bist ein erfahrener Betriebsleiter und Quest-Designer.
Zerlege folgenden übergeordneten Auftrag in 3 bis 6 konkrete, operative Teilaufgaben (Tasks) für den Betrieb "${holding.name}" (${holding.type}).

AUFTRAG:
Titel: "${order.title}"
Zielvorgabe: "${order.targetGoal}"
Auftraggeber: "${order.issuerName}"
Empfänger: "${order.recipientName}"
Priorität: "${order.priority}"
Frist: "${order.deadline || 'Keine Frist'}"

BETRIEB & KONTEXT:
Betrieb: "${holding.name}" (${holding.type})
Beschreibung: "${holding.description || ''}"
Verfügbares Personal (Rollen): ${rolesDesc}
Verfügbare Personalgruppen: ${staffGroupsDesc}
Verfügbare Ressourcen: ${resourcesDesc}
Spieler: "${player?.name || 'Spieler'}" (Beruf: "${player?.profession || 'Unbekannt'}", Rang: "${player?.professionLevel || 'Geselle'}")

REGELN:
1. Erzeuge 3 bis 6 logische, chronologische Teilaufgaben, die für die Erfüllung des Auftrags notwendig sind.
2. Schlage sinnvolle Zuweisungen vor (entweder Spieler selbst, eine namentliche Rolle oder eine Personalgruppe).
3. KEINE EMOJIS! Verwende absolut keine Emojis oder Sonderzeichen.
4. Gib ein JSON-Array zurück mit Objekten:
- title: Kurzer, präziser Titel der Teilaufgabe (z.B. "Vorräte prüfen und inventarisieren", "Gemüse schneiden")
- description: 1-2 Sätze Handlungsanweisung
- priority: "low", "medium", "high" oder "urgent"
- deadline: z.B. "Vor Arbeitsbeginn", "Innerhalb von 2 Stunden", "Heute Abend"
- requiredResources: Benötigte Gegenstände/Zutaten oder leer
- suggestedAssigneeName: Name der vorgeschlagenen Rolle/Gruppe oder leer
- isForStaffGroup: true/false
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any, idx: number): EconomyTask => ({
        id: `task-ord-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        title: item.title || `Teilaufgabe ${idx + 1}`,
        description: item.description || '',
        status: 'pending',
        priority: (['low', 'medium', 'high', 'urgent'].includes(item.priority) ? item.priority : 'medium') as any,
        deadline: item.deadline || '',
        progress: 0,
        requiredResources: item.requiredResources || '',
        reward: '',
        parentOrderId: order.id,
        taskType: 'generated',
        canDelegate: true,
        generatedByAI: true,
        generatedReason: `Abgeleitet aus Auftrag: ${order.title}`,
        assigneeName: item.suggestedAssigneeName || undefined,
        assigneeGroupName: item.isForStaffGroup ? item.suggestedAssigneeName : undefined
      }));
    });
  }

  static async generateTaskFromDuty(
    duty: EconomyDuty,
    holding: EconomyHolding,
    player?: Character,
    world?: WorldSetting
  ): Promise<EconomyTask> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Erzeuge aus folgender wiederkehrender Pflicht eine konkrete operative Aufgabe für heute bzw. die aktuelle Schicht im Betrieb "${holding.name}" (${holding.type}).

PFLICHT:
Titel: "${duty.title}"
Beschreibung: "${duty.description}"
Frequenz: "${duty.frequency}"
Zugeordnete Rolle: "${duty.assignedRoleName || 'Allgemein'}"

SPIELER & BETRIEB:
Betrieb: "${holding.name}"
Spieler: "${player?.name || 'Spieler'}" (Beruf: "${player?.profession || 'Mitarbeiter'}")

REGELN:
- Formuliere die konkrete heutige Ausführung dieser Pflicht als operative Aufgabe.
- KEINE EMOJIS!
- Gib ein JSON-Objekt zurück mit:
  - title: Konkreter Aufgabentitel für heute
  - description: Genaue Handlungsanweisung
  - priority: "low", "medium", "high" oder "urgent"
  - deadline: Zeitangabe (z.B. "Ende der Schicht")
  - requiredResources: falls nötig
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `task-duty-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: parsed.title || duty.title,
        description: parsed.description || duty.description,
        status: 'pending',
        priority: (['low', 'medium', 'high', 'urgent'].includes(parsed.priority) ? parsed.priority : 'medium') as any,
        deadline: parsed.deadline || 'Heute',
        progress: 0,
        requiredResources: parsed.requiredResources || '',
        reward: '',
        taskType: 'routine',
        canDelegate: true,
        generatedByAI: true,
        generatedReason: `Aus Pflicht instanziiert: ${duty.title}`,
        assigneeName: duty.assignedRoleName || undefined
      };
    });
  }

  static async suggestOperationalTasks(
    holding: EconomyHolding,
    player?: Character,
    world?: WorldSetting,
    situationPrompt?: string
  ): Promise<EconomyTask[]> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const rolesDesc = holding.roles?.map(r => `${r.name} (${r.assignedToName})`).join(', ') || 'Keine';
      const staffGroupsDesc = holding.staffGroups?.map(sg => `${sg.count}x ${sg.roleName}`).join(', ') || 'Keine';
      const issues = Array.isArray(holding.currentIssuesOrDecisions) ? holding.currentIssuesOrDecisions.join(', ') : holding.currentIssuesOrDecisions || 'Keine akuten Probleme';

      const prompt = `Erzeuge 3 bis 5 sinnvolle operative Tagesaufgaben für den Betrieb "${holding.name}" (${holding.type}).
${situationPrompt ? `SITUATION / VORGABE: "${situationPrompt}"` : ''}
AKTUELLE THEMEN/PROBLEME: ${issues}
PERSONAL: Rollen: ${rolesDesc} | Gruppen: ${staffGroupsDesc}
SPIELER: "${player?.name || 'Spieler'}" (Beruf: "${player?.profession || 'Mitarbeiter'}", Position/Rolle: "${holding.userRoleName || 'Mitarbeiter'}")

REGELN:
- Realistische handwerkliche, organisatorische oder leitende Aufgaben passend zum Betriebstyp.
- KEINE EMOJIS!
- JSON-Array mit Objekten:
  - title: Prägnanter Aufgabentitel
  - description: 1-2 Sätze
  - priority: "low", "medium", "high" oder "urgent"
  - deadline: Zeitangabe
  - requiredResources: Optionale Ressourcen
  - suggestedRole: Vorgeschlagene Rolle oder leer
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any, idx: number): EconomyTask => ({
        id: `task-sug-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        title: item.title || `Betriebsaufgabe ${idx + 1}`,
        description: item.description || '',
        status: 'pending',
        priority: (['low', 'medium', 'high', 'urgent'].includes(item.priority) ? item.priority : 'medium') as any,
        deadline: item.deadline || 'Heute',
        progress: 0,
        requiredResources: item.requiredResources || '',
        reward: '',
        taskType: 'generated',
        canDelegate: true,
        generatedByAI: true,
        generatedReason: situationPrompt ? `Vorgabe: ${situationPrompt}` : 'Tagesgeschäft & Situationsanalyse',
        assigneeName: item.suggestedRole || undefined
      }));
    });
  }

  static async deriveRoleTasksFromChat(
    player: Character,
    roleTitle: string,
    station: string,
    recentChatSnippets: string[],
    holding?: EconomyHolding
  ): Promise<EconomyTask[]> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const chatContext = recentChatSnippets.slice(-6).join('\n---\n');

      const prompt = `Analysiere die aktuelle Spielsituation und die Rolle des Nutzers:
Nutzer-Rolle/Amt: "${roleTitle}"
Dienstort/Station: "${station}"
Nutzer-Name: "${player.name}"
Beruf/Klasse: "${player.profession || player.role || 'Unbekannt'}"
${holding ? `Betrieb/Herrschaftsbereich: "${holding.name}" (${holding.type})` : ''}

LETZTE CHAT-NACHRICHTEN:
${chatContext || 'Keine bisherigen Nachrichten.'}

AUFGABE:
Ermittle 2 bis 4 konkrete, handlungsrelevante Aufgaben für den Spieler, die sich direkt aus seiner Rolle (z.B. König, Koch, Tavernenwirt, Wachsoldat, Magier) und dem aktuellen Geschehen ableiten.
Wenn der Spieler beispielsweise König ist: Befehle erteilen, Petitionen prüfen, Gesandte empfangen, Truppen anweisen.
Wenn der Spieler Koch ist: Speisen zubereiten, Vorräte prüfen, Gehilfen anweisen, Vorkosten.
Wenn der Spieler Wirt ist: Ausschank leiten, Gäste betreuen, Streitigkeiten schlichten, Kasse zählen.
Wenn der Spieler Soldat/Wächter ist: Tor sichern, Patrouillieren, Bericht an Vorgesetzten.

REGELN:
- Absolut KEINE Emojis verwenden!
- Neutrale, präzise Formulierungen.
- JSON-Array mit Objekten:
  - title: Prägnanter Aufgabentitel
  - description: 1-2 Sätze Handlungsanweisung oder Fragestellung
  - priority: "low", "medium", "high" oder "urgent"
  - deadline: Zeitangabe (z.B. "Sofort", "Vor dem Abend", "Heute")
  - requiredResources: Optionale Angabe
  - generatedReason: Kurzer Grund (z.B. "Aus aktuellem Gesprächsverlauf")
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any, idx: number): EconomyTask => ({
        id: `task-chat-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        title: item.title || `Aufgabe ${idx + 1}`,
        description: item.description || '',
        status: 'pending',
        priority: (['low', 'medium', 'high', 'urgent'].includes(item.priority) ? item.priority : 'medium') as any,
        deadline: item.deadline || 'Heute',
        progress: 0,
        requiredResources: item.requiredResources || '',
        reward: '',
        assigneeName: player.name,
        taskType: 'generated',
        canDelegate: true,
        generatedByAI: true,
        generatedReason: item.generatedReason || 'Aus Spielverlauf abgeleitet'
      }));
    });
  }

  static async generateWorldQuickEnrichment(
    worldTitle: string,
    genres: string[],
    instruction: string
  ): Promise<{ thematicNames?: Record<string, string[]> }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Erzeuge passende, atmosphärische und fantasievolle Namen für Karten-Elemente einer Rollenspielwelt.
Welt-Titel: "${worldTitle}"
Genres: ${genres.join(', ')}
Anweisung: ${instruction}

Gib ein JSON-Objekt mit passenden Namenslisten für verschiedene Elementtypen zurück.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thematicNames: {
                type: Type.OBJECT,
                properties: {
                  koenigreich: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stadt: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hafen: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dorf: { type: Type.ARRAY, items: { type: Type.STRING } },
                  festung: { type: Type.ARRAY, items: { type: Type.STRING } },
                  ort: { type: Type.ARRAY, items: { type: Type.STRING } },
                  biome_gebirge: { type: Type.ARRAY, items: { type: Type.STRING } },
                  biome_wald: { type: Type.ARRAY, items: { type: Type.STRING } },
                  fluss: { type: Type.ARRAY, items: { type: Type.STRING } },
                  meer: { type: Type.ARRAY, items: { type: Type.STRING } },
                  see: { type: Type.ARRAY, items: { type: Type.STRING } },
                  insel: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '{"thematicNames":{}}');
    });
  }

  static async generateSmartFillFromPrompt(params: {
    userPrompt: string;
    worldTitle: string;
    genres: string[];
    worldDescription?: string;
    scopeMode: 'full_world' | 'targeted_zone';
    targetQuadrant?: string;
    centerCoords?: { x: number; y: number };
    existingTerritoriesCount?: number;
    population?: number;
    citiesCount?: number;
    villagesCount?: number;
    fortressesCount?: number;
    specialPlacesCount?: number;
    landScale?: number;
    customElementsList?: string;
    loreDatabase?: any[];
    existingTerritories?: any[];
    world?: WorldSetting;
  }): Promise<{
    territories: Territory[];
    parsedCounts?: Record<string, number>;
    suggestedLore?: Array<{
      title: string;
      category: string;
      description: string;
    }>;
    drawingPlan?: DrawingPlan;
    holdings?: EconomyHolding[];
    connections?: Array<{
      id: string;
      fromId?: string;
      toId?: string;
      fromPlace: string;
      toPlace: string;
      label: string;
      travelTime?: string;
      distance?: string;
      type: string;
      isUnlocked: boolean;
    }>;
    validation?: {
      valid: boolean;
      issues: Array<{
        code: string;
        level: 'error' | 'warning';
        message: string;
      }>;
    };
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const populationText = params.population ? `${params.population.toLocaleString('de-DE')} Einwohner` : 'variable Einwohnerzahl';
      
      const loreSummary = (params.loreDatabase || [])
        .slice(0, 40)
        .map((l: any) => `- [${l.category || 'Lore'}] "${l.title}": ${l.description || ''}`)
        .join('\n');

      const existingTerritoriesList = (params.existingTerritories || params.world?.territories || []) as Territory[];
      const territoriesSummary = existingTerritoriesList
        .slice(0, 35)
        .map((t: any) => `- [${t.type}] "${t.name}" (ID: ${t.id}, X:${t.x}, Y:${t.y}, Pop:${t.population || 'k.A.'}, Herrscher:${t.ruler || 'k.A.'}, Fraktion:${t.faction || 'k.A.'})`)
        .join('\n');

      const effectiveKmPerUnit = params.world?.mapConfig?.kmPerCoordinateUnit || 10;

      const systemPrompt = `Du bist der weltbeste Meister-Kartograf und KI-Geograf für Fantasy-, RPG- und Abenteuer-Welten (One Piece, Tolkien, D&D, DSA).
Deine Aufgabe ist es, einen präzisen, strukturierten ZEICHENPLAN ('DrawingPlan') zu erstellen, in dem du alle geografischen Elemente, Landmassen, Meere, Zonen und Naturmerkmale FREI und INDIVIDUELL zeichnest.

### GRUNDREGELN FÜR FREIES KI-ZEICHNEN & GEOGRAFISCHE PLAUSIBILITÄT:
1. **KEINE PRESET-FORMEN**:
   Verwende keine vorgefertigten Standard-Formen. Bestimme für jede Insel, jeden Kontinent und jedes Meer eine individuelle, organische Küstenlinie ('points' oder 'shapeDescription' + 'coastlineRoughness').
2. **FLÄCHE, BEVÖLKERUNG & PLAUSIBLE DICHTE**:
   - 1 Koordinate = ca. ${effectiveKmPerUnit} km. Fläche eines Gebiets berechnet sich aus dem Polygon: $A \\approx \\pi \\cdot r^2 \\cdot ${effectiveKmPerUnit * effectiveKmPerUnit} \\text{ km}^2$.
   - **Inselbevölkerung vs. Stadtbevölkerung**: Unterscheide sorgfältig, ob eine Zahl (z.B. "10.000 Einwohner") für die gesamte Insel oder für die Hauptstadt/Hafenstadt gilt.
   - **Vulkaninseln & Bewohnbarkeit**: Vulkane und Hochgebirge nehmen Platz ein und machen Teilflächen unbewohnbar. Zeichne die Insel ('create_landmass') groß genug (z.B. Radius 20-30 für 10.000 Einwohner) und platziere den Vulkan ('create_feature', 'featureType: vulkan') separat im Inneren.
   - **Hohe Bevölkerungsdichte**: Ist vollkommen erlaubt, wenn sie begründet ist! Platziere bei dichter Bevölkerung stets eine geschäftige Hafenstadt ('place_settlement' mit 'hafen'), Handelsrouten oder Lore-Einträge über rege Seefahrt, Magie oder Handelsgilden.
3. **MEER & MEERESZONEN**:
   Zeichne Meeresflächen ('create_sea') dort, wo sie gebraucht werden (z.B. zwischen zwei Reichen/Inseln). Meereszonen ('create_sea_zone' wie Calm Belt, Neue Welt) liegen stets innerhalb des übergeordneten Meeres ('parentSea').
4. **RÄUMLICHE BEZIEHUNGEN & ENTFERNUNGEN**:
   Aussagen wie "400 km südlich von Ouka" werden exakt umgesetzt ('relativeTo: "Insel Ouka"', 'direction: "south"', 'distanceKm: 400').
5. **HÄFEN AN DER KÜSTE**:
   Häfen ('place_settlement' mit 'settlementType: "hafen"') MÜSSEN 'onCoast: true' und eine 'coastDirection' ('south', 'east' etc.) haben.
6. **POIS SIND BETRIEBE / ORTE, KEINE LANDMASSEN**:
   Tavernen, Schmieden, Tempel, Minen ('place_poi') sind Punkte/Wirtschaftsbetriebe innerhalb einer Siedlung oder Insel.
7. **ROUTEN VERBINDEN ENDPUNKTE**:
   Seerouten und Handelsstraßen ('create_route') verbinden stets existierende oder neu gezeichnete Häfen/Orte.
8. **BESTEHENDE GEOMETRIE SCHÜTZEN**:
   Bereits existierende Gebiete (z.B. "Insel Ouka") dürfen niemals überschrieben werden! Nutze sie als 'relativeTo' Anker.

### VERFÜGBARE ZEICHEN-TOOLS ('tool'):
- **'create_landmass'** / **'draw_landmass'**: Landmasse frei zeichnen ('name', 'type': 'insel'|'koenigreich'|'kontinent', 'relativeTo', 'direction', 'distanceKm', 'points', 'coastlineRoughness', 'shapeDescription', 'climate', 'terrain', 'faction', 'ruler', 'population', 'description', 'color')
- **'create_sea'** / **'draw_sea'**: Meeresfläche zeichnen ('name', 'relativeTo', 'direction', 'distanceKm', 'points', 'radius', 'description', 'color')
- **'create_sea_zone'** / **'draw_sea_zone'**: Meereszone innerhalb eines Meeres ('name', 'parentSea', 'points', 'weight', 'dangerLevel', 'climate', 'description', 'color')
- **'place_settlement'** / **'draw_settlement'**: Stadt, Dorf, Festung, Hafen ('name', 'settlementType': 'hauptstadt'|'grossstadt'|'stadt'|'dorf'|'hafen'|'festung', 'parent', 'position', 'onCoast', 'coastDirection', 'population', 'description', 'color')
- **'place_poi'**: Point of Interest / Gebäude / Taverne / Tempel / Mine ('name', 'poiType', 'parent', 'description', 'level')
- **'create_route'** / **'draw_route'**: Seeweg oder Handelsstraße ('name', 'routeType': 'seeweg'|'landweg', 'from', 'to', 'waypoints', 'distanceKm', 'description', 'color')
- **'create_feature'** / **'draw_feature'**: Vulkan, Gebirge, Wald, Fluss, See ('name', 'featureType': 'vulkan'|'gebirge'|'wald'|'fluss'|'see'|'wueste'|'sumpf', 'parent', 'direction', 'points', 'size', 'description', 'color')`;

      const promptContext = `WELTKONTEXT:
- Welt-Titel: "${params.worldTitle}"
- Genres: ${params.genres.join(', ')}
- Setting-Beschreibung: "${params.worldDescription || ''}"
- Generierungs-Modus: ${params.scopeMode === 'targeted_zone' ? 'Gezielte Teil-Zone' : 'Vollständige Weltkarte'}
- Fokus-Quadrant: ${params.targetQuadrant || 'Zentrum'} (Bereich X: 10..230, Y: 10..130, Zentrum: ${params.centerCoords?.x || 120}, ${params.centerCoords?.y || 70})
- Ziel-Einwohnerzahl: ${populationText}
- Vorgegebene Städte: ${params.citiesCount !== undefined ? params.citiesCount : 'passend berechnen'}
- Vorgegebene Dörfer: ${params.villagesCount !== undefined ? params.villagesCount : 'passend berechnen'}

${territoriesSummary ? `BEREITS BESTEHENDE GEBIETE AUF DER KARTE:\n${territoriesSummary}\n` : ''}
${loreSummary ? `BEREITS EXISTIERENDER CODEX:\n${loreSummary}\n` : ''}
${params.customElementsList ? `SPEZIFISCHE VORGABEN:\n${params.customElementsList}\n` : ''}

NUTZER-AUFTRAG:
"${params.userPrompt || 'Harmonische, freie geografische Kartenelemente passend zum Setting'}"`;

      const planSchema = {
        type: Type.OBJECT,
        properties: {
          planOverview: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tool: {
                  type: Type.STRING,
                  description: "One of: create_landmass, create_sea, create_sea_zone, place_settlement, place_poi, create_route, create_feature"
                },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                relativeTo: { type: Type.STRING },
                direction: { type: Type.STRING },
                distanceKm: { type: Type.NUMBER },
                radius: { type: Type.NUMBER },
                points: {
                  type: Type.ARRAY,
                  description: "Frei gezeichnete Koordinatenpunkte des Polygons oder Pfades",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER }
                    },
                    required: ["x", "y"]
                  }
                },
                center: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                },
                position: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                },
                waypoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER }
                    }
                  }
                },
                shapeDescription: { type: Type.STRING },
                climate: { type: Type.STRING },
                terrain: { type: Type.STRING },
                coastlineRoughness: { type: Type.NUMBER },
                faction: { type: Type.STRING },
                ruler: { type: Type.STRING },
                population: { type: Type.STRING },
                description: { type: Type.STRING },
                parent: { type: Type.STRING },
                parentSea: { type: Type.STRING },
                settlementType: { type: Type.STRING },
                onCoast: { type: Type.BOOLEAN },
                coastDirection: { type: Type.STRING },
                poiType: { type: Type.STRING },
                level: { type: Type.NUMBER },
                routeType: { type: Type.STRING },
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                featureType: { type: Type.STRING },
                color: { type: Type.STRING }
              },
              required: ["tool", "name"]
            }
          },
          parsedCounts: {
            type: Type.OBJECT,
            properties: {
              population: { type: Type.NUMBER },
              landScale: { type: Type.NUMBER },
              continentsCount: { type: Type.NUMBER },
              seasCount: { type: Type.NUMBER },
              lakesCount: { type: Type.NUMBER },
              islandsCount: { type: Type.NUMBER },
              riversCount: { type: Type.NUMBER },
              mountainsCount: { type: Type.NUMBER },
              forestsCount: { type: Type.NUMBER },
              desertsCount: { type: Type.NUMBER },
              snowCount: { type: Type.NUMBER },
              swampsCount: { type: Type.NUMBER },
              citiesCount: { type: Type.NUMBER },
              villagesCount: { type: Type.NUMBER },
              fortressesCount: { type: Type.NUMBER },
              specialPlacesCount: { type: Type.NUMBER }
            }
          },
          suggestedLore: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "category", "description"]
            }
          }
        },
        required: ["actions"]
      };

      // 1. Initial Plan Generation
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemPrompt}\n\n${promptContext}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: planSchema
        }
      });

      let parsed = JSON.parse(response.text || '{"actions":[]}');
      let currentPlan: DrawingPlan = {
        planOverview: parsed.planOverview,
        actions: parsed.actions || [],
        suggestedLore: parsed.suggestedLore || []
      };

      const mockWorld: WorldSetting = params.world || {
        title: params.worldTitle,
        description: params.worldDescription || '',
        era: 'Klassisch',
        tone: 'Abenteuerlich',
        mapConfig: { kmPerCoordinateUnit: effectiveKmPerUnit }
      };

      // 2. Initial Execution & Validation
      let execResult = executeDrawingPlan(
        currentPlan,
        mockWorld,
        existingTerritoriesList,
        params.loreDatabase || [],
        effectiveKmPerUnit
      );

      // 3. Multi-turn Validation & Plausibility Feedback Auto-Correction Loop
      const hasErrors = !execResult.validation.valid && execResult.validation.issues.some(i => i.level === 'error');
      const hasUnexplainedDensity = execResult.plausibility?.hasUnexplainedExtremeDensity === true;

      if (hasErrors || hasUnexplainedDensity) {
        const errorList = execResult.validation.issues
          .filter(i => i.level === 'error')
          .map(i => `- [${i.code}] ${i.message}`)
          .join('\n');

        const plausibilityFeedback = execResult.plausibility?.plausibilityFeedbackPrompt || '';

        const feedbackItems: string[] = [];
        if (errorList) {
          feedbackItems.push(`Validierungsprobleme:\n${errorList}`);
        }
        if (plausibilityFeedback) {
          feedbackItems.push(plausibilityFeedback);
        }

        const correctionPrompt = `Der zuvor generierte Zeichenplan wies folgende Prüfungs- und Plausibilitätshinweise auf:\n\n${feedbackItems.join('\n\n')}\n\nBitte erstelle einen korrigierten, vollständig plausiblen Zeichenplan ('DrawingPlan'):\n- Zeichne für Landmassen eine ausreichend große freie, organische Küstenlinie ('radius' vergrößern, z.B. 22-30 für 10.000 Einwohner) oder platziere eine explizite befestigte Hafenstadt/Handelszentrum ('place_settlement' mit 'hafen'), die die dichte Bevölkerung logisch stützt.\n- Stelle sicher, dass alle Eltern-Beziehungen ('parent', 'parentSea'), Küstenplatzierungen ('onCoast', 'coastDirection') und Routenendpunkte ('from', 'to') fehlerfrei zusammenpassen.`;

        try {
          const correctionResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${systemPrompt}\n\n${promptContext}\n\n${correctionPrompt}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: planSchema
            }
          });

          const correctedParsed = JSON.parse(correctionResponse.text || '{"actions":[]}');
          if (correctedParsed && Array.isArray(correctedParsed.actions) && correctedParsed.actions.length > 0) {
            currentPlan = {
              planOverview: correctedParsed.planOverview,
              actions: correctedParsed.actions,
              suggestedLore: correctedParsed.suggestedLore || currentPlan.suggestedLore
            };

            execResult = executeDrawingPlan(
              currentPlan,
              mockWorld,
              existingTerritoriesList,
              params.loreDatabase || [],
              effectiveKmPerUnit
            );
          }
        } catch (corrErr) {
          console.warn("Auto-correction pass soft fail, continuing with repaired execution:", corrErr);
        }
      }

      return {
        territories: execResult.territories,
        parsedCounts: parsed.parsedCounts,
        suggestedLore: execResult.suggestedLore,
        drawingPlan: currentPlan,
        holdings: execResult.holdings,
        connections: execResult.connections,
        validation: execResult.validation,
        plausibility: execResult.plausibility
      };
    });
  }

  /**
   * Generates themed, context-rich sub-zones for partitioning a sea or territory.
   */
  static async generateSubdivideZonesWithAI(
    parentName: string,
    parentType: string,
    userPrompt: string,
    zoneCount: number = 3,
    worldContext?: { title?: string; era?: string; tone?: string }
  ): Promise<{
    zones: Array<{
      name: string;
      type: string;
      color: string;
      description: string;
      dangerLevel: string;
      weight: number;
      tags: string[];
      climate?: string;
    }>;
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Du bist ein Meister-Kartograf und Worldbuilder für Pen & Paper Rollenspiele.
Die Aufgabe ist, das bestehende Meeresgebiet / Territorium "${parentName}" (Typ: ${parentType}) in genau ${zoneCount} thematisch spannende, nahtlos aneinandergrenzende Teilzonen (Meeresgürtel, Sektoren oder Hoheitsbereiche) zu unterteilen.

Welt-Kontext:
- Titel/Setting: ${worldContext?.title || 'Fantasy / Nautical'}
- Ära: ${worldContext?.era || 'Klassisch'}
- Ton: ${worldContext?.tone || 'Abenteuerlich'}

Benutzeranweisung / Wunsch für die Zonen:
"${userPrompt || 'Unterteile das Meer in sinnvolle Navigationszonen, Gefahrenbereiche und Gewässer mit unterschiedlichen Wetter- und Monsterbedingungen.'}"

REGELN FÜR DIE TEILZONEN:
1. Erzeuge genau ${zoneCount} Zonen.
2. Jede Zone muss einen unverwechselbaren Namen haben (z.B. "Calm Belt (Nord)", "Sturmgürtel der Neuen Welt", "Korallenmeer der Sirenen", "Südliche Handelsstraße").
3. Weise passende maritime Farben zu (z.B. #0284c7 für klares Meer, #0369a1 für Tiefsee/Sturm, #0ea5e9 für ruhige Küstengewässer, #0f766e für Riffe/Lagunen, #1e293b für Geistermeer, #be123c für feindliche Piratengewässer).
4. Vergib sinnvolle 'weight' Werte (z.B. 0.25, 0.5, 0.25), die die relative Ausdehnung beschreiben.
5. Beschreibe prägnant Gefahrenstufe, Besonderheiten (Strömungen, Seemonster, Windstille) und Atmosphäre.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              zones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    color: { type: Type.STRING },
                    description: { type: Type.STRING },
                    dangerLevel: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    climate: { type: Type.STRING }
                  },
                  required: ["name", "type", "color", "description", "weight"]
                }
              }
            },
            required: ["zones"]
          }
        }
      });

      return JSON.parse(response.text || '{"zones":[]}');
    });
  }

  static async harmonizeFactionAndMembers(params: {
    factionData: {
      title?: string;
      description?: string;
      details?: Record<string, any>;
    };
    leaderProfile?: {
      name: string;
      role?: string;
      personality?: string;
      goal?: string;
      bio?: string;
      isPlayer?: boolean;
      details?: any;
    };
    members: Array<{
      id?: string;
      name: string;
      role?: string;
      job?: string;
      characterId?: string;
      bio?: string;
      personality?: string;
      tasks?: string;
      joinedDate?: string;
      status?: string;
      isPlayer?: boolean;
    }>;
    worldContext?: {
      title?: string;
      era?: string;
      tone?: string;
      description?: string;
      rules?: any;
    };
    allLoreEntries?: any[];
    userPrompt?: string;
    keepExistingDetails?: boolean;
  }): Promise<{
    factionDetails: Record<string, any>;
    characterUpdates: Array<{
      characterName: string;
      characterId?: string;
      role?: string;
      relationshipSummary?: string;
      conductSummary?: string;
      relationships: any[];
    }>;
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const { factionData, leaderProfile, members, worldContext, allLoreEntries, userPrompt, keepExistingDetails } = params;

      const factionTitle = factionData.title?.trim() || 'Fraktion';
      const existingDetails = factionData.details || {};

      // 1. Leader Information Block
      let leaderInfo = 'Kein spezifischer Anführer festgelegt.';
      if (leaderProfile && leaderProfile.name) {
        leaderInfo = `Name: ${leaderProfile.name} ${leaderProfile.isPlayer ? '(Hauptcharakter / Nutzer)' : ''}
Rolle / Titel: ${leaderProfile.role || 'Anführer'}
Persönlichkeit / Werte: ${leaderProfile.personality || 'Unbekannt'}
Ziele & Motivation: ${leaderProfile.goal || 'Unbekannt'}
Hintergrund / Bio: ${leaderProfile.bio || 'Unbekannt'}`;
      } else if (existingDetails.leader) {
        leaderInfo = `Name des Anführers: ${existingDetails.leader}`;
      }

      // 2. Members Information Block
      const memberListFormatted = members.map((m, idx) => {
        return `[Mitglied ${idx + 1}] Name: ${m.name} ${m.isPlayer ? '(Nutzer/Spieler)' : ''} | Funktion: ${m.job || m.role || 'Mitglied'} | Bisherige Aufgaben: ${m.tasks || 'Keine'} | Status: ${m.status || 'Aktiv'} | Seit: ${m.joinedDate || 'Unbekannt'} | Persönlichkeit/Bio: ${m.personality || m.bio || 'Im Codex registriert'}`;
      }).join('\n');

      // 3. World Context Block
      let worldContextStr = '';
      if (worldContext) {
        worldContextStr = `\n### WELTKONTEXT:
- Welt: "${worldContext.title || ''}" (${worldContext.era || ''})
- Ton & Genre: "${worldContext.tone || ''}"
- Kurzbeschreibung: "${worldContext.description || ''}"\n`;
      }

      // 4. Prompt Assembly
      const prompt = `Du bist ein Meister-Narrativ- und Fraktionsarchitekt für tiefgründige Rollenspiel-Systeme.
Deine Aufgabe ist eine vollständige, hochqualitative und perfekt harmonisierte Synchronisation der Fraktion "${factionTitle}" und aller ihrer Mitglieder.

${worldContextStr}
### FRAKTION: "${factionTitle}"
Bisherige Beschreibung: ${factionData.description || 'Keine Beschreibung vorhanden'}

### LEITFIGUR / ANFÜHRER DER FRAKTION:
${leaderInfo}

### REGISTRIERTE MITGLIEDER DER FRAKTION:
${memberListFormatted.length > 0 ? memberListFormatted : 'Keine spezifischen Mitglieder eingetragen. Erstelle passende Schlüsselmitglieder passend zur Fraktion.'}

${userPrompt?.trim() ? `### ZUSÄTZLICHE NUTZERANWEISUNG:\n"${userPrompt.trim()}"\n` : ''}

${keepExistingDetails && Object.keys(existingDetails).length > 0 ? `### BESTEHENDE FRAKTIONSDETAILS (Ergänzungsmodus aktiv - Behalte bestehende Eckdaten sinngemäß bei und vertiefe sie):\n${JSON.stringify(existingDetails, null, 2)}\n` : ''}

### BINDENDE REGELN & SYSTEM-ANFORDERUNGEN:

1. EINFLUSS DES ANFÜHRERS:
   - Die Grundphilosophie ("philosophy"), die Gründungsgeschichte ("foundingReason"), das ursprüngliche Ziel ("originalGoal"), die aktuellen Ziele ("currentGoal") und der Führungsstil ("leadershipStructure") werden MAßGEBLICH vom Profil, den Werten und der Biografie des Anführers bestimmt.
   - Falls der Nutzer/Spieler der Anführer ist, muss sich seine Identität und Rolle in der Ausrichtung der Fraktion spiegeln.

2. GEMEINSAME VERGANGENHEIT & FRAKTIONS-DYNAMIK:
   - Alle Mitglieder dieser Fraktion haben eine gemeinsame Vergangenheit. Sie kennen sich, arbeiten zusammen oder haben interne Rivalitäten/Loyalitäten.
   - "cohesion": Erkläre präzise, was die Gruppe emotional, ideologisch oder finanziell zusammenhält.
   - "internalConflicts": Benenne authentische interne Reibungspunkte, Meinungsverschiedenheiten oder Spannungen zwischen bestimmten Mitgliedern oder Fraktionsflügeln.

3. RESSOURCEN & WIRTSCHAFT (Schritte 6 bis 9):
   - Befülle ALLE Wirtschafts- und Ressourcenfelder ("resourceEconomy", "resourceTerritory", "resourceMaterials", "resourceMembers", "resourceMilitary", "resourceInfluence", "resourceKnowledge", "resourceTrade", "economicAgreements", "economyDirectives", "pendingDecisions") mit greifbaren, passenden Details.

4. MITGLIEDER-VERWALTUNG ("members"):
   - Gib für JEDES Mitglied der Fraktion (inkl. Anführer) ein strukturiertes Objekt mit passendem 'job', konkreten 'tasks' (für das Wirtschafts- und Managementsystem), 'joinedDate' (wie lange in der Fraktion) und 'status' zurück.

5. WECHSELSEITIGE BEZIEHUNGEN & VERHALTEN ("characterUpdates"):
   - Für JEDES Mitglied der Fraktion (und Anführer) musst du ein 'characterUpdates'-Objekt erstellen.
   - Jedes dieser Objekte enthält:
     * "characterName": Der exakte Name der Person.
     * "relationshipSummary": Fließtext-Zusammenfassung über die Rolle und Beziehungen in der Fraktion.
     * "conductSummary": Fließtext-Zusammenfassung über das allgemeine Verhalten gegenüber Kameraden und Untergebenen/Vorgesetzten.
     * "relationships": Ein Array von tiefen, strukturierten Beziehungen zu den ANDEREN Mitgliedern dieser Fraktion.
     * Jede Beziehung muss VOLLSTÄNDIG befüllt sein: "targetCharacter", "type", "relationshipStatus", "addressFromSelfToTarget", "addressFromTargetToSelf", "behavior", "aiDirectives", "perceptionSelfToTarget", "perceptionTargetToSelf", "secretsAndMotives", "boundariesAndTaboos", "sharedPast" (konkrete gemeinsame Erlebnisse), "keyMemories", "valuesSelfToTarget", "valuesTargetToSelf", und 1-2 "keyEvents".

6. SPRACHE & STIL:
   - Alle Felder müssen vollständig auf Deutsch ausgefüllt sein.
   - Verwende neutrale, präzise und stimmungsvolle Beschreibungen. Keine Platzhalter. Keine Emojis in den Inhalten.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              philosophy: { type: Type.STRING, description: "Leitmotiv oder Grundphilosophie der Fraktion." },
              foundingReason: { type: Type.STRING, description: "Gründungsgeschichte und Anlass der Fraktionsentstehung." },
              originalGoal: { type: Type.STRING, description: "Das ursprüngliche Ziel bei der Gründung." },
              currentGoal: { type: Type.STRING, description: "Aktuelle und langfristige Ziele der Fraktion." },
              keyHistoricalEvents: { type: Type.STRING, description: "Prägende historische Meilensteine und Ereignisse." },
              evolutionAndChange: { type: Type.STRING, description: "Wandel und Entwicklung der Fraktion im Laufe der Zeit." },
              leadershipStructure: { type: Type.STRING, description: "Führungsstruktur (z.B. Autokratisch, Rat, Hierarchie)." },
              leader: { type: Type.STRING, description: "Name des Anführers / der Leitfigur." },
              cohesion: { type: Type.STRING, description: "Was die Mitglieder und Gefolgsleute zusammenhält." },
              internalConflicts: { type: Type.STRING, description: "Interne Spannungen oder Machtkämpfe zwischen Mitgliedern." },
              allies: { type: Type.STRING, description: "Natürliche Verbündete der Fraktion." },
              rivals: { type: Type.STRING, description: "Rivalen um Macht, Einfluss oder Territorium." },
              enemies: { type: Type.STRING, description: "Offene Feinde und Kriegsgegner." },
              convenienceAlliances: { type: Type.STRING, description: "Zweckbündnisse und pragmatische Allianzen." },
              unresolvedConflicts: { type: Type.STRING, description: "Ungelöste alte Konflikte und Rechnungen." },
              status: { type: Type.STRING, description: "Haltung gegenüber Spielern / Abenteurern." },
              economicAgreements: { type: Type.STRING, description: "Wirtschafts- und Handelsabkommen im Bündnissystem." },
              economyDirectives: { type: Type.STRING, description: "Fraktions-Direktiven und strategische Wirtschaftsaufträge." },
              pendingDecisions: { type: Type.STRING, description: "Offene Verwaltungs- und Führungsentscheidungen." },
              resourceEconomy: { type: Type.STRING, description: "Finanzen, Schatzkammern und Einnahmequellen." },
              resourceTerritory: { type: Type.STRING, description: "Beherrschtes Territorium und Stützpunkte." },
              resourceMaterials: { type: Type.STRING, description: "Zugang zu Rohstoffen und Gütern." },
              resourceMembers: { type: Type.STRING, description: "Mitgliederzahl, Ausbildung und Rekrutierung." },
              resourceMilitary: { type: Type.STRING, description: "Bewaffnete Streitkräfte, Flotte und Elitekämpfer." },
              resourceInfluence: { type: Type.STRING, description: "Politischer Einfluss auf Höfe und Herrscher." },
              resourceKnowledge: { type: Type.STRING, description: "Arkane Forschung, Wissen, Technologie und Spionage." },
              resourceTrade: { type: Type.STRING, description: "Handelsrouten, Monopole und Posten." },
              members: {
                type: Type.ARRAY,
                description: "Harmonisierte Mitgliederliste mit Rollen, Aufgaben und Beitrittsdaten.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    job: { type: Type.STRING },
                    tasks: { type: Type.STRING },
                    joinedDate: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ["name", "job", "tasks", "joinedDate"]
                }
              },
              characterUpdates: {
                type: Type.ARRAY,
                description: "Aktualisierte Profile und Beziehungen für jedes Mitglied/jeden Charakter der Fraktion.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    characterName: { type: Type.STRING, description: "Name des Charakters." },
                    relationshipSummary: { type: Type.STRING, description: "Zusammenfassung der Beziehungen zur Gruppe/Fraktion." },
                    conductSummary: { type: Type.STRING, description: "Zusammenfassung des Verhaltens gegenüber den anderen Mitgliedern." },
                    relationships: {
                      type: Type.ARRAY,
                      items: this.getRelationshipItemSchema(),
                      description: "Detaillierte wechselseitige Beziehungen zu anderen Mitgliedern der Fraktion."
                    }
                  },
                  required: ["characterName", "relationshipSummary", "conductSummary", "relationships"]
                }
              }
            },
            required: [
              "philosophy", "foundingReason", "originalGoal", "currentGoal", "keyHistoricalEvents",
              "evolutionAndChange", "leadershipStructure", "leader", "cohesion", "internalConflicts",
              "allies", "rivals", "enemies", "convenienceAlliances", "unresolvedConflicts", "status",
              "economicAgreements", "economyDirectives", "pendingDecisions", "resourceEconomy",
              "resourceTerritory", "resourceMaterials", "resourceMembers", "resourceMilitary",
              "resourceInfluence", "resourceKnowledge", "resourceTrade", "members", "characterUpdates"
            ]
          }
        }
      });

      const parsed = this.parseJSONSafely(response.text || '{}', {});

      const factionFields = [
        'philosophy', 'foundingReason', 'originalGoal', 'currentGoal', 'keyHistoricalEvents',
        'evolutionAndChange', 'leadershipStructure', 'leader', 'cohesion', 'internalConflicts',
        'allies', 'rivals', 'enemies', 'convenienceAlliances', 'unresolvedConflicts', 'status',
        'economicAgreements', 'economyDirectives', 'pendingDecisions', 'resourceEconomy',
        'resourceTerritory', 'resourceMaterials', 'resourceMembers', 'resourceMilitary',
        'resourceInfluence', 'resourceKnowledge', 'resourceTrade'
      ];

      const factionDetails: Record<string, any> = {};
      for (const field of factionFields) {
        if (parsed[field] !== undefined) {
          factionDetails[field] = parsed[field];
        } else if (existingDetails[field] !== undefined && keepExistingDetails) {
          factionDetails[field] = existingDetails[field];
        }
      }

      // Preserve or map member IDs
      if (Array.isArray(parsed.members)) {
        factionDetails.members = parsed.members.map((m: any, idx: number) => {
          const orig = members.find(origM => origM.name?.toLowerCase().trim() === m.name?.toLowerCase().trim()) || members[idx];
          return {
            id: orig?.id || m.id || `${Date.now()}-mem-${Math.random().toString(36).substr(2, 5)}`,
            name: m.name || orig?.name || `Mitglied ${idx + 1}`,
            job: m.job || orig?.job || orig?.role || 'Mitglied',
            tasks: m.tasks || orig?.tasks || '',
            joinedDate: m.joinedDate || orig?.joinedDate || '',
            status: m.status || orig?.status || 'Aktiv',
            characterId: orig?.characterId || ''
          };
        });
      }

      const characterUpdates = Array.isArray(parsed.characterUpdates) ? parsed.characterUpdates : [];

      return {
        factionDetails,
        characterUpdates
      };
    });
  }

  static async smartFillTechnique(
    input: {
      powerSourceName?: string;
      powerSourceId?: string;
      baseAbilityId: string;
      baseAbilityName: string;
      element: string;
      abilityType: string;
      additionalBaseAbilities?: { id: string; name: string; element: string; abilityType: string }[];
      description: string;
      characterName?: string;
      characterRole?: string;
      worldTitle?: string;
    }
  ): Promise<{
    name: string;
    description: string;
    type: string;
    subtype: string;
    tier: string;
    targetType: string;
    effects: string[];
    costResourceName: string;
    costValue: number;
    cost: string;
    range?: string;
    duration?: string;
  }> {
    return this.callWithRetry(async () => {
      const ai = this.getAI();
      const prompt = `Du bist ein erfahrener Rollenspiel- und Kampfsystem-Architekt für AdventureForge.
Erstelle eine neue, präzise und balancierte RPG-Technik basierend auf der vorgegebenen Fähigkeitshierarchie.

HIERARCHIE & VORGABEN:
- Kraftquelle: "${input.powerSourceName || 'Standard-Kraftquelle'}"
- Grundfähigkeit: "${input.baseAbilityName}"
- Element / Aspekt: "${input.element}"
- Fähigkeitsart: "${input.abilityType}"
${input.additionalBaseAbilities && input.additionalBaseAbilities.length > 0 
  ? `- Weitere verknüpfte Grundfähigkeiten: ${input.additionalBaseAbilities.map(b => `${b.name} (${b.element} · ${b.abilityType})`).join(', ')}`
  : ''}
${input.characterName ? `- Charakter: "${input.characterName}" (${input.characterRole || 'Abenteurer'})` : ''}
${input.worldTitle ? `- Welt: "${input.worldTitle}"` : ''}

NUTZERBESCHREIBUNGS-WUNSCH:
"${input.description}"

STRENGE REGELN:
1. TECHNIK MUSS AUF DER GRUNDFÄHIGKEIT BASIEREN: Die Technik darf nicht unabhängig von der Grundfähigkeit erzeugt werden, sondern muss direkt aus "${input.baseAbilityName}" (${input.element} · ${input.abilityType}) hervorgehen.
2. ABSOLUT KEINE EMOJIS! Verwende in keinem Feld Emojis, Symbole oder Icons.
3. Name: Erfinde einen prägnanten, unverwechselbaren Namen für die Technik (z.B. "Eiskuppel", "Flammenlanze", "Schattenschleier", "Gefrorener Sturm").
4. Description: Präzise Beschreibung (30-60 Wörter) von Ablauf, visueller Wirkung und mechanischem Nutzen.
5. Typ: Wähle das passendste aus: 'Angriff', 'Verteidigung', 'Transformation', 'Support', 'Heilung', 'Zustandseffekt', 'Spezial', 'Beschwörung'.
6. Subtyp: Konkreter Subtyp (z.B. 'Barriere / Gebietskontrolle', 'Projektil / Fernkampf', 'Nahkampf-Klinge', 'Schild', 'Flächenangriff', 'Verstärkung').
7. Tier: 'Tier 1' (Standard / Grundtechnik), 'Tier 2' (Fortgeschritten), 'Tier 3' (Meisterhaft), 'Tier 4' (Ultimativ).
8. targetType: Geeignetes Ziel (z.B. 'Selbst / Verbündete / Feinde', 'Einzelziel (Gegner)', 'Fläche (Gegner)', 'Selbst', 'Verbündete').
9. effects: Array von 2-4 prägnanten Anwendungsmöglichkeiten / Effekten (z.B. ["Schutz", "Einsperren", "Gebietskontrolle"]).
10. costResourceName & costValue: Passende Ressourcenbezeichnung (z.B. 'Mana', 'Ausdauer', 'Energie') und Kosten (z.B. 10 für Tier 1, 25 für Tier 2, 50 für Tier 3, 100 für Tier 4).

Antworte ausschließlich mit einem validen JSON-Objekt.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        name: parsed.name || 'Neue Technik',
        description: parsed.description || input.description,
        type: parsed.type || 'Angriff',
        subtype: parsed.subtype || 'Einzelschuss',
        tier: parsed.tier || 'Tier 1',
        targetType: parsed.targetType || 'Selbst / Verbündete / Feinde',
        effects: Array.isArray(parsed.effects) ? parsed.effects : (parsed.applications || ['Schaden', 'Effekt']),
        costResourceName: parsed.costResourceName || 'Mana',
        costValue: typeof parsed.costValue === 'number' ? parsed.costValue : 15,
        cost: parsed.cost || `${parsed.costValue || 15} ${parsed.costResourceName || 'Mana'}`,
        range: parsed.range || 'Nahkampf / Mittlere Distanz',
        duration: parsed.duration || 'Sofort'
      };
    });
  }

}

export const smartFillTechnique = GeminiService.smartFillTechnique.bind(GeminiService);
export const generateEconomyHoldings = GeminiService.generateEconomyHoldings.bind(GeminiService);
export const smartFillEconomyHolding = async (world: WorldSetting, holding: Partial<EconomyHolding>, loreDatabase: any[] = [], isSupplementMode: boolean = true, customPrompt?: string): Promise<Partial<EconomyHolding>> => {
  const finalPrompt = customPrompt || 'Ergänze alle Felder vollständig basierend auf dem Betriebstyp und den Weltinformationen';
  return GeminiService.smartFillEconomyHolding(finalPrompt, holding, world, loreDatabase, isSupplementMode);
};
export const upgradeNamelessStaffToCharacter = GeminiService.upgradeNamelessStaffToCharacter.bind(GeminiService);
export const generateHoldingActivityLog = async (world: WorldSetting, holding: EconomyHolding, count?: number): Promise<EconomyLogEntry[]> => {
  return GeminiService.generateHoldingActivityLog(holding, world);
};
export const generateSubtasksForOrder = GeminiService.generateSubtasksForOrder.bind(GeminiService);
export const generateTaskFromDuty = GeminiService.generateTaskFromDuty.bind(GeminiService);
export const suggestOperationalTasks = GeminiService.suggestOperationalTasks.bind(GeminiService);
export const deriveRoleTasksFromChat = GeminiService.deriveRoleTasksFromChat.bind(GeminiService);

