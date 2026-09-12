"""Groq integration and strict structured analysis for ScamShield."""

import json
import logging
import os
from typing import Any

from groq import Groq
from utils import clean_json_response

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = r"""You are ScamShield, a message + link security analyzer.
Return ONLY one valid JSON object. Never return Markdown or text outside JSON.

Classify the message into EXACTLY one category:
- scam: phishing, fraud, fake prizes, fake account warnings, fake banking/payment requests, credential/OTP theft, identity theft, financial scams, impersonation, malicious links, or manipulative urgent requests.
- promotional: primarily advertising, marketing, discounts, sales, offers, products/services, or promotional campaigns. An ordinary offer is NOT a scam merely because it contains a URL or sales language.
- general: normal notifications, regular communication, reminders, informational/non-promotional updates, and ordinary conversations.

Risk score is 0-100. Do NOT increase risk merely because a URL exists. Consider message wording, urgency/threats, money, credentials, OTPs, personal data, impersonation, and the supplied real destination/website evidence. HTTPS, HTTP 200, SSL, an unknown domain, or a professional-looking page are NOT proof of safety.

Risk levels MUST follow: 0-20 VERY_LOW; 21-40 LOW; 41-60 MEDIUM; 61-80 HIGH; 81-100 CRITICAL.

Final overview: explain in simple human language what the message is actually trying to do. Do not just repeat it.
Indicators: concise evidence bullets. Avoid claiming certainty when evidence is incomplete; use likely, suspicious, potentially, or unable to verify.
Recommendation: practical next action. Never ask for or reproduce passwords, OTPs, bank credentials, or other secrets.
claimed_organizations: organizations/brands explicitly claimed or strongly implied by the message, as short names.
extracted_urls: URLs visible in the supplied message/screenshot if any.

JSON schema:
{
  "category": "scam|promotional|general",
  "risk_score": 0,
  "risk_level": "VERY_LOW|LOW|MEDIUM|HIGH|CRITICAL",
  "verdict": "short verdict",
  "overview": "human-language overview",
  "indicators": ["evidence"],
  "claimed_organizations": ["organization"],
  "extracted_urls": ["https://example.com"],
  "recommendation": "practical action",
  "red_flags": [
    {"title":"short indicator", "severity":"LOW|MEDIUM|HIGH", "explanation":"plain-language explanation"}
  ],
  "detected_language": "English|Urdu|Roman Urdu|Unknown"
}

Do not invent website findings. Use supplied link evidence only for claims about destination/content."""

URL_SYSTEM_PROMPT = r"""You are ScamShield's URL evidence analyzer. Return ONLY valid JSON.
The URL may have been visited by a secure backend. Use the supplied destination evidence; do not pretend a website was visited if visited=false.
HTTP 200, HTTPS, SSL, reachability, unknown domains, or a professional-looking page do NOT prove legitimacy.
Assess suspicious domain structure, impersonation, redirects, claimed-brand mismatch, credential/payment/OTP collection, suspicious instructions, and page content.
If evidence is incomplete, say unable to verify rather than guessing.

Use this JSON:
{
  "category":"scam|promotional|general",
  "risk_score":0,
  "risk_level":"VERY_LOW|LOW|MEDIUM|HIGH|CRITICAL",
  "verdict":"short verdict",
  "overview":"what this URL appears to be used for",
  "indicators":["evidence"],
  "recommendation":"practical action",
  "red_flags":[{"title":"indicator","severity":"LOW|MEDIUM|HIGH","explanation":"why"}],
  "detected_language":"English"
}"""


def get_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured. Set it in backend/.env")
    return Groq(api_key=api_key)


def get_text_model() -> str:
    return os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")


def get_vision_model() -> str:
    return os.environ.get("GROQ_VISION_MODEL", "qwen/qwen3.6-27b")


def is_configured() -> bool:
    return bool(os.environ.get("GROQ_API_KEY", ""))


def _parse_ai_response(raw_text: str) -> dict:
    cleaned = clean_json_response(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse AI JSON response")
        return {
            "category": "general", "risk_score": 0, "risk_level": "VERY_LOW",
            "verdict": "Analysis inconclusive",
            "overview": "The AI could not produce a structured analysis. Please try again.",
            "indicators": [], "claimed_organizations": [], "extracted_urls": [],
            "recommendation": "Try again or verify important information through an official channel.",
            "red_flags": [], "detected_language": "Unknown",
        }

    category = str(data.get("category", "general")).lower()
    data["category"] = category if category in {"scam", "promotional", "general"} else "general"
    try:
        data["risk_score"] = max(0, min(100, int(data.get("risk_score", 0))))
    except (ValueError, TypeError):
        data["risk_score"] = 0
    data["risk_level"] = str(data.get("risk_level", "VERY_LOW")).upper()
    if data["risk_level"] not in {"VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"}:
        data["risk_level"] = "VERY_LOW"
    for key in ("indicators", "claimed_organizations", "extracted_urls", "red_flags"):
        if not isinstance(data.get(key), list):
            data[key] = []
    if not isinstance(data.get("recommendation"), str):
        data["recommendation"] = "Verify important information through an official channel."
    if not isinstance(data.get("overview"), str):
        data["overview"] = "The message could not be fully summarized."
    for flag in data["red_flags"]:
        if isinstance(flag, dict):
            flag["severity"] = str(flag.get("severity", "MEDIUM")).upper()
            if flag["severity"] not in {"LOW", "MEDIUM", "HIGH"}:
                flag["severity"] = "MEDIUM"
            flag.setdefault("title", "Unknown flag")
            flag.setdefault("explanation", "No explanation provided")
    return data


def analyze_text(text: str, link_evidence: list[dict] | None = None) -> dict:
    client = get_client()
    evidence = json.dumps(link_evidence or [], ensure_ascii=False)[:30000]
    user = f"Analyze this message. Extract all URLs you can see. Secure backend link evidence is below; use it as evidence and do not invent findings.\n\nMESSAGE:\n{text}\n\nLINK EVIDENCE:\n{evidence}"
    response = client.chat.completions.create(
        model=get_text_model(),
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user}],
        temperature=0.2, max_tokens=2500, response_format={"type": "json_object"},
    )
    return _parse_ai_response(response.choices[0].message.content or "")


def analyze_image(image_data_url: str) -> dict:
    client = get_client()
    response = client.chat.completions.create(
        model=get_vision_model(),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "text", "text": "Read all visible text. Analyze the message. Extract every visible URL into extracted_urls. Return only the required JSON."},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ]},
        ],
        temperature=0.2, max_tokens=2500,
    )
    return _parse_ai_response(response.choices[0].message.content or "")


def analyze_url(url: str, link_evidence: dict | None = None) -> dict:
    client = get_client()
    evidence = json.dumps(link_evidence or {}, ensure_ascii=False)[:20000]
    response = client.chat.completions.create(
        model=get_text_model(),
        messages=[
            {"role": "system", "content": URL_SYSTEM_PROMPT},
            {"role": "user", "content": f"URL:\n{url}\n\nSECURE FETCH EVIDENCE:\n{evidence}"},
        ],
        temperature=0.2, max_tokens=1800, response_format={"type": "json_object"},
    )
    return _parse_ai_response(response.choices[0].message.content or "")
