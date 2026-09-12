# AI ScamShield — Backend

FastAPI backend with Groq AI integration plus a secure server-side link inspection layer.

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add GROQ_API_KEY
```

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | API status |
| GET | `/health` | Backend/Groq health |
| POST | `/analyze/text` | Categorize and analyze a message; extract, visit and inspect all links |
| POST | `/analyze/image` | Analyze screenshot text and inspect URLs extracted by vision AI |
| POST | `/analyze/url` | Inspect and analyze a URL, including redirects and page evidence |

## Link security

User-supplied URLs are treated as untrusted. The backend only permits HTTP/HTTPS, blocks localhost/private/reserved/cloud-metadata destinations, validates every redirect, limits redirects and response size, uses request timeouts, and never executes downloaded files or arbitrary page JavaScript.

A successful HTTP response, HTTPS, SSL certificate, or professional-looking page is **not** treated as proof that a site is safe. If a destination cannot be safely reached, the API reports `unable_to_verify` rather than pretending it was checked.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | required | Groq API key; backend only |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Text model |
| `GROQ_VISION_MODEL` | `qwen/qwen3.6-27b` | Vision model |
| `CORS_ORIGINS` | `*` | Comma-separated frontend origins in production |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |

## Scam Number Analyzer

ScamShield now includes `POST /analyze/number` for phone-number checks. It normalizes and validates the number, identifies country/region, carrier and number type, checks unusual patterns, and compares the exact E.164 number against an optional administrator-configured blocklist.

Set `SCAM_NUMBER_BLOCKLIST` in the backend environment as a comma-separated list of E.164 numbers when you have a trusted list of reported scam numbers, for example:

```env
SCAM_NUMBER_BLOCKLIST=+923001234567,+14155550123
```

A number that is not on the blocklist is **not** guaranteed safe. Phone numbers can be spoofed, recycled, or newly created, so the UI deliberately describes number-only results as signals rather than proof of fraud.

## Live phone-number internet reputation

The `/analyze/number` endpoint performs a live web reputation lookup. It does **not** rely on the administrator blocklist alone.

Configure one of these providers on the backend/serverless environment:

- `SERPER_API_KEY` (recommended): Google Search results through Serper.
- `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID`: Google Custom Search JSON API.

The service searches the exact normalized number in several forms with scam/fraud/spam/report queries, deduplicates results, scores evidence, and returns the public source URLs/snippets to the frontend.

A missing search result means **no strong reports were found**, not that the number is safe. Community reports are treated as reputation evidence rather than proof of criminal activity.
