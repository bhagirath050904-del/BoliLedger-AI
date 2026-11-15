import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatGeminiError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err || fallback);
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return "Gemini API rate limit or quota exceeded (429). Check your quota or upgrade to a billing-enabled API key in Settings > Secrets.";
  }
  if (raw.includes("403") || raw.includes("PERMISSION_DENIED") || raw.includes("API_KEY_INVALID")) {
    return "Gemini API key permission error. Please verify GEMINI_API_KEY in Settings > Secrets.";
  }
  return raw || fallback;
}

const app = express();
app.use(express.json({ limit: "15mb" }));

app.post("/api/voice/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType, voiceLanguage } = req.body as {
      audioBase64?: string;
      mimeType?: string;
      voiceLanguage?: string;
    };

    if (!audioBase64 || !mimeType) {
      res.status(400).json({ error: "Missing audio payload or mimeType." });
      return;
    }

    const ai = getAiClient();
    const cleanBase64 = audioBase64.includes(",")
      ? audioBase64.split(",")[1]
      : audioBase64;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Transcribe this Indian shopkeeper voice command accurately. Expected language hint: ${
              voiceLanguage || "Hindi (hi-IN) or Hinglish"
            }. Preserve customer names, Indian item names (chai, samosa, cheeni, doodh, etc.), quantities, and rupee numbers clearly. Output only the transcribed text.`,
          },
        ],
      },
    });

    const transcript = (response.text ?? "").trim();
    res.json({ transcript });
  } catch (err: unknown) {
    console.error("Transcription error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to transcribe audio.";
    res.status(500).json({ error: message });
  }
});

app.post("/api/voice/parse", async (req, res) => {
  try {
    const {
      transcript,
      uiLanguage,
      voiceLanguage,
      customers,
      inventory,
      todaySales,
      pendingUdhaar,
    } = req.body as {
      transcript?: string;
      uiLanguage?: "en" | "hi";
      voiceLanguage?: string;
      customers?: Array<{ id: string; name: string; balance: number }>;
      inventory?: Array<{
        id: string;
        name: string;
        unit: string;
        sellingPrice: number;
        stock: number;
      }>;
      todaySales?: number;
      pendingUdhaar?: number;
    };

    if (!transcript || !transcript.trim()) {
      res.status(400).json({ error: "Transcript cannot be empty." });
      return;
    }

    const ai = getAiClient();

    const customerContext = (customers ?? [])
      .slice(0, 40)
      .map((c) => `${c.name} (id:${c.id}, balance:₹${c.balance})`)
      .join("; ");

    const inventoryContext = (inventory ?? [])
      .slice(0, 50)
      .map(
        (p) =>
          `${p.name} (id:${p.id}, unit:${p.unit}, price:₹${p.sellingPrice}, stock:${p.stock})`
      )
      .join("; ");

    const systemInstruction = `You are BoliLedger AI, an expert multilingual bookkeeping assistant for Indian small shopkeepers, chaiwalas, street vendors, and kirana stores.
Parse the shopkeeper's spoken command (which may be in Hindi Devanagari, Hinglish/Romanized Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Punjabi, Kannada, or English) into a single structured accounting action.

Intent rules:
- SALE: Cash or UPI sale of goods (e.g., "50 rupaye ki chai bechi", "Aaj 200 ka doodh cash mein", "Sold 4 samosas for 60").
- UDHAAR_GIVEN: Credit given to a customer (e.g., "Ramesh ke naam 120 udhaar likho", "Suresh ko 50 rupaye ki chai udhaar di", "Add 150 credit for Vikram").
- PAYMENT_RECEIVED: Customer paying back previous udhaar / jama (e.g., "Ramesh ne 300 rupaye diye", "Vikram paid 200 udhaar wapas", "Sunita jama 100").
- ADD_INVENTORY: Adding a new product or restocking existing inventory (e.g., "10 packet Parle-G stock mein daalo", "5 kilo cheeni kharidi 220 rupaye mein", "Add 20 L milk at 55 per litre").
- EXPENSE: Shop operating expense (e.g., "Gas cylinder 900 rupaye kharcha", "Bijli bill 600 diya", "Paid 250 for tea leaves and ginger expense").
- QUERY: Asking about current business numbers or a customer's balance (e.g., "Ramesh ka kitna udhaar baaki hai?", "Aaj ki kul bikri kitni hui?").
- UNKNOWN: Only if completely unintelligible or unrelated to shop business.

