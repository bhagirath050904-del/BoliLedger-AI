# BoliLedger AI Architecture

## 1. Voice-to-Ledger Pipeline

```text
Shopkeeper Speech (Hindi / Regional / Hinglish)
   │
   ├──► Live Web SpeechRecognition (hi-IN, mr-IN, gu-IN, etc.)
   │         OR
   └──► MediaRecorder Audio ──► POST /api/voice/transcribe (gemini-3.5-transcribe)
                                       │
                                       ▼
                        Editable Live Transcript
                                       │
                                       ▼
                POST /api/voice/parse (gemini-4-hydrogen + JSON Schema)
             [Matches existing Customers & Inventory + Extracts Items/Amount]
                                       │
                                       ▼
                 Editable "Confirm Before Saving" Card (+ Optional TTS)
                                       │
                                       ▼
           useLedgerStore.commitVoiceAction() ──► Updates Khata, Stock & Sales
```

## 2. Server-Side API Routes (`server.ts`)

| Endpoint | Method | Model / Tool | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/voice/transcribe` | `POST` | `gemini-3.5-transcribe` | Transcribes recorded audio blobs into Hindi/regional text |
| `/api/voice/parse` | `POST` | `gemini-4-hydrogen` | Parses transcript into structured accounting intent & entities |
| `/api/voice/speak` | `POST` | `gemini-3.8-flash-lite-tts` | Generates WAV spoken confirmation summary |
| `/api/market/search` | `POST` | `gemini-4-hydrogen` + `googleSearch` | Fetches live wholesale/mandi prices & scheme info with source URLs |
| `/api/health` | `GET` | — | Health check endpoint |
