"""AI ScamShield — FastAPI backend entry point.

Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from PIL import Image
import io

from models import (
    TextRequest,
    URLRequest,
    AnalysisResult,
    HealthResponse,
    RootResponse,
    RedFlag,
)
from ai_analyzer import (
    analyze_text,
    analyze_image,
    analyze_url,
    is_configured,
    get_text_model,
)
from risk_engine import calculate_risk_score, get_risk_level, assess_url
from utils import truncate_preview, image_to_base64_data_url, validate_image_content

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

app = FastAPI(
    title="AI ScamShield API",
    description="AI-powered scam detection and analysis API",
    version="1.0.0",
)

# CORS
cors_origins = os.environ.get("CORS_ORIGINS", "*")
if cors_origins == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_result(ai_data: dict, analysis_type: str, input_preview: str) -> AnalysisResult:
    """Merge AI output with risk engine validation into a final result."""
    # The risk engine recalculates the score from detected red flags
    engine_score = calculate_risk_score(ai_data.get("red_flags", []))
    ai_score = ai_data.get("risk_score", 50)

    # Use the higher of AI score or engine score, but if AI says low and engine says 0, trust AI
    if engine_score > 0:
        final_score = max(engine_score, ai_score)
    else:
        final_score = ai_score

    final_level = get_risk_level(final_score)

    red_flags = [
        RedFlag(
            title=f.get("title", "Unknown"),
            severity=f.get("severity", "MEDIUM"),
            explanation=f.get("explanation", ""),
        )
        for f in ai_data.get("red_flags", [])
    ]

    return AnalysisResult(
        risk_score=final_score,
        risk_level=final_level,
        verdict=ai_data.get("verdict", "Analysis complete"),
        summary=ai_data.get("summary", ""),
        red_flags=red_flags,
        recommendations=ai_data.get("recommendations", []),
        detected_language=ai_data.get("detected_language"),
        analysis_type=analysis_type,
        input_preview=input_preview,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


@app.get("/", response_model=RootResponse)
async def root():
    return RootResponse(message="AI ScamShield API is running")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok" if is_configured() else "degraded",
        groq_configured=is_configured(),
        model=get_text_model(),
    )


@app.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text_endpoint(req: TextRequest):
    if not is_configured():
        raise HTTPException(status_code=503, detail="AI service is not configured. Set GROQ_API_KEY in backend/.env")

    try:
        ai_data = analyze_text(req.text)
    except Exception as e:
        logger.error(f"Text analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="AI analysis failed. Please try again.")

    return _build_result(ai_data, "text", truncate_preview(req.text))


@app.post("/analyze/image", response_model=AnalysisResult)
async def analyze_image_endpoint(file: UploadFile = File(...)):
    if not is_configured():
        raise HTTPException(status_code=503, detail="AI service is not configured. Set GROQ_API_KEY in backend/.env")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large. Maximum size is 10 MB.")

    mime_type = validate_image_content(content)
    if not mime_type:
        raise HTTPException(status_code=415, detail="Invalid image format. Supported: PNG, JPG, WEBP.")

    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
        img = Image.open(io.BytesIO(content))
        if img.mode not in ("RGB", "RGBA", "L"):
            img = img.convert("RGB")
    except Exception:
        raise HTTPException(status_code=415, detail="Invalid or corrupted image file.")

    data_url = image_to_base64_data_url(content, mime_type)

    try:
        ai_data = analyze_image(data_url)
    except Exception as e:
        logger.error(f"Image analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="AI image analysis failed. Please try again.")

    return _build_result(ai_data, "image", f"Screenshot ({mime_type})")


@app.post("/analyze/url", response_model=AnalysisResult)
async def analyze_url_endpoint(req: URLRequest):
    if not is_configured():
        raise HTTPException(status_code=503, detail="AI service is not configured. Set GROQ_API_KEY in backend/.env")

    # Heuristic analysis first
    heuristic_flags = assess_url(req.url)

    try:
        ai_data = analyze_url(req.url)
    except Exception as e:
        logger.error(f"URL analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="AI analysis failed. Please try again.")

    # Merge heuristic flags with AI flags
    ai_flags = ai_data.get("red_flags", [])
    existing_titles = {f.get("title", "").lower() for f in ai_flags}
    for hf in heuristic_flags:
        if hf["title"].lower() not in existing_titles:
            ai_flags.append(hf)
    ai_data["red_flags"] = ai_flags

    result = _build_result(ai_data, "url", req.url)

    # Add disclaimer to summary for URL analysis
    disclaimer = "This is an indicator-based assessment, not definitive proof of malicious intent."
    if disclaimer.lower() not in result.summary.lower():
        result.summary = result.summary + " " + disclaimer

    return result
