import asyncio
import re

import edge_tts

VOICES = {
    "id": "id-ID-ArdiNeural",   # cowok; alternatif: id-ID-GadisNeural
    "en": "en-US-GuyNeural",
}


async def _synth(text: str, voice: str) -> bytes:
    communicate = edge_tts.Communicate(text, voice)
    buf = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.extend(chunk["data"])
    return bytes(buf)


def _clean(text: str) -> str:
    """Buang markdown/emoji/simbol yang tidak perlu dibacakan."""
    text = re.sub(r"[*_`#>~|]+", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[^\w\s.,!?;:'\"()%/+#&@-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _chunks(text: str, max_len: int = 60) -> list[str]:
    """Pecah per kalimat (digabung sampai ~max_len) supaya bisa disintesis paralel."""
    parts = re.split(r"(?<=[.!?,;:])\s+", text)
    out, cur = [], ""
    for p in parts:
        if cur and len(cur) + len(p) + 1 > max_len:
            out.append(cur)
            cur = p
        else:
            cur = f"{cur} {p}".strip()
    if cur:
        out.append(cur)
    return out


async def _synth_all(chunks: list[str], voice: str) -> bytes:
    # edge-tts mengalirkan audio mendekati kecepatan bicara, jadi latensi ~ panjang teks.
    # Memecah per kalimat dan menjalankan paralel memangkas waktu tunggu total.
    results = await asyncio.gather(*(_synth(c, voice) for c in chunks))
    return b"".join(results)


def synthesize(text: str, language: str = "id") -> bytes:
    """Return bytes mp3. Dipanggil dari endpoint sync (jalan di threadpool)."""
    voice = VOICES.get(language, VOICES["id"])
    chunks = _chunks(_clean(text)) or [text]
    return asyncio.run(_synth_all(chunks, voice))
