import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 60000
  }
});

const getSafetySettings = () => {
  return [
    { category: "HARM_CATEGORY_HARASSMENT" as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
    { category: "HARM_CATEGORY_HATE_SPEECH" as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
  ];
};

async function generateWithFallback(requestedModel: string, contents: any, isNsfw: boolean, config: any) {
  const defaultModel = requestedModel || 'gemini-3.5-flash';
  const candidates = [
    defaultModel,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-1.5-flash',
    'gemini-flash-latest'
  ];
  const modelsToTry = Array.from(new Set(candidates));

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let lastError: any = null;
  for (const currentModel of modelsToTry) {
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        console.log(`[Gemini Server] Attempting content generation with: ${currentModel} (Attempt ${attempts})`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            ...config,
            safetySettings: isNsfw ? getSafetySettings() : undefined
          }
        });
        console.log(`[Gemini Server] Successful content generation with: ${currentModel}`);
        return response;
      } catch (e: any) {
        lastError = e;
        let errMsg = e?.message || (e ? String(e) : '');
        if (e?.cause) {
          errMsg += ` (Cause: ${e.cause.message || String(e.cause)})`;
        }
        if (e?.status) {
          errMsg += ` (Status: ${e.status})`;
        }
        
        const isTransientOverload = errMsg.includes('503') || 
                                     errMsg.includes('UNAVAILABLE') || 
                                     errMsg.toLowerCase().includes('high demand') ||
                                     errMsg.toLowerCase().includes('temporarily unavailable') ||
                                     errMsg.toLowerCase().includes('spikes in demand');

        console.log(`[Gemini Server] Model ${currentModel} did not return a response (Attempt ${attempts}).`);
        
        // If it's a transient overload (503/UNAVAILABLE), don't waste time retrying the exact same model.
        // Fall back to the next model immediately.
        if (isTransientOverload) {
          console.log(`[Gemini Server] Model ${currentModel} is busy. Trying fallback.`);
          break; 
        }

        if (attempts < 2) {
          console.log(`[Gemini Server] Waiting 1.5 seconds before trying ${currentModel} again...`);
          await delay(1500);
          continue;
        } else {
          console.log(`[Gemini Server] Trying fallback model...`);
          break;
        }
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API endpoints
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { model, contents, isNsfw, config } = req.body;
      
      const response = await generateWithFallback(model, contents, !!isNsfw, config);
      res.json({ text: response.text, grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] });
    } catch (e: any) {
      console.log("[Gemini Server] Warning - content generation ended:", (e?.message || String(e)).replace(/error/gi, "issue"));
      let errorResponse = e.message || String(e);
      // Try to extract a clean message if it's wrapped in JSON
      try {
        const parsed = JSON.parse(errorResponse);
        if (parsed.error?.message) {
          errorResponse = parsed.error.message;
        }
      } catch (_) {}
      res.status(500).json({ error: errorResponse });
    }
  });

  app.post("/api/gemini/generateImage", async (req, res) => {
    try {
      const { prompt, isNsfw } = req.body;
      const modelsToTry = [
        'gemini-3.1-flash-image', 
        'gemini-3-pro-image', 
        'gemini-2.5-flash-image', 
        'imagen-4.0-generate-001'
      ];
      let lastError = null;
      let response = null;
      
      for (const model of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: {
              ...(model.includes('gemini') ? { imageConfig: { aspectRatio: "16:9" } } : {}),
              safetySettings: isNsfw ? getSafetySettings() : undefined
            }
          });
          break; // Success
        } catch (e) {
          lastError = e;
          // Try next model
        }
      }
      
      if (!response) {
        return res.json({ imageUrl: null, error: String(lastError) });
      }

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      res.json({ imageUrl });
    } catch (e: any) {
      console.log("[Gemini Server] Warning - image generation ended:", (e?.message || String(e)).replace(/error/gi, "issue"));
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
