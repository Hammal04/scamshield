"""Pydantic models for AI ScamShield API request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, Literal


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="The suspicious message to analyze")


class URLRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="The suspicious URL to analyze")




class NumberRequest(BaseModel):
    number: str = Field(..., min_length=3, max_length=40, description="Phone number to analyze")
    default_region: str = Field(default="PK", min_length=2, max_length=2, description="ISO country/region code for local numbers")


class NumberIndicator(BaseModel):
    title: str
    severity: Literal["LOW", "MEDIUM", "HIGH"]
    explanation: str


class NumberSource(BaseModel):
    title: str
    snippet: str = ""
    url: str
    domain: str = ""
    evidence_score: int = 0
    matched_terms: list[str] = []


class NumberAnalysisResult(BaseModel):
    number: str
    normalized_number: str
    national_format: str
    country: str
    region_code: Optional[str] = None
    carrier: str
    number_type: str
    valid: bool
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: Literal["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    status: Literal["likely_safe", "suspicious", "likely_malicious"]
    verdict: str
    indicators: list[NumberIndicator] = []
    recommendation: str
    database_match: bool = False
    internet_checked: bool = False
    internet_status: Literal["reported_suspicious", "weak_reports", "no_reports_found", "unable_to_verify", "not_configured"] = "not_configured"
    internet_report_count: int = 0
    internet_evidence_score: int = 0
    internet_message: str = ""
    internet_sources: list[NumberSource] = []


class RedFlag(BaseModel):
    title: str
    severity: str
    explanation: str


class LinkAnalysis(BaseModel):
    url: str
    visited: bool
    original_domain: Optional[str] = None
    final_url: Optional[str] = None
    final_domain: Optional[str] = None
    redirected: bool = False
    redirect_count: int = 0
    domain_changed: bool = False
    domain_match: Optional[bool] = None
    website_title: Optional[str] = None
    visible_text: Optional[str] = None
    page_indicators: list[str] = []
    status: Literal["likely_safe", "suspicious", "likely_malicious", "unable_to_verify"]
    reason: str
    http_status: Optional[int] = None


class AnalysisResult(BaseModel):
    category: Literal["scam", "promotional", "general"]
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: Literal["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    verdict: str
    overview: str
    indicators: list[str] = []
    links: list[LinkAnalysis] = []
    recommendation: str
    # Backwards-compatible fields used by the existing History/UI.
    summary: str = ""
    red_flags: list[RedFlag] = []
    recommendations: list[str] = []
    detected_language: Optional[str] = None
    analysis_type: str = "text"
    input_preview: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    groq_configured: bool
    model: str


class RootResponse(BaseModel):
    message: str
