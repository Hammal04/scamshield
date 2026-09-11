"""Transparent risk engine for AI ScamShield.

The AI identifies evidence (red flags); this engine calculates and validates
the final risk score based on weighted indicators. This ensures the score is
not solely dependent on an arbitrary AI-generated percentage.
"""

INDICATOR_WEIGHTS: dict[str, int] = {
    "urgency": 15,
    "financial manipulation": 20,
    "credential request": 25,
    "otp request": 25,
    "password request": 25,
    "suspicious link": 20,
    "impersonation": 15,
    "prize bait": 15,
    "threat": 15,
    "account blocking": 15,
    "suspicious payment request": 20,
    "fake job": 15,
    "fake government notice": 15,
    "social engineering": 15,
    "personal information request": 15,
    "fake banking": 20,
    "fake courier": 15,
    "fake scholarship": 15,
}

SEVERITY_MULTIPLIER = {"LOW": 0.5, "MEDIUM": 0.75, "HIGH": 1.0}


def calculate_risk_score(red_flags: list[dict]) -> int:
    """Calculate a 0-100 risk score from detected red flags.

    Each red flag has a title (matched to an indicator) and a severity.
    The score is the sum of weighted indicators * severity multiplier,
    normalized to 0-100.
    """
    if not red_flags:
        return 0

    raw_score = 0
    for flag in red_flags:
        title = flag.get("title", "").lower().strip()
        severity = flag.get("severity", "MEDIUM").upper().strip()
        multiplier = SEVERITY_MULTIPLIER.get(severity, 0.75)

        for indicator, weight in INDICATOR_WEIGHTS.items():
            if indicator in title:
                raw_score += int(weight * multiplier)
                break

    # Normalize: cap at 100
    return min(100, raw_score)


def get_risk_level(score: int) -> str:
    """Map a 0-100 score to a risk level."""
    if score < 30:
        return "LOW"
    elif score < 60:
        return "MEDIUM"
    elif score < 80:
        return "HIGH"
    return "CRITICAL"


def assess_url(url: str) -> list[dict]:
    """Analyze a URL for suspicious indicators (heuristic, not definitive)."""
    flags: list[dict] = []
    url_lower = url.lower().strip()

    if url_lower.startswith("http://"):
        flags.append({
            "title": "Insecure protocol",
            "severity": "MEDIUM",
            "explanation": "The URL uses HTTP instead of HTTPS. Legitimate sites typically use HTTPS for secure connections.",
        })

    shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "shorte.st"]
    for s in shorteners:
        if s in url_lower:
            flags.append({
                "title": "URL shortener",
                "severity": "HIGH",
                "explanation": f"This URL uses a link shortener ({s}), which hides the true destination. Scammers use shorteners to disguise malicious links.",
            })
            break

    subdomain_parts = url_lower.split("/")[0].split(".")
    if len(subdomain_parts) > 4:
        flags.append({
            "title": "Excessive subdomains",
            "severity": "MEDIUM",
            "explanation": f"This URL has an unusually long subdomain chain ({'.'.join(subdomain_parts)}), which can indicate an attempt to impersonate a legitimate domain.",
        })

    hyphen_count = url_lower.split("/")[0].count("-")
    if hyphen_count >= 2:
        flags.append({
            "title": "Domain impersonation",
            "severity": "HIGH",
            "explanation": "The domain contains multiple hyphens, a common tactic used to create look-alike domains that impersonate trusted brands.",
        })

    common_brands = ["paypal", "apple", "google", "microsoft", "amazon", "netflix", "facebook", "instagram", "whatsapp", "bank", "hbl", "meezan", "easypaisa", "jazzcash", "alfalah", "ubl"]
    for brand in common_brands:
        if brand in url_lower:
            parts = url_lower.split("/")
            domain_part = parts[0]
            if brand in domain_part:
                if hyphen_count > 0 or len(subdomain_parts) > 3:
                    flags.append({
                        "title": "Brand impersonation",
                        "severity": "HIGH",
                        "explanation": f"The domain appears to reference '{brand}' but uses suspicious formatting, suggesting it may be impersonating a legitimate brand.",
                    })
                    break

    if "@" in url_lower.split("/")[0]:
        flags.append({
            "title": "Suspicious URL structure",
            "severity": "HIGH",
            "explanation": "The URL contains an '@' symbol in the domain, which can be used to redirect users to a different destination than what appears.",
        })

    suspicious_tlds = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click", ".country"]
    for tld in suspicious_tlds:
        if url_lower.split("/")[0].endswith(tld):
            flags.append({
                "title": "Suspicious domain extension",
                "severity": "MEDIUM",
                "explanation": f"This URL uses a .{tld[1:]} domain extension, which is frequently abused for scam sites due to low registration costs.",
            })
            break

    if len(url_lower) > 100:
        flags.append({
            "title": "Excessively long URL",
            "severity": "LOW",
            "explanation": "This URL is unusually long, which can be used to hide suspicious parameters or redirect destinations.",
        })

    if any(kw in url_lower for kw in ["login", "verify", "account", "update", "secure", "confirm", "suspend", "wallet"]):
        if hyphen_count > 0 or len(subdomain_parts) > 3 or any(s in url_lower for s in shorteners):
            flags.append({
                "title": "Credential harvesting keywords",
                "severity": "HIGH",
                "explanation": "The URL contains keywords like 'login', 'verify', or 'account' combined with other suspicious indicators, suggesting a potential credential harvesting attempt.",
            })

    return flags
