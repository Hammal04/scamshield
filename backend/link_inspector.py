"""Safe URL extraction and destination inspection for ScamShield.

This module deliberately treats every user supplied URL as untrusted. It validates
hosts before each request, blocks private/internal destinations, follows redirects
manually, and only returns a bounded amount of page content for AI analysis.
"""

import asyncio
import ipaddress
import re
import socket
from html.parser import HTMLParser
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx

URL_RE = re.compile(r"(?i)(?<![\w@])(?:(?:https?://)|(?:www\.))[^\s<>'\"\]\[(){}]+")
DOMAIN_RE = re.compile(r"(?i)(?<![\w@])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:/[^\s<>'\"\]\[(){}]*)?")

MAX_REDIRECTS = 5
MAX_RESPONSE_BYTES = 512 * 1024
MAX_PAGE_TEXT = 12000
TIMEOUT = httpx.Timeout(8.0, connect=4.0)
BLOCKED_HOSTS = {
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    "metadata.google.internal.",
    "instance-data.ec2.internal",
}
BLOCKED_IPS = {"169.254.169.254", "100.100.100.200"}

# Known official domains used only as supporting evidence for brand/domain matching.
OFFICIAL_DOMAINS = {
    "microsoft": {"microsoft.com", "live.com", "office.com", "microsoftonline.com"},
    "google": {"google.com", "googleusercontent.com", "googleapis.com"},
    "apple": {"apple.com", "icloud.com"},
    "amazon": {"amazon.com", "amazon.co.uk", "amazon.in", "amazon.com.au"},
    "meta": {"meta.com", "facebook.com", "instagram.com", "whatsapp.com"},
    "facebook": {"facebook.com", "meta.com"},
    "instagram": {"instagram.com", "meta.com"},
    "whatsapp": {"whatsapp.com", "meta.com"},
    "paypal": {"paypal.com"},
    "netflix": {"netflix.com"},
    "hbl": {"hbl.com"},
    "meezan": {"meezanbank.com"},
    "ubl": {"ubldigital.com", "ubl.com.pk"},
    "alfalah": {"bankalfalah.com"},
    "easypaisa": {"easypaisa.com.pk"},
    "jazzcash": {"jazzcash.com.pk"},
}


class _PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.text_parts: list[str] = []
        self.forms: list[dict] = []
        self._in_title = False
        self._current_form: Optional[dict] = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        attrs_dict = {k.lower(): (v or "") for k, v in attrs}
        tag = tag.lower()
        if tag == "title":
            self._in_title = True
        elif tag == "form":
            self._current_form = {"action": attrs_dict.get("action", ""), "inputs": []}
            self.forms.append(self._current_form)
        elif tag == "input" and self._current_form is not None:
            self._current_form["inputs"].append({
                "type": attrs_dict.get("type", "text").lower(),
                "name": attrs_dict.get("name", "").lower(),
                "autocomplete": attrs_dict.get("autocomplete", "").lower(),
            })

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self._in_title = False
        elif tag.lower() == "form":
            self._current_form = None

    def handle_data(self, data: str) -> None:
        cleaned = re.sub(r"\s+", " ", data).strip()
        if not cleaned:
            return
        if self._in_title:
            self.title += (" " if self.title else "") + cleaned
        else:
            self.text_parts.append(cleaned)

    @property
    def visible_text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.text_parts)).strip()[:MAX_PAGE_TEXT]


def extract_urls(text: str) -> list[str]:
    """Extract unique URLs, including bare www./domain URLs, from a message."""
    found: list[str] = []
    for match in URL_RE.finditer(text or ""):
        raw = match.group(0).rstrip(".,;:!?)]}")
        if raw.lower().startswith("www."):
            raw = "https://" + raw
        if raw not in found:
            found.append(raw)

    # Also catch bare domains such as example.com/login that are not prefixed by www.
    for match in DOMAIN_RE.finditer(text or ""):
        raw = match.group(0).rstrip(".,;:!?)]}")
        if raw.lower().startswith("www."):
            continue
        candidate = "https://" + raw
        if candidate not in found:
            found.append(candidate)
    return found


def _host_is_public(host: str) -> tuple[bool, str]:
    host = host.strip().lower().rstrip(".")
    if not host or host in BLOCKED_HOSTS:
        return False, "The hostname is local or internal."

    try:
        ip = ipaddress.ip_address(host)
        if str(ip) in BLOCKED_IPS or not ip.is_global:
            return False, "The destination resolves to a private, local, reserved, or metadata IP address."
        return True, ""
    except ValueError:
        pass

    try:
        infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except OSError as exc:
        return False, f"DNS lookup failed: {exc}"

    addresses = {item[4][0] for item in infos}
    if not addresses:
        return False, "The hostname did not resolve to an address."
    for address in addresses:
        try:
            ip = ipaddress.ip_address(address)
        except ValueError:
            return False, "The hostname resolved to an invalid address."
        if str(ip) in BLOCKED_IPS or not ip.is_global:
            return False, "The destination resolves to a private, local, reserved, or metadata IP address."
    return True, ""


def validate_url(url: str) -> tuple[bool, str]:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False, "Malformed URL."
    if parsed.scheme.lower() not in {"http", "https"}:
        return False, "Only HTTP and HTTPS URLs are allowed."
    if not parsed.hostname:
        return False, "URL has no hostname."
    if parsed.username or parsed.password:
        return False, "URLs containing embedded credentials are not allowed."
    try:
        port = parsed.port
    except ValueError:
        return False, "Invalid URL port."
    if port not in (None, 80, 443):
        return False, "Non-standard ports are blocked for safety."
    return _host_is_public(parsed.hostname)


