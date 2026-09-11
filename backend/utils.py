"""Utility functions for AI ScamShield backend."""

import re
import base64
from typing import Optional


def clean_json_response(text: str) -> str:
    """Remove markdown fences and extract JSON from AI response."""
    cleaned = text.strip()

    # Remove markdown code fences
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json or ```)
        lines = lines[1:]
        # Remove last line if it's ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    # Try to extract JSON object if there's surrounding text
    json_match = re.search(r'\{[\s\S]*\}', cleaned)
    if json_match:
        cleaned = json_match.group(0)

    return cleaned.strip()


def truncate_preview(text: str, max_len: int = 120) -> str:
    """Create a short preview of input text."""
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(" ", 1)[0] + "..."


def image_to_base64_data_url(image_bytes: bytes, mime_type: str) -> str:
    """Convert image bytes to a base64 data URL for Groq vision API."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64}"


def validate_image_content(file_bytes: bytes) -> Optional[str]:
    """Validate image bytes by checking magic bytes. Returns mime type or None."""
    if len(file_bytes) < 12:
        return None

    if file_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return "image/png"
    if file_bytes[:3] == b'\xff\xd8\xff':
        return "image/jpeg"
    if file_bytes[:4] == b'RIFF' and file_bytes[8:12] == b'WEBP':
        return "image/webp"
    return None
