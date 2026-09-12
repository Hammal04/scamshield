"""Transparent weighted risk engine for ScamShield."""

INDICATOR_WEIGHTS: dict[str, int] = {
    "urgency": 15, "financial manipulation": 20, "credential request": 25,
    "otp request": 25, "otp field": 25, "password request": 25, "password field": 25,
    "suspicious link": 15, "impersonation": 15, "prize bait": 15, "threat": 15,
    "account blocking": 15, "suspicious payment request": 20, "payment/banking": 20,
    "fake job": 15, "fake government notice": 15, "social engineering": 15,
    "personal information request": 15, "fake banking": 20, "fake courier": 15,
    "fake scholarship": 15, "domain mismatch": 25, "redirected url": 8,
    "domain changed": 10, "credential harvesting": 20, "brand impersonation": 20,
}
SEVERITY_MULTIPLIER = {"LOW": 0.5, "MEDIUM": 0.75, "HIGH": 1.0}


def calculate_risk_score(red_flags: list[dict]) -> int:
    if not red_flags:
        return 0
    raw = 0
    for flag in red_flags:
        title = str(flag.get("title", "")).lower().strip()
        severity = str(flag.get("severity", "MEDIUM")).upper().strip()
        multiplier = SEVERITY_MULTIPLIER.get(severity, 0.75)
        for indicator, weight in INDICATOR_WEIGHTS.items():
            if indicator in title:
                raw += int(weight * multiplier)
                break
    return min(100, raw)


def get_risk_level(score: int) -> str:
    if score <= 20:
        return "VERY_LOW"
    if score <= 40:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


def assess_url(url: str) -> list[dict]:
    flags: list[dict] = []
    url_lower = url.lower().strip()
    if url_lower.startswith("http://"):
        flags.append({"title": "Insecure protocol", "severity": "LOW", "explanation": "The URL uses HTTP rather than HTTPS. This is a security weakness, but HTTP alone does not prove a scam."})
    shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "shorte.st"]
    if any(s in url_lower for s in shorteners):
        s = next(s for s in shorteners if s in url_lower)
        flags.append({"title": "Suspicious link", "severity": "MEDIUM", "explanation": f"The URL uses a link shortener ({s}), which hides the destination. This is an indicator to inspect the final destination, not proof of maliciousness."})
    host = url_lower.split("/", 1)[0]
    if host.count(".") >= 4:
        flags.append({"title": "Excessive subdomains", "severity": "MEDIUM", "explanation": "The URL contains an unusually long hostname structure."})
    if host.count("-") >= 2:
        flags.append({"title": "Brand impersonation", "severity": "HIGH", "explanation": "Multiple hyphens can be used in look-alike domains, especially when combined with a trusted brand name."})
    if "@" in host:
        flags.append({"title": "Suspicious URL structure", "severity": "HIGH", "explanation": "An @ symbol in a URL can make the visible portion misleading and should be treated cautiously."})
    if any(host.endswith(tld) for tld in (".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click", ".country")):
        flags.append({"title": "Suspicious domain extension", "severity": "LOW", "explanation": "This domain extension is commonly abused for low-cost disposable sites. The extension alone is not proof of a scam."})
    return flags