def _domain(url: str) -> str:
    return (urlparse(url).hostname or "").lower().rstrip(".")


def domains_match(domain: str, official_domains: set[str]) -> bool:
    domain = domain.lower().rstrip(".")
    return any(domain == d or domain.endswith("." + d) for d in official_domains)


def compare_claimed_brand(claimed_brands: list[str], final_domain: str) -> Optional[bool]:
    """Return True/False when a known brand can be compared; otherwise None."""
    normalized = [re.sub(r"[^a-z0-9]", "", b.lower()) for b in claimed_brands]
    for brand in normalized:
        if brand in OFFICIAL_DOMAINS:
            return domains_match(final_domain, OFFICIAL_DOMAINS[brand])
    return None


def _form_findings(parser: _PageParser) -> list[str]:
    findings: list[str] = []
    for form in parser.forms:
        for field in form["inputs"]:
            field_text = f"{field['type']} {field['name']} {field['autocomplete']}"
            if field["type"] == "password" or any(k in field_text for k in ("password", "passwd")):
                findings.append("Password field detected")
            if any(k in field_text for k in ("otp", "one-time", "verification-code", "auth-code")):
                findings.append("OTP/verification-code field detected")
            if any(k in field_text for k in ("card", "cvv", "cvc", "iban", "account-number")):
                findings.append("Payment/banking field detected")
    return list(dict.fromkeys(findings))


async def inspect_url(url: str) -> dict:
    """Safely fetch a URL and return bounded destination/page evidence."""
    original = url.strip()
    valid, reason = validate_url(original)
    base = {
        "url": original, "visited": False, "original_domain": _domain(original),
        "final_url": None, "final_domain": None, "redirected": False,
        "redirect_count": 0, "domain_changed": False, "domain_match": None,
        "website_title": None, "visible_text": None, "page_indicators": [],
        "status": "unable_to_verify", "reason": reason if not valid else "The destination could not be safely accessed.",
        "http_status": None,
    }
    if not valid:
        return base

    current = original
    redirects = 0
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False,
                                      headers={"User-Agent": "ScamShield-Link-Checker/1.0"}) as client:
            while True:
                valid, reason = validate_url(current)
                if not valid:
                    base["reason"] = reason
                    return base

                async with client.stream("GET", current) as response:
                    base["visited"] = True
                    base["http_status"] = response.status_code
                    location = response.headers.get("location")
                    if response.status_code in {301, 302, 303, 307, 308}:
                        if not location:
                            break
                        redirects += 1
                        if redirects > MAX_REDIRECTS:
                            base["reason"] = f"The URL exceeded the maximum of {MAX_REDIRECTS} redirects."
                            base["redirect_count"] = redirects
                            base["redirected"] = True
                            return base
                        current = urljoin(current, location)
                        continue

                    base["final_url"] = current
                    base["final_domain"] = _domain(current)
                    base["redirect_count"] = redirects
                    base["redirected"] = redirects > 0
                    base["domain_changed"] = base["original_domain"] != base["final_domain"]

                    content_type = response.headers.get("content-type", "").lower()
                    if "text/html" in content_type:
                        chunks = []
                        total = 0
                        async for chunk in response.aiter_bytes():
                            if total >= MAX_RESPONSE_BYTES:
                                break
                            take = chunk[:MAX_RESPONSE_BYTES - total]
                            chunks.append(take)
                            total += len(take)
                        body = b"".join(chunks)
                        parser = _PageParser()
                        parser.feed(body.decode(response.encoding or "utf-8", errors="replace"))
                        base["website_title"] = parser.title[:300] or None
                        base["visible_text"] = parser.visible_text or None
                        base["page_indicators"] = _form_findings(parser)
                        page_lower = (parser.visible_text + " " + (parser.title or "")).lower()
                        if any(k in page_lower for k in ("verify immediately", "account will be deleted", "account suspended", "confirm your password")):
                            base["page_indicators"].append("Urgent account/security language detected")
                        if any(k in page_lower for k in ("one-time password", "otp", "verification code")):
                            base["page_indicators"].append("OTP-related language detected")
                        if any(k in page_lower for k in ("credit card", "debit card", "bank account", "card number")):
                            base["page_indicators"].append("Payment/banking language detected")
                        base["page_indicators"] = list(dict.fromkeys(base["page_indicators"]))

                    base["status"] = "likely_safe" if response.status_code < 400 and not base["page_indicators"] else "suspicious"
                    base["reason"] = "Website was reached; destination and content evidence are used for the safety assessment. HTTP status alone does not establish safety."
                    return base
    except (httpx.TimeoutException, asyncio.TimeoutError):
        base["reason"] = "The destination timed out and could not be fully verified."
        return base
    except httpx.RequestError as exc:
        base["reason"] = f"The destination could not be accessed safely: {exc.__class__.__name__}."
        return base
    except Exception:
        base["reason"] = "The destination could not be safely accessed."
        return base


async def inspect_urls(urls: list[str]) -> list[dict]:
    if not urls:
        return []
    return await asyncio.gather(*(inspect_url(url) for url in urls))
