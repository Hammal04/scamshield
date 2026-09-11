# AI ScamShield — Backend

FastAPI backend with Groq AI integration for scam detection and analysis.

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

Get your Groq API key from https://console.groq.com/keys

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root — returns status message |
| GET | `/health` | Health check — shows Groq configuration status |
| POST | `/analyze/text` | Analyze a text message for scam indicators |
| POST | `/analyze/image` | Analyze a screenshot (PNG/JPG/WEBP, max 10MB) |
| POST | `/analyze/url` | Analyze a URL for suspicious indicators |

## Configuration

Environment variables (set in `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | (required) | Your Groq API key |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Text analysis model |
| `GROQ_VISION_MODEL` | `qwen/qwen3.6-27b` | Image analysis model |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |

## Deployment

### Render
1. Create a new Web Service
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `GROQ_API_KEY`

### Railway
1. Create new project from repo
2. Add variable: `GROQ_API_KEY`
3. Railway auto-detects and runs the app
