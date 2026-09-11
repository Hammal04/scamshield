# AI ScamShield

### Detect. Understand. Stay Safe.

AI-powered scam detection and analysis. Paste a suspicious message, upload a screenshot, or check a URL — and get an AI-powered risk assessment with clear explanations of the red flags behind it.

**AI Powered by Groq**

---

## What it does

- **Text analysis** — paste a suspicious message and get an instant risk assessment
- **Screenshot analysis** — upload a screenshot of a suspicious message and let AI read and analyze it
- **URL analysis** — check a URL for suspicious domain indicators
- **Risk score** — a transparent 0–100 score powered by a weighted risk engine
- **Red flags** — each detected flag is explained in plain language
- **Recommendations** — clear, actionable safety steps
- **Multilingual** — supports English, Urdu, and Roman Urdu
- **Demo examples** — one-click sample messages for live demos
- **History** — past analyses saved locally in your browser

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Icons | Lucide React |
| Backend | Python + FastAPI + Uvicorn |
| AI | Groq API (text + vision models) |
| Database | Supabase/PostgreSQL (optional — app works without it) |
| Deployment | Vercel (frontend) + Render/Railway (backend) |

## Project structure

```
/
├── backend/
│   ├── main.py            # FastAPI app with endpoints
│   ├── ai_analyzer.py      # Groq AI service (text, image, URL)
│   ├── risk_engine.py     # Transparent weighted risk scoring
│   ├── models.py          # Pydantic request/response models
│   ├── utils.py           # JSON cleaning, image validation
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Analyzer.tsx
│   │   ├── MessageAnalyzer.tsx
│   │   ├── ScreenshotAnalyzer.tsx
│   │   ├── URLAnalyzer.tsx
│   │   ├── RiskScore.tsx
│   │   ├── RedFlags.tsx
│   │   ├── Recommendations.tsx
│   │   ├── ResultCard.tsx
│   │   ├── History.tsx
│   │   └── About.tsx
│   ├── App.tsx
│   ├── api.ts             # Backend API client
│   ├── types.ts           # TypeScript types
│   ├── demoData.ts        # Demo example messages
│   ├── history.ts         # localStorage history management
│   └── index.css
├── .env.example
└── README.md
```

## Getting started

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (from https://console.groq.com/keys)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API runs at http://localhost:8000

### 2. Frontend

```bash
# From the project root
cp .env.example .env.local
npm install
npm run dev
```

The app runs at http://localhost:5173

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root status |
| GET | `/health` | Health check + Groq config status |
| POST | `/analyze/text` | Analyze a text message |
| POST | `/analyze/image` | Analyze a screenshot (PNG/JPG/WEBP, max 10MB) |
| POST | `/analyze/url` | Analyze a URL for suspicious indicators |

## How the risk engine works

The AI identifies evidence (red flags). The backend risk engine calculates the final score using weighted indicators:

| Indicator | Weight |
|-----------|--------|
| Credential/OTP request | +25 |
| Financial manipulation | +20 |
| Suspicious link | +20 |
| Suspicious payment request | +20 |
| Urgency | +15 |
| Impersonation | +15 |
| Prize bait | +15 |
| Threat/account blocking | +15 |

Scores are normalized to 0–100 and mapped to risk levels:

| Score | Level |
|-------|-------|
| 0–29 | LOW |
| 30–59 | MEDIUM |
| 60–79 | HIGH |
| 80–100 | CRITICAL |

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Set environment variable: `VITE_API_URL` = your backend URL
4. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `GROQ_API_KEY`
5. Set `CORS_ORIGINS` to your Vercel URL
6. Deploy

## Demo flow for presentations

1. Click "Try Demo" → "Fake Prize" to load a sample scam message
2. Click "Analyze Message"
3. Show the risk score (92/100, CRITICAL)
4. Walk through the red flags and explanations
5. Switch to "Roman Urdu Scam" demo to show multilingual support
6. Load "Legitimate Bill" to show it does NOT flag legitimate messages
7. Upload a screenshot for vision analysis
8. Check History for past analyses

## Security

- GROQ_API_KEY is stored only in backend `.env` — never exposed to frontend
- `.env` files are gitignored
- File uploads are validated by type and size
- CORS is configurable per environment
- No sensitive user messages are logged unnecessarily
