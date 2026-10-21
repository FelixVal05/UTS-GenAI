import pymupdf


def extract_cv_text(pdf_bytes: bytes, max_chars: int = 12000) -> str:
    """Ekstrak teks + URL link dari PDF CV."""
    parts, links = [], []
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            parts.append(page.get_text())
            for lk in page.get_links():
                uri = lk.get("uri")
                if uri and uri not in links:
                    links.append(uri)
    text = "\n".join(parts).strip()
    if not text:
        return ""
    text = text[:max_chars]
    if links:
        text += "\n\nLINK DI CV:\n" + "\n".join(links)
    return text
