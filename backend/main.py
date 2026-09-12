"""AI ScamShield — FastAPI backend entry point."""

import io
import logging
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from models import TextRequest, URLRequest, NumberRequest, NumberAnalysisResult, AnalysisResult, HealthResponse, RootResponse, RedFlag, LinkAnalysis
from ai_analyzer import analyze_text, analyze_image, analyze_url, is_configured, get_text_model
from risk_engine import calculate_risk_score, get_risk_level, assess_url
from link_inspector import extract_urls, inspect_urls, compare_claimed_brand
from utils import truncate_preview, image_to_base64_data_url, validate_image_content
from number_analyzer import analyze_number
from number_reputation import lookup_number_reputation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
MAX_IMAGE_SIZE = 10 * 1024 * 1024

app = FastAPI(title="AI ScamShield API", description="AI-powered message + link security analyzer", version="2.0.0")

cors_origins = os.environ.get("CORS_ORIGINS", "*")
origins = ["*"] if cors_origins == "*" else [o.strip() for o in cors_origins.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def _link_flags(links: list[dict]) -> list[dict]:
    flags = []
    for link in links:
        if not link.get("visited"):
            continue
        if link.get("redirected"):
            flags.append({"title": "Redirected URL", "severity": "MEDIUM", "explanation": "The link redirected before reaching its final destination, so the final site is more important than the original URL."})
        if link.get("domain_changed"):
            flags.append({"title": "Domain changed after redirect", "severity": "MEDIUM", "explanation": "The final destination uses a different domain from the URL originally supplied."})
        if link.get("domain_match") is False:
            flags.append({"title": "Domain mismatch", "severity": "HIGH", "explanation": "The destination domain does not match the organization claimed by the message."})
        for indicator in link.get("page_indicators", []):
            low = indicator.lower()
            if "password" in low:
                flags.append({"title": "Password field detected", "severity": "HIGH", "explanation": "The destination contains a password collection field. This becomes especially concerning when the message asks the user to verify an account."})
            elif "otp" in low or "verification-code" in low:
                flags.append({"title": "OTP field detected", "severity": "HIGH", "explanation": "The destination appears to collect a one-time verification code, which scammers may use to take over accounts."})
            elif "payment" in low or "banking" in low:
                flags.append({"title": "Payment/banking field detected", "severity": "HIGH", "explanation": "The destination appears to request payment or banking information."})
            elif "urgent" in low:
                flags.append({"title": "Urgent website language", "severity": "MEDIUM", "explanation": "The destination contains urgent security or account language that can be used to pressure users into acting quickly."})
    return flags


def _normalize_links(raw_links: list[dict], claimed_orgs: list[str]) -> list[dict]:
    normalized = []
    for link in raw_links:
        item = dict(link)
        if item.get("final_domain") and claimed_orgs:
            item["domain_match"] = compare_claimed_brand(claimed_orgs, item["final_domain"])
        # A page with multiple strong collection indicators plus a known mismatch is stronger evidence.
        strong = len([x for x in item.get("page_indicators", []) if any(k in x.lower() for k in ("password", "otp", "payment", "banking"))])
        if item.get("domain_match") is False and strong >= 1:
            item["status"] = "likely_malicious"
            item["reason"] = "The destination does not match the claimed organization and appears to collect sensitive information."
        elif item.get("status") == "likely_safe" and item.get("domain_match") is False:
            item["status"] = "suspicious"
            item["reason"] = "The destination domain does not match the claimed organization."
        normalized.append(item)
    return normalized


def _build_result(ai_data: dict, analysis_type: str, input_preview: str, links: list[dict] | None = None) -> AnalysisResult:
    links = _normalize_links(links or [], ai_data.get("claimed_organizations", []))
    heuristic_link_flags = []
    for link in links:
        heuristic_link_flags.extend(assess_url(link.get("url", "")))
    combined_flags = list(ai_data.get("red_flags", [])) + heuristic_link_flags + _link_flags(links)

    engine_score = calculate_risk_score(combined_flags)
    ai_score = int(ai_data.get("risk_score", 0))
    final_score = max(engine_score, ai_score) if combined_flags else ai_score
    final_score = max(0, min(100, final_score))
    final_level = get_risk_level(final_score)

    # Strong destination evidence can correct an overly optimistic AI category.
    strong_titles = {"domain mismatch", "password field detected", "otp field detected", "payment/banking field detected"}
    if any(str(f.get("title", "")).lower() in strong_titles for f in combined_flags if isinstance(f, dict)):
        ai_data["category"] = "scam"

    seen = set()
    red_flags = []
    for f in combined_flags:
        if not isinstance(f, dict):
            continue
        title = f.get("title", "Unknown")
        key = title.lower().strip()
        if key in seen:
            continue
        seen.add(key)
        red_flags.append(RedFlag(title=title, severity=f.get("severity", "MEDIUM"), explanation=f.get("explanation", "")))

    overview = ai_data.get("overview") or ai_data.get("summary", "")
    recommendation = ai_data.get("recommendation") or "Verify important information through the organization's official website or app."
    recommendations = ai_data.get("recommendations") or [recommendation]

    return AnalysisResult(
        category=ai_data.get("category", "general"), risk_score=final_score, risk_level=final_level,
        verdict=ai_data.get("verdict", "Analysis complete"), overview=overview,
        indicators=list(dict.fromkeys((ai_data.get("indicators", []) or []) + [f.title for f in red_flags[:8]])),
        links=[LinkAnalysis(**x) for x in links], recommendation=recommendation,
        summary=overview, red_flags=red_flags, recommendations=recommendations,
        detected_language=ai_data.get("detected_language"), analysis_type=analysis_type, input_preview=input_preview,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred. Please try again."})


@app.get("/", response_model=RootResponse)
async def root():
    return RootResponse(message="AI ScamShield API is running")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok" if is_configured() else "degraded", groq_configured=is_configured(), model=get_text_model())


@app.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text_endpoint(req: TextRequest):
    if not is_configured():
        raise HTTPException(status_code=503, detail="AI service is not configured. Set GROQ_API_KEY in backend/.env")
    urls = extract_urls(req.text)
    link_results = await inspect_urls(urls)
    try:
        ai_data = analyze_text(req.text, link_results)
    except Exception as e:
        logger.error("Text analysis failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail="AI analysis failed. Please try again.")
    return _build_result(ai_data, "text", truncate_preview(req.text), link_results)


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
        img = Image.open(io.BytesIO(content)); img.verify()
    except Exception:
        raise HTTPException(status_code=415, detail="Invalid or corrupted image file.")
    data_url = image_to_base64_data_url(content, mime_type)
    try:
        ai_data = analyze_image(data_url)
        extracted = " ".join(str(u) for u in ai_data.get("extracted_urls", []))
        urls = extract_urls(extracted)
        link_results = await inspect_urls(urls)
    except Exception as e:
        logger.error("Image analysis failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail="AI image analysis failed. Please try again.")
    return _build_result(ai_data, "image", f"Screenshot ({mime_type})", link_results)


@app.post("/analyze/url", response_model=AnalysisResult)
async def analyze_url_endpoint(req: URLRequest):
    if not is_configured():
        raise HTTPException(status_code=503, detail="AI service is not configured. Set GROQ_API_KEY in backend/.env")
    urls = extract_urls(req.url)
    target = urls[0] if urls else req.url
    link_result = (await inspect_urls([target]))[0]
    heuristic_flags = assess_url(target)
    try:
        ai_data = analyze_url(target, link_result)
    except Exception as e:
        logger.error("URL analysis failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail="AI analysis failed. Please try again.")
    ai_data["red_flags"] = (ai_data.get("red_flags") or []) + heuristic_flags
    return _build_result(ai_data, "url", target, [link_result])

@app.post("/analyze/number", response_model=NumberAnalysisResult)
async def analyze_number_endpoint(req: NumberRequest):
    try:
        result = analyze_number(req.number, req.default_region)
        reputation = await lookup_number_reputation(result["normalized_number"], result["national_format"], result["country"])

        result["internet_checked"] = bool(reputation.get("searched"))
        result["internet_status"] = reputation.get("status", "not_configured") if reputation.get("searched") else "not_configured"
        result["internet_report_count"] = int(reputation.get("report_count", 0))
        result["internet_evidence_score"] = int(reputation.get("evidence_score", 0))
        result["internet_message"] = reputation.get("message", "")
        result["internet_sources"] = reputation.get("sources", [])

        evidence = result["internet_evidence_score"]
        if evidence >= 70:
            result["risk_score"] = max(result["risk_score"], 90)
            result["risk_level"] = "CRITICAL"
            result["status"] = "likely_malicious"
            result["verdict"] = "Strong public web evidence indicates that this number has been reported for scam or fraud-related activity. This is a reputation finding, not proof of who currently controls the number."
            result["recommendation"] = "Do not call back, send money, or share OTPs, passwords, banking details, or personal information. Verify the caller through an official channel."
            result["indicators"].insert(0, {"title": "Multiple online scam reports found", "severity": "HIGH", "explanation": f"The live internet search found {result['internet_report_count']} strong report result(s) about this exact number."})
        elif evidence >= 35:
            result["risk_score"] = max(result["risk_score"], 70)
            result["risk_level"] = "HIGH"
            result["status"] = "suspicious"
            result["verdict"] = "Online sources contain meaningful scam/spam warning evidence for this number, but the evidence is not sufficient to establish that the number is definitively malicious."
            result["recommendation"] = "Treat the caller as suspicious. Do not share sensitive information or make payments until you independently verify the caller."
            result["indicators"].insert(0, {"title": "Online scam/spam reports found", "severity": "HIGH", "explanation": f"The live internet search found {result['internet_report_count']} strong report result(s) and an evidence score of {evidence}/100."})
        elif reputation.get("status") == "weak_reports":
            result["risk_score"] = max(result["risk_score"], 30)
            result["risk_level"] = "MEDIUM"
            result["status"] = "suspicious"
            result["indicators"].insert(0, {"title": "Weak online warning evidence", "severity": "MEDIUM", "explanation": "Search results mention this number in potentially relevant contexts, but the available evidence is not strong enough to label it a scam."})
        elif reputation.get("status") == "no_reports_found":
            result["indicators"].append({"title": "No strong scam reports found", "severity": "LOW", "explanation": "The configured live web search did not find strong public scam-report evidence for this exact number. Absence of reports is not proof of safety."})
        else:
            result["indicators"].append({"title": "Internet reputation could not be verified", "severity": "LOW", "explanation": reputation.get("message", "Live web lookup was unavailable.")})

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Number analysis failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Phone number analysis failed. Please try again.")

