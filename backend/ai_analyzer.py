"""AI service for AI ScamShield — handles all Groq API interactions.

This module is the single place that talks to Groq. main.py never touches
the API key or model names directly.
"""

import os
import json
import logging
from typing import Optional

from groq import Groq
from utils import clean_json_response

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ScamShield, an AI cybersecurity analysis assistant. Your job is to help ordinary users identify potential scams, phishing, fraud, impersonation, and social-engineering attacks.

## Your role
- Analyze suspicious messages, screenshots, and URLs.
- Identify specific red flags and explain why they matter in plain language.
- Provide actionable safety recommendations.

## Critical rules
1. Do NOT automatically label every financial or unusual message as a scam. Consider context and evidence. A legitimate electricity bill reminder is NOT a scam. A legitimate bank notification is NOT a scam.
2. Base your assessment on EVIDENCE, not assumptions. If there is no clear red flag, say so.
3. Explain the manipulation tactics behind each red flag so the user understands WHY it's suspicious.
4. Support English, Urdu, and Roman Urdu. Detect the language of the input.
5. NEVER request or reproduce the user's passwords, OTPs, bank credentials, or private secrets.
6. Do not reproduce sensitive information from the message unnecessarily.
7. Keep explanations understandable to ordinary, non-technical users.

## Red flags to look for
- Urgency (pressuring immediate action)
- Fear or threats
- Financial manipulation
- Prize or reward bait
- OTP or password requests
- Personal information requests
- Suspicious links
- Account suspension threats
- Impersonation of banks, government, companies, or individuals
- Social engineering tactics
- Fake job offers
- Fake government notices
- Fake banking or payment requests
- Suspicious payment instructions

## Response format
You MUST respond with ONLY a valid JSON object (no markdown, no extra text) in this exact structure:
{
  "risk_score": <integer 0-100 based on your assessment>,
  "risk_level": "<LOW, MEDIUM, HIGH, or CRITICAL>",
  "verdict": "<short verdict like 'Likely scam' or 'Appears legitimate'>",
  "summary": "<one or two sentence summary of the assessment>",
  "red_flags": [
    {
      "title": "<short name of the red flag>",
      "severity": "<LOW, MEDIUM, or HIGH>",
      "explanation": "<plain-language explanation of why this is a red flag>"
    }
  ],
  "recommendations": [
    "<actionable safety recommendation>",
    "<actionable safety recommendation>"
  ],
  "detected_language": "<English, Urdu, or Roman Urdu>"
}

## Risk level mapping
- 0-29: LOW
- 30-59: MEDIUM
- 60-79: HIGH
- 80-100: CRITICAL

If the content appears legitimate with no red flags, return an empty red_flags array, a low risk score, and a verdict like "Appears legitimate".

Remember: your goal is to EDUCATE users about manipulation tactics, not just say "scam" or "not scam"."""

URL_SYSTEM_PROMPT = """You are ScamShield, an AI cybersecurity assistant specializing in URL analysis. Analyze the provided URL for suspicious indicators.

IMPORTANT: You cannot definitively prove a URL is malicious. Provide an indicator-based assessment only.

Look for:
- Suspicious domain structure (misspellings, excessive subdomains)
- Domain impersonation of known brands
- URL shorteners that hide destinations
- Strange paths or suspicious parameters
- Credential harvesting keywords (login, verify, account, update)
- Insecure protocols (HTTP instead of HTTPS)
- Unusual domain extensions

Respond with ONLY a valid JSON object using this structure:
{
  "risk_score": <0-100>,
  "risk_level": "<LOW, MEDIUM, HIGH, or CRITICAL>",
  "verdict": "<short verdict>",
  "summary": "<one or two sentence summary>",
  "red_flags": [
    {
      "title": "<indicator name>",
      "severity": "<LOW, MEDIUM, or HIGH>",
      "explanation": "<why this indicator is suspicious>"
    }
  ],
  "recommendations": ["<safety recommendation>"],
  "detected_language": "English"
}

If the URL appears normal, return a low score with an empty red_flags array."""


def get_client() -> Groq:
    """Create a Groq client from environment variables."""
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
    """Clean and parse the AI's JSON response with a safe fallback."""
    cleaned = clean_json_response(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse AI JSON response, using fallback")
        return {
            "risk_score": 50,
            "risk_level": "MEDIUM",
            "verdict": "Analysis inconclusive",
            "summary": "The AI could not produce a structured analysis. Please try again.",
            "red_flags": [],
            "recommendations": ["Try analyzing the content again", "If in doubt, contact the organization through official channels"],
            "detected_language": "Unknown",
        }

    # Validate and normalize fields
    if not isinstance(data.get("red_flags"), list):
        data["red_flags"] = []
    if not isinstance(data.get("recommendations"), list):
        data["recommendations"] = []
    if not isinstance(data.get("risk_score"), int):
        try:
            data["risk_score"] = int(data.get("risk_score", 50))
        except (ValueError, TypeError):
            data["risk_score"] = 50
    data["risk_score"] = max(0, min(100, data["risk_score"]))

    valid_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    if data.get("risk_level", "").upper() not in valid_levels:
        data["risk_level"] = "MEDIUM"
    else:
        data["risk_level"] = data["risk_level"].upper()

    for flag in data["red_flags"]:
        if not isinstance(flag, dict):
            continue
        sev = str(flag.get("severity", "MEDIUM")).upper()
        if sev not in {"LOW", "MEDIUM", "HIGH"}:
            sev = "MEDIUM"
        flag["severity"] = sev
        flag.setdefault("title", "Unknown flag")
        flag.setdefault("explanation", "No explanation provided")

    return data


def analyze_text(text: str) -> dict:
    """Send text to Groq for scam analysis."""
    client = get_client()
    model = get_text_model()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this message for scam indicators:\n\n{text}"},
        ],
        temperature=0.3,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or ""
    return _parse_ai_response(raw)


def analyze_image(image_data_url: str) -> dict:
    """Send an image (as base64 data URL) to Groq vision model for scam analysis."""
    client = get_client()
    model = get_vision_model()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze the text and content visible in this screenshot for scam indicators. Read all visible text, understand the context, identify suspicious patterns, and analyze any URLs shown. Return your analysis as the structured JSON object.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_url},
                    },
                ],
            },
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content or ""
    return _parse_ai_response(raw)


def analyze_url(url: str) -> dict:
    """Send a URL to Groq for indicator-based analysis."""
    client = get_client()
    model = get_text_model()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": URL_SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this URL for suspicious indicators:\n\n{url}"},
        ],
        temperature=0.3,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or ""
    return _parse_ai_response(raw)
