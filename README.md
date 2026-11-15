# BoliLedger AI

> **Voice-first multilingual AI business ledger, digital khata, inventory manager, and WhatsApp payment reminder assistant built for small shopkeepers, chaiwalas, kirana stores, and street vendors.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5%2F7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini API](https://img.shields.io/badge/Google_GenAI_SDK-Gemini_4-1A73E8?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-16A34A?style=flat-square)](./LICENSE)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How to Use the Multilingual Voice Assistant](#how-to-use-the-multilingual-voice-assistant)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Local Setup](#installation--local-setup)
- [API Endpoints](#api-endpoints)
- [Contributing & License](#contributing--license)

---

## Problem Statement

Small shopkeepers, chaiwalas, and street vendors lose money every day because they track customer credit (*udhaar*), daily sales, inventory, and expenses manually on paper slips or from memory. Existing digital accounting tools are built for accountants—requiring manual typing, complex workflows, and technical English fluency that do not fit fast-moving counter shops.

## Our Solution

**BoliLedger AI** turns everyday spoken commands in **Hindi, Hinglish, or regional Indian languages** into structured business records. A shopkeeper simply taps the microphone, speaks naturally (for example, *"Rajesh Sharma ke naam 90 rupaye ki 3 chai aur 3 samosa udhaar likho"*), reviews the **AI Confirmation Card** before saving, and commits the transaction across their Digital Khata, Inventory, and Analytics in one tap.

---

## Key Features

### 1. Business Dashboard
- **Real-Time KPIs**: Today's Sales (`₹`), Total Net Profit, Pending Udhaar Receivable, and Low-Stock Alerts computed live from the ledger.
- **Quick Action Bar**: One-click shortcuts for *Record Sale (Voice)*, *Add Udhaar*, *Receive Payment*, and *Add Stock*.
- **Recent Activity & Restock Queue**: Live chronological transaction feed alongside items below their minimum stock threshold.

### 2. Multilingual AI Voice Assistant
- **Large Tactile Microphone Control**: Designed for busy shop counters with dual capture support (Live Web Speech Recognition + Server-side Audio Transcription via `gemini-3.5-transcribe`).
- **Natural Hindi & Regional Parsing**: Powered by `gemini-4-hydrogen` with structured JSON schemas to classify intent (`SALE`, `UDHAAR_GIVEN`, `PAYMENT_RECEIVED`, `ADD_INVENTORY`, `EXPENSE`, `QUERY`) and automatically match spoken customer and product names against your existing records.
- **AI Confirmation Before Saving**: Displays an editable preview card in both **English** and **Hindi (Devanagari)** before anything is saved, with optional spoken confirmation via `gemini-3.8-flash-lite-tts`.

### 3. Digital Khata (Customer Credit Ledger)
- **Customer Directory**: Search by name or phone number and filter by `All`, `Pending Udhaar`, or `Settled`.
- **Credit & Repayment Tracking**: Record `Give Udhaar` (debit) and `Record Payment / Jama` (cash or UPI credit) entries manually or by voice.
- **Per-Customer Payment History**: Expandable chronological ledger showing every item, payment mode, and timestamp.

### 4. Inventory Management & Live Market Rates
- **Stock Catalog & Alerts**: Track current quantities, units (`cups`, `pcs`, `kg`, `L`, `pkts`), cost vs. selling prices, and low-stock indicators.
- **Voice Restocking**: Add new products or restock existing inventory using natural voice commands.
- **Purchase Records**: Dedicated log of wholesale restocks, supplier names, and purchase costs.
- **Live Market Rates (Google Search Grounded)**: Built-in lookup powered by `gemini-4-hydrogen` with Google Search Grounding (`/api/market/search`) to check current Indian wholesale commodity prices (sugar, mustard oil, milk, 19kg commercial LPG) and vendor schemes with cited web sources.

### 5. Business Analytics
- **Daily & Monthly Performance**: Toggle between **Daily (Last 7 Days)** and **Monthly (Last 3 Months)** interactive charts comparing Sales, Expenses, and Estimated Profit.
- **Expense Logging**: Track raw materials, gas cylinders, rent, and electricity bills.
- **Profit & Leaderboard Reports**: Gross revenue, operating expenses, net profit margin, and **Best-Selling Products** ranked by revenue and profit contribution.

### 6. Payment Reminders
- **Overdue & Pending Queue**: Automatically prioritizes customers with pending balances.
- **Bilingual WhatsApp Reminders**: Generates polite **Hindi** or **English** reminder messages pre-filled with the customer's name, shop name, and exact `₹` balance—with one-click **Copy Message**, direct **`wa.me` WhatsApp Launch**, **Mark Reminded**, and **Record Full Payment** actions.

### 7. Bilingual UI & Data Backup (Settings)
- **Instant Language Switching**: Switch the entire interface between **English** and **हिन्दी (Hindi)**.
- **Shop Profile & Voice Preferences**: Customize shop name, owner name, phone, address, spoken language dialect, and audio confirmation behavior.
- **Portable JSON Backup**: Download a full `.json` snapshot of your shop ledger, restore from a backup file, or reset to sample store data.

---

## How to Use the Multilingual Voice Assistant

### Supported Languages & Dialects
Select your preferred spoken language directly inside the **AI Voice Assistant** view or in **Settings**:
- **Hindi (`hi-IN`)** — हिन्दी
- **Hinglish / Indian English (`en-IN`)**
- **Marathi (`mr-IN`)** — मराठी
- **Gujarati (`gu-IN`)** — ગુજરાતી
- **Bengali (`bn-IN`)** — বাংলা
- **Tamil (`ta-IN`)** — தமிழ்
- **Telugu (`te-IN`)** — తెలుగు
- **Punjabi (`pa-IN`)** — ਪੰਜਾਬੀ
- **Kannada (`kn-IN`)** — ಕನ್ನಡ

### Step-by-Step Workflow

1. **Open the AI Voice Assistant**
   Click **Speak Command** (or **बोलकर लिखें**) in the top bar or sidebar.
2. **Tap the Microphone & Speak Naturally**
   - In **Live Browser Speech + AI Fallback** mode, your speech streams into the editable **Live Transcript** box in real time.
   - In **Record Audio & AI Transcribe** mode (or browsers without Web Speech API), audio is recorded cleanly and transcribed on the backend via `gemini-3.5-transcribe`.
   - *No microphone handy?* Click any of the built-in **Sample Voice Commands** or type directly into the transcript box and click **Analyze Command**.
3. **Review the AI Confirmation Card**
   Before modifying your books, BoliLedger AI displays:
   - Detected **Action Type** (`Sale`, `Customer Udhaar`, `Payment Received`, `Add Inventory`, `Expense`, or `Business Question`)
   - Confidence score and a natural-language confirmation prompt in **English** or **Hindi**
   - Editable fields for **Customer Name**, **Amount (`₹`)**, **Payment Mode** (`Cash`, `UPI`, `Udhaar`), and detected **Line Items**
   - Click **Listen** (or enable *Auto-speak confirmation* in Settings) to hear the summary spoken aloud.
4. **Confirm & Save**
   Click **Confirm & Save Entry**. BoliLedger AI atomically updates customer balances, deducts or restocks inventory quantities, logs the transaction, and refreshes all dashboard KPIs.

### Example Voice Commands

| Intent | Spoken Example (Hindi / Hinglish) | What BoliLedger AI Does |
| :--- | :--- | :--- |
| **Customer Udhaar** | *"Rajesh Sharma ke naam 90 rupaye ki 3 masala chai aur 3 samosa udhaar likho"* | Adds `₹90` to Rajesh Sharma's Khata & deducts 3 Masala Chai + 3 Samosa from stock |
| **Cash / UPI Sale** | *"Aaj 5 packet Parle-G aur 2 litre Amul doodh cash mein becha"* | Computes total from inventory prices, logs a Cash sale & updates stock |
| **Payment Received** | *"Manoj Kumar ne 500 rupaye UPI se udhaar wapas diye"* | Reduces Manoj Kumar's pending balance by `₹500` & adds a Jama entry |
| **Voice Restock** | *"15 kilo cheeni aur 20 packet Parle-G stock mein daalo, kul kharid 800 rupaye"* | Adds stock quantities and logs a Purchase Record for `₹800` |
| **Shop Expense** | *"Aaj gas cylinder ka 850 rupaye kharcha likho"* | Records an `₹850` expense under *Gas & Fuel* and updates net profit |
| **Balance Query** | *"Sunita Devi ka kitna udhaar baaki hai?"* | Answers directly in Hindi & English using live Khata data |

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React |
| **Typography** | Plus Jakarta Sans, DM Sans, Noto Sans Devanagari, JetBrains Mono (`tabular-nums`) |
| **Backend Server** | Node.js, Express (`server.ts`) with Vite middleware in development |
| **AI & Speech** | `@google/genai` SDK (`gemini-4-hydrogen`, `gemini-3.5-transcribe`, `gemini-3.8-flash-lite-tts`) |
| **Live Web Grounding** | Gemini Search Grounding (`googleSearch` tool) for live wholesale/mandi prices |
| **Persistence** | Browser `localStorage` + portable JSON backup export/import |

---

## Project Structure

```text
boliledger-ai/
├── docs/
│   ├── ARCHITECTURE.md           # Voice-to-ledger pipeline & backend API contract
│   └── SHOWCASE_PROMPTS.md       # Demo Hindi/Hinglish voice & market search prompts
├── src/
│   ├── assets/images/            # Shopkeeper profile portrait asset
│   ├── components/
│   │   ├── AnalyticsView.tsx     # Daily/Monthly chart, expenses, best-sellers
│   │   ├── DashboardView.tsx     # KPIs, quick actions, recent feed, low-stock list
│   │   ├── DigitalKhataView.tsx  # Customer credit/debit ledger & payment history
│   │   ├── InventoryView.tsx     # Stock table, purchase logs & Live Market Rates
│   │   ├── RemindersView.tsx     # Bilingual WhatsApp reminders & status tracker
│   │   ├── SettingsView.tsx      # Language toggle, shop profile, voice & backup
│   │   ├── Sidebar.tsx           # Responsive sidebar & mobile drawer navigation
│   │   └── VoiceAssistantView.tsx# Mic capture, Gemini parsing & confirmation UI
│   ├── data/
│   │   └── seedData.ts           # Sample kirana & chai stall store data
│   ├── hooks/
│   │   └── useLedgerStore.ts     # Persistent store & atomic voice commit logic
│   ├── i18n/
│   │   └── translations.ts       # Complete English & Hindi dictionary + dialects
│   ├── utils/
│   │   └── format.ts             # INR currency, date/time & WhatsApp URL helpers
│   ├── App.tsx                   # Application shell & view routing
│   ├── index.css                 # Tailwind v4 configuration & font tokens
│   ├── main.tsx                  # React entry point
│   └── types.ts                  # Shared TypeScript domain interfaces
├── server.ts                     # Express server & server-side Gemini endpoints
├── .env.example                  # Environment variable template
├── .gitignore
├── index.html
├── LICENSE
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Installation & Local Setup

### Prerequisites
- **Node.js** `v20+` (or `v22+` recommended)
- **npm** `v9+`
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/boliledger-ai.git
cd boliledger-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Add your Gemini API key inside `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```
> All `@google/genai` SDK calls run strictly on the Express backend (`server.ts`); your API key is never exposed to the browser bundle.

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Type-Check & Build for Production
```bash
npm run lint
npm run build
```

---

## API Endpoints

All AI endpoints are served from `server.ts`:

| Endpoint | Method | Model / Tool | Description |
| :--- | :--- | :--- | :--- |
| `/api/voice/transcribe` | `POST` | `gemini-3.5-transcribe` | Transcribes recorded audio (`audio/webm` / `audio/mp4`) into Hindi/regional text |
| `/api/voice/parse` | `POST` | `gemini-4-hydrogen` | Extracts structured accounting intent, customer match, items, and bilingual summaries |
| `/api/voice/speak` | `POST` | `gemini-3.8-flash-lite-tts` | Generates WAV audio (`audio/wav`) for spoken AI confirmation |
| `/api/market/search` | `POST` | `gemini-4-hydrogen` + `googleSearch` | Fetches live wholesale/mandi rates & business schemes with cited URLs |
| `/api/health` | `GET` | — | Server health check (`{ ok: true }`) |

---

## Contributing & License

Contributions, feature suggestions, and regional language improvements are welcome! Feel free to open an issue or submit a pull request.

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.
