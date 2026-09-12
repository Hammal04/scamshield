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
