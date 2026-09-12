"""Phone-number reputation and safety analysis for ScamShield."""
import os
import re
from typing import Any

import phonenumbers
from phonenumbers import NumberParseException
from phonenumbers import carrier, geocoder, number_type


def _configured_blocklist() -> set[str]:
    raw = os.environ.get("SCAM_NUMBER_BLOCKLIST", "")
    return {re.sub(r"\D", "", x) for x in raw.split(",") if re.sub(r"\D", "", x)}


def analyze_number(raw_number: str, default_region: str = "PK") -> dict[str, Any]:
    raw = raw_number.strip()
    if not raw:
        raise ValueError("Please enter a phone number.")

    # Reject obvious non-phone input before the parser gets too permissive.
    if len(raw) > 40 or not re.search(r"\d", raw):
        raise ValueError("Please enter a valid phone number.")

    try:
        parsed = phonenumbers.parse(raw, default_region.upper())
    except NumberParseException:
        raise ValueError("The phone number could not be parsed. Try an international format such as +923001234567.")

    if not phonenumbers.is_possible_number(parsed):
        raise ValueError("This does not look like a possible phone number.")

    e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    national = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
    digits = re.sub(r"\D", "", e164)
    country = geocoder.description_for_number(parsed, "en") or phonenumbers.region_code_for_number(parsed) or "Unknown"
    carrier_name = carrier.name_for_number(parsed, "en") or "Unknown"
    type_name = phonenumbers.PhoneNumberType
    ntype = number_type(parsed)
    type_labels = {
        type_name.MOBILE: "Mobile",
        type_name.FIXED_LINE: "Fixed line",
        type_name.FIXED_LINE_OR_MOBILE: "Fixed line or mobile",
        type_name.VOIP: "VoIP",
        type_name.PAGER: "Pager",
        type_name.PERSONAL_NUMBER: "Personal number",
        type_name.PREMIUM_RATE: "Premium-rate",
        type_name.SHARED_COST: "Shared-cost",
        type_name.TOLL_FREE: "Toll-free",
    }

    indicators: list[dict[str, str]] = []
    normalized_digits = re.sub(r"\D", "", e164)
    blocklist = _configured_blocklist()
    if normalized_digits in blocklist:
        indicators.append({"title": "Number is on the configured scam blocklist", "severity": "HIGH", "explanation": "This exact number matches a number supplied to ScamShield's configured scam-number blocklist."})

    # These are caution signals only; they are deliberately not treated as proof of fraud.
    if ntype == type_name.PREMIUM_RATE:
        indicators.append({"title": "Premium-rate number", "severity": "MEDIUM", "explanation": "Premium-rate numbers can create unexpected charges. Verify the caller independently before calling back."})
    if ntype == type_name.VOIP:
        indicators.append({"title": "VoIP number", "severity": "LOW", "explanation": "VoIP numbers are easy to obtain and can be used legitimately or abusively. This alone does not indicate a scam."})
    if raw.startswith("00"):
        indicators.append({"title": "International dialing format", "severity": "LOW", "explanation": "The number uses an international dialing prefix. This is informational and is not evidence of a scam."})

    # Repeated/sequential digits can be a sign of synthetic/test numbers, but not fraud by themselves.
    if re.search(r"(\d)\1{5,}", digits) or re.search(r"012345|123456|987654", digits):
        indicators.append({"title": "Unusual digit pattern", "severity": "LOW", "explanation": "The number contains an unusual repeated or sequential digit pattern. Treat this as a weak signal only."})

    score = 5
    for item in indicators:
        score += {"LOW": 5, "MEDIUM": 15, "HIGH": 70}.get(item["severity"], 0)
    score = min(100, score)
    if normalized_digits in blocklist:
        level = "CRITICAL"
        verdict = "This number matches a configured scam-number report."
        recommendation = "Do not call back, send money, share OTPs, or provide personal information. Verify the caller through an official channel."
        status = "likely_malicious"
    elif score >= 61:
        level = "HIGH"
        verdict = "This number has strong warning signals, but a phone number alone cannot prove fraud."
        recommendation = "Avoid calling back until you independently verify who owns the number."
        status = "suspicious"
    elif score >= 21:
        level = "MEDIUM"
        verdict = "This number has some caution signals, but there is not enough evidence to call it a scam."
        recommendation = "Use caution and verify the caller independently before sharing information or making payments."
        status = "suspicious"
    else:
        level = "VERY_LOW"
        verdict = "No strong scam-number signals were found from the available number intelligence."
        recommendation = "A clean result does not guarantee the caller is legitimate. Do not share sensitive information unless you verify the caller."
        status = "likely_safe"

    return {
        "number": raw,
        "normalized_number": e164,
        "national_format": national,
        "country": country,
        "region_code": phonenumbers.region_code_for_number(parsed) or None,
        "carrier": carrier_name,
        "number_type": type_labels.get(ntype, "Unknown"),
        "valid": phonenumbers.is_valid_number(parsed),
        "risk_score": score,
        "risk_level": level,
        "status": status,
        "verdict": verdict,
        "indicators": indicators,
        "recommendation": recommendation,
        "database_match": normalized_digits in blocklist,
    }
