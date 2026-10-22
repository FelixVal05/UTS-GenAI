import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup
import httpx

from ..config import settings

JINA = "https://r.jina.ai/"
BLOCK_MARKERS = (
    "authwall", "captcha", "just a moment", "access denied", "enable javascript",
    "sign in to continue", "join linkedin", "verify you are human", "cloudflare",
)
DEFAULT_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class JobFetchError(Exception):
    pass


def _extract_linkedin_job_id(url: str) -> str | None:
    m = re.search(r"(?:view/|currentJobId=)(\d+)", url)
    return m.group(1) if m else None


def _parse_linkedin_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    title_el = (
        soup.find(class_="top-card-layout__title")
        or soup.find(class_="topcard__title")
        or soup.find("h2")
        or soup.find("h1")
    )
    company_el = (
        soup.find(class_="topcard__org-name-link")
        or soup.find(class_="topcard__flavor")
        or soup.find(class_="sub-nav-cta__optional-url")
    )
    desc_el = (
        soup.find(class_="show-more-less-html__markup")
        or soup.find(class_="description__text")
        or soup.find(class_="decorated-job-posting__details")
        or soup.find("article")
    )

    parts = []
    if title_el:
        t = title_el.get_text(strip=True)
        if t:
            parts.append(f"Title: {t}")
    if company_el:
        c = company_el.get_text(strip=True)
        if c:
            parts.append(f"Company: {c}")

    if desc_el:
        d = desc_el.get_text(separator="\n", strip=True)
        if d:
            parts.append(d)
    else:
        body_text = soup.get_text(separator="\n", strip=True)
        if len(body_text) > 200:
            parts.append(body_text)

    return "\n\n".join(parts).strip()


async def _fetch_linkedin(job_id: str, client: httpx.AsyncClient) -> str:
    endpoint = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
    try:
        r = await client.get(endpoint, headers=DEFAULT_BROWSER_HEADERS)
        if r.status_code == 200 and len(r.text.strip()) > 300:
            parsed = _parse_linkedin_html(r.text)
            if len(parsed) >= 200:
                return parsed
    except Exception as e:
        print(f"[job_scraper] linkedin guest api direct error: {e}")

    # Fallback LinkedIn via Jina Reader
    jina_url = JINA + endpoint
    jina_headers = {
        "User-Agent": DEFAULT_BROWSER_HEADERS["User-Agent"],
        "Accept": "text/plain",
        "X-Return-Format": "text",
    }
    if settings.jina_api_key:
        jina_headers["Authorization"] = f"Bearer {settings.jina_api_key}"
    try:
        r = await client.get(jina_url, headers=jina_headers)
        if r.status_code == 200 and len(r.text.strip()) >= 200:
            return r.text.strip()
    except Exception as e:
        print(f"[job_scraper] linkedin jina fallback error: {e}")

    return ""


def _extract_content_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "noscript", "svg"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def _slice_job_description(text: str, max_chars: int) -> str:
    keywords = (
        "about the job", "responsibilities", "qualifications", "requirements",
        "kualifikasi", "deskripsi pekerjaan", "persyaratan", "job description",
        "what you'll do", "what you need", "who you are",
    )
    lower = text.lower()
    hits = [i for i in (lower.find(k) for k in keywords) if i != -1]
    if hits:
        start = max(min(hits) - 300, 0)
        if start > 800:
            header = text[:800]
            return (header + "\n\n" + text[start:])[:max_chars]
    return text[:max_chars]


async def fetch_job_text(url: str, max_chars: int = 8000) -> str:
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise JobFetchError("URL harus diawali http:// atau https://")

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        # 1. Jalur khusus LinkedIn
        if "linkedin.com" in p.netloc.lower():
            job_id = _extract_linkedin_job_id(url)
            if job_id:
                text = await _fetch_linkedin(job_id, client)
                if text and len(text) >= 200:
                    return _slice_job_description(text, max_chars)

        # 2. Jalur umum: Coba Jina Reader dengan browser headers & X-Return-Format
        jina_headers = {
            "User-Agent": DEFAULT_BROWSER_HEADERS["User-Agent"],
            "Accept": "text/plain",
            "X-Return-Format": "text",
        }
        if settings.jina_api_key:
            jina_headers["Authorization"] = f"Bearer {settings.jina_api_key}"

        jina_text = ""
        try:
            r = await client.get(JINA + url, headers=jina_headers)
            if r.status_code == 200:
                t = r.text.strip()
                head = t[:3000].lower()
                if len(t) >= 300 and not any(m in head for m in BLOCK_MARKERS):
                    jina_text = t
        except Exception as e:
            print(f"[job_scraper] jina error: {e}")

        if jina_text:
            return _slice_job_description(jina_text, max_chars)

        # 3. Fallback: Direct fetch URL dengan browser headers dan BeautifulSoup
        try:
            r = await client.get(url, headers=DEFAULT_BROWSER_HEADERS)
            if r.status_code == 200:
                raw_parsed = _extract_content_from_html(r.text)
                head = raw_parsed[:3000].lower()
                if len(raw_parsed) >= 300 and not any(m in head for m in BLOCK_MARKERS):
                    return _slice_job_description(raw_parsed, max_chars)
        except Exception as e:
            print(f"[job_scraper] direct fetch error: {e}")

    raise JobFetchError(
        "situs memblokir akses otomatis (HTTP 403/Login Wall) atau konten tidak ditemukan"
    )