Matching rules:
- Match customer names closely to Existing Customers list when phonetic similarity exists (e.g. "Ramesh ji" -> "Ramesh Sharma" if listed). If not found, output the clean capitalized customer name.
- Match product names closely to Existing Inventory list when mentioned (e.g. "cheeni"/"sugar" -> "Sugar (Cheeni)" with its matchedProductId). If multiple items are mentioned, list each in items[].
- If total amount is not explicitly stated for items that match inventory prices, compute amount = sum(quantity * sellingPrice). If explicitly stated (e.g. "120 rupaye ki chai aur samosa"), ensure amount equals 120.
- Generate clear, polite confirmation summaries in BOTH English (confirmationSummaryEn) and Hindi Devanagari (confirmationSummaryHi) so the shopkeeper can verify before saving.
- For QUERY intent, answer directly using the provided Shop Context in queryAnswerEn and queryAnswerHi.

Shop Context:
Today's Sales: ₹${todaySales ?? 0}
Total Pending Udhaar: ₹${pendingUdhaar ?? 0}
Existing Customers: ${customerContext || "None yet"}
Existing Inventory: ${inventoryContext || "None yet"}
Preferred UI Language: ${uiLanguage === "hi" ? "Hindi" : "English"}
Spoken Language Hint: ${voiceLanguage || "hi-IN"}`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: transcript.trim(),
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description:
                "One of: SALE, UDHAAR_GIVEN, PAYMENT_RECEIVED, ADD_INVENTORY, EXPENSE, QUERY, UNKNOWN",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence between 0 and 1",
            },
            customerName: {
              type: Type.STRING,
              description: "Customer name if applicable, else empty string",
            },
            matchedCustomerId: {
              type: Type.STRING,
              description: "Existing customer ID if matched, else empty string",
            },
            amount: {
              type: Type.NUMBER,
              description: "Total rupee amount in INR",
            },
            paymentMode: {
              type: Type.STRING,
              description: "One of: CASH, UPI, UDHAAR",
            },
            expenseCategory: {
              type: Type.STRING,
              description:
                "Category for EXPENSE e.g. Milk & Raw Material, Gas & Fuel, Rent & Utilities, Transport, Other",
            },
            notes: {
              type: Type.STRING,
              description: "Short clean note describing the transaction",
            },
            confirmationSummaryEn: {
              type: Type.STRING,
              description:
                "Concise English confirmation question/statement before saving",
            },
            confirmationSummaryHi: {
              type: Type.STRING,
              description:
                "Natural Hindi Devanagari confirmation question/statement before saving",
            },
            queryAnswerEn: {
              type: Type.STRING,
              description: "Direct answer in English if intent is QUERY",
            },
            queryAnswerHi: {
              type: Type.STRING,
              description: "Direct answer in Hindi if intent is QUERY",
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  matchedProductId: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                },
                required: [
                  "productName",
                  "quantity",
                  "unit",
                  "unitPrice",
                  "totalPrice",
                ],
              },
            },
          },
          required: [
            "intent",
            "confidence",
            "amount",
            "paymentMode",
            "confirmationSummaryEn",
            "confirmationSummaryHi",
            "items",
          ],
        },
      },
    });

    const rawText = (response.text ?? "{}").trim();
    const parsed = JSON.parse(rawText);
    res.json({ parsed });
  } catch (err: unknown) {
    console.error("Voice parse error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to parse voice command.";
    res.status(500).json({ error: message });
  }
});

app.post("/api/voice/speak", async (req, res) => {
  try {
    const { text, language } = req.body as {
      text?: string;
      language?: string;
    };

    if (!text || !text.trim()) {
      res.status(400).json({ error: "Text is required." });
      return;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style:
                  language === "hi"
                    ? "Warm, clear, helpful Indian Hindi assistant"
                    : "Warm, clear, helpful Indian English business assistant",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: "No audio returned from TTS model." });
      return;
    }

    res.json({ audioBase64: base64Audio, mimeType: "audio/wav" });
  } catch (err: unknown) {
    console.error("TTS error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate voice audio.";
    res.status(500).json({ error: message });
  }
});

app.post("/api/market/search", async (req, res) => {
  try {
    const { query, language } = req.body as {
      query?: string;
      language?: "en" | "hi";
    };

    if (!query || !query.trim()) {
      res.status(400).json({ error: "Search query is required." });
      return;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `You are helping a small Indian shopkeeper / kirana / chai stall owner. Answer concisely with practical local Indian ₹ prices, units, or business scheme facts in ${
        language === "hi" ? "simple Hindi (Devanagari)" : "clear Indian English"
      }. Query: ${query.trim()}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = (response.text ?? "").trim();
    const rawChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = rawChunks
      .map((chunk) => chunk.web)
      .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
      .slice(0, 5)
      .map((w) => ({
        uri: w.uri,
        title: w.title || w.uri,
      }));

    res.json({ answer, sources });
  } catch (err: unknown) {
    console.error("Market search error:", err);
    res.status(500).json({
      error: formatGeminiError(err, "Failed to fetch live market data."),
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BoliLedger AI server running at http://localhost:${PORT}`);
  });
}

startServer();
