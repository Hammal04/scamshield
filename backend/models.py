"""Pydantic models for AI ScamShield API request/response schemas."""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="The suspicious message to analyze")


class URLRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="The suspicious URL to analyze")


class RedFlag(BaseModel):
    title: str
    severity: str  # LOW, MEDIUM, HIGH
    explanation: str


class AnalysisResult(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    verdict: str
    summary: str
    red_flags: list[RedFlag]
    recommendations: list[str]
    detected_language: Optional[str] = None
    analysis_type: str = "text"  # text, image, url
    input_preview: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    groq_configured: bool
    model: str


class RootResponse(BaseModel):
    message: str
