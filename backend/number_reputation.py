"""Live internet reputation lookup for phone numbers.

The lookup uses a configured search provider rather than a hard-coded scam list.
Set SERPER_API_KEY for Google results via Serper, or GOOGLE_CSE_API_KEY and
GOOGLE_CSE_ID for Google Custom Search. Results are evidence, not proof of guilt.
"""
from __future__ import annotations

import asyncio
import os
import re
from typing import Any
from urllib.parse import quote_plus

import httpx


SCAM_TERMS = {
    "scam": 18, "fraud": 18, "fraudulent": 18, "spam": 10, "scammer": 20,
    "phishing": 18, "fake call": 16, "fake caller": 16, "reported": 12,
    "harassment": 8, "robocall": 8, "telemarketing": 5, "otp": 10,
    "bank fraud": 20, "payment scam": 20, "prize scam": 20, "loan scam": 18,
    "digital arrest": 25, "impersonat": 15,
}

TRUSTED_REPUTATION_DOMAINS = {
    "truecaller.com", "shouldianswer.com", "tellows.com", "800notes.com",
    "who-called.co.uk", "unknownphone.com", "shouldianswer.net",
    "scamwarners.com", "scamcallfighters.com", "scamdb.in", "frady.pk",
    "numberbata.com",
}


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def _search_queries(e164: str, national: str, country: str) -> list[str]:
    compact = _digits(e164)
    variants = list(dict.fromkeys([e164, compact, national]))
    queries: list[str] = []
    for number in variants:
        if not number:
            continue
        queries.extend([
            f'"{number}" scam',
            f'"{number}" fraud',
            f'"{number}" spam',
            f'"{number}" reported',
        ])
    # A broad query helps discover pages that use a formatted variant of the number.
    queries.append(f'"{compact}" "scam" "{country}"')
    return list(dict.fromkeys(queries))[:12]


def _domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        host = (urlparse(url).hostname or "").lower()
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return ""


def _score_result(title: str, snippet: str, url: str, number: str) -> tuple[int, list[str]]:
    text = f"{title} {snippet}".lower()
    exact = _digits(number) in _digits(text)
    points = 8 if exact else 0
    matched: list[str] = []
    for term, weight in SCAM_TERMS.items():
        if term in text:
            points += weight
            matched.append(term)
    if _domain(url) in TRUSTED_REPUTATION_DOMAINS:
        points += 10
    return min(points, 60), matched


async def _serper(query: str, client: httpx.AsyncClient) -> list[dict[str, Any]]:
    key = os.getenv("SERPER_API_KEY", "").strip()
    if not key:
        return []
    response = await client.post(
        "https://google.serper.dev/search",
        headers={"X-API-KEY": key, "Content-Type": "application/json"},
        json={"q": query, "num": 10},
    )
    response.raise_for_status()
    data = response.json()
    return [
        {"title": x.get("title", ""), "snippet": x.get("snippet", ""), "url": x.get("link", "")}
        for x in data.get("organic", []) if x.get("link")
    ]


async def _google_cse(query: str, client: httpx.AsyncClient) -> list[dict[str, Any]]:
    key = os.getenv("GOOGLE_CSE_API_KEY", "").strip()
    cx = os.getenv("GOOGLE_CSE_ID", "").strip()
    if not key or not cx:
        return []
    response = await client.get(
        "https://www.googleapis.com/customsearch/v1",
        params={"key": key, "cx": cx, "q": query, "num": 10},
    )
    response.raise_for_status()
    data = response.json()
    return [
        {"title": x.get("title", ""), "snippet": x.get("snippet", ""), "url": x.get("link", "")}
        for x in data.get("items", []) if x.get("link")
    ]


async def lookup_number_reputation(e164: str, national: str, country: str) -> dict[str, Any]:
    """Search the live web for public reports about an exact phone number."""
    queries = _search_queries(e164, national, country)
    timeout = httpx.Timeout(8.0, connect=4.0)
    results: list[dict[str, Any]] = []
    provider = "none"
    errors: list[str] = []

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={"User-Agent": "ScamShield/2.1"}) as client:
        tasks = []
        if os.getenv("SERPER_API_KEY"):
            provider = "serper"
            tasks = [_serper(q, client) for q in queries]
        elif os.getenv("GOOGLE_CSE_API_KEY") and os.getenv("GOOGLE_CSE_ID"):
            provider = "google_cse"
            tasks = [_google_cse(q, client) for q in queries]
        else:
            return {
                "available": False,
                "provider": "none",
                "searched": False,
                "report_count": 0,
                "evidence_score": 0,
                "sources": [],
                "message": "Live internet lookup is not configured. Add SERPER_API_KEY (recommended) or Google Custom Search credentials.",
            }

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for item in responses:
            if isinstance(item, Exception):
                errors.append(type(item).__name__)
                continue
            results.extend(item)

    # Deduplicate by URL and keep the strongest evidence first.
    unique: dict[str, dict[str, Any]] = {}
    for item in results:
        url = item.get("url", "")
        if not url:
            continue
        score, terms = _score_result(item.get("title", ""), item.get("snippet", ""), url, e164)
        enriched = {**item, "domain": _domain(url), "evidence_score": score, "matched_terms": terms}
        old = unique.get(url)
        if old is None or score > old["evidence_score"]:
            unique[url] = enriched

    ranked = sorted(unique.values(), key=lambda x: x["evidence_score"], reverse=True)
    strong = [x for x in ranked if x["evidence_score"] >= 18]
    moderate = [x for x in ranked if x["evidence_score"] >= 8]
    # Multiple independent pages are stronger evidence than one search result.
    distinct_domains = {x["domain"] for x in strong if x["domain"]}
    evidence_score = min(100, sum(x["evidence_score"] for x in strong[:6]) + max(0, len(distinct_domains) - 1) * 5)

    if strong:
        status = "reported_suspicious"
        message = f"Found {len(strong)} web result(s) containing scam/spam or related warning evidence."
    elif moderate:
        status = "weak_reports"
        message = f"Found {len(moderate)} potentially relevant web result(s), but the evidence is weak."
    elif ranked:
        status = "no_reports_found"
        message = "The web search returned results for the number, but none contained strong scam-report evidence."
    else:
        status = "unable_to_verify"
        message = "The internet search returned no usable results. This does not mean the number is safe."

    if errors and not ranked:
        status = "unable_to_verify"
        message = "The configured internet search service could not be reached."

    return {
        "available": True,
        "provider": provider,
        "searched": True,
        "report_count": len(strong),
        "evidence_score": evidence_score,
        "status": status,
        "message": message,
        "sources": ranked[:8],
        "search_queries": queries,
        "errors": errors[:3],
    }
