# AI ScamShield

### Detect. Understand. Stay Safe.

AI-powered **message + link security analysis**. Paste a message, upload a screenshot, or check a URL and ScamShield categorizes the content, calculates a 0–100 risk score, extracts links, safely visits accessible destinations, follows redirects, inspects page evidence, and explains what the user should do.

## Categories

- 🚨 **Scam / Fraud**
- 📢 **Promotional**
- ℹ️ **General**

Promotional content and URLs are not automatically treated as scams. The assessment is evidence-based.

## Risk levels

| Score | Level |
|---:|---|
| 0–20 | VERY LOW |
| 21–40 | LOW |
| 41–60 | MEDIUM |
| 61–80 | HIGH |
| 81–100 | CRITICAL |

## Link analysis

For every detected URL, the backend records the original URL/domain, final destination/domain, redirects, whether the destination was visited, domain-match evidence when a known claimed brand can be compared, page title/content indicators, and a status of **Likely Safe / Suspicious / Likely Malicious / Unable to Verify**.

The server validates every hop against SSRF protections before fetching. It blocks local/private/reserved addresses and cloud metadata endpoints, limits redirects and response size, times out safely, and does not execute downloaded files or arbitrary JavaScript.

## Tech stack

Frontend: React + Vite + TypeScript + Tailwind CSS. Backend: Python + FastAPI. AI: Groq text/vision. History remains in browser local storage.

## Local development

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Set GROQ_API_KEY in backend/.env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
npm install
cp .env.example .env.local
# Set VITE_API_URL if the backend is not http://localhost:8000
npm run dev
```

## Deployment

The existing architecture remains **Vercel frontend + a FastAPI backend service (Render/Railway)**. Set `VITE_API_URL` on Vercel to the deployed FastAPI URL, and keep `GROQ_API_KEY` only on the backend. Set `CORS_ORIGINS` on the backend to the Vercel origin in production.

### Phone Number Scam Detection

The Analyze screen now has a **Phone Number** tab. Users can enter an international number (recommended) or a local Pakistan number. The backend validates and normalizes the number, checks country/region, carrier and number type, detects limited warning patterns, and can match exact numbers against the administrator's `SCAM_NUMBER_BLOCKLIST`.

For a trusted list of reported scam numbers, configure this **backend-only** environment variable:

```env
SCAM_NUMBER_BLOCKLIST=+923001234567,+14155550123
```

A clean number result does not mean the caller is definitely legitimate; caller-ID spoofing and newly used numbers are possible.
