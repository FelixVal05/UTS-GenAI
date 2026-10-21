import httpx
from urllib.parse import urlparse

from ..config import settings

JINA = "https://r.jina.ai/"
BLOCK_MARKERS = (
    "authwall", "captcha", "just a moment", "access denied", "enable javascript",
    "sign in to continue", "join linkedin", "verify you are human", "cloudflare",
)


class JobFetchError(Exception):
    pass


async def fetch_job_text(url: str, max_chars: int = 8000) -> str:
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise JobFetchError("URL harus diawali http:// atau https://")

    headers = {"Accept": "text/plain"}
    if settings.jina_api_key:
        headers["Authorization"] = f"Bearer {settings.jina_api_key}"

    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            r = await client.get(JINA + url, headers=headers)
    except httpx.HTTPError as e:
        raise JobFetchError(f"gagal menghubungi layanan pembaca halaman ({e})")

    if r.status_code != 200:
        raise JobFetchError(f"halaman tidak bisa dibaca (HTTP {r.status_code})")

    text = r.text.strip()
    head = text[:3000].lower()
    if len(text) < 300 or any(m in head for m in BLOCK_MARKERS):
        raise JobFetchError("situs kemungkinan memblokir akses otomatis atau butuh login")
    return text[:max_chars]
