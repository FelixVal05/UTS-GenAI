import asyncio
import re

import edge_tts

VOICE_MAP = {
    # Persona Ramah (Sarah) -> Suara Wanita
    "ramah": {
        "id": "id-ID-GadisNeural",
        "en": "en-US-JennyNeural",
    },
    "sarah": {
        "id": "id-ID-GadisNeural",
        "en": "en-US-JennyNeural",
    },
    # Persona Netral (Jarvis) -> Suara Pria Profesional
    "netral": {
        "id": "id-ID-ArdiNeural",
        "en": "en-US-GuyNeural",
    },
    "jarvis": {
        "id": "id-ID-ArdiNeural",
        "en": "en-US-GuyNeural",
    },
    # Persona Tegas (Ultron) -> Suara Pria Berwibawa
    "tegas": {
        "id": "id-ID-ArdiNeural",
        "en": "en-US-GuyNeural",
    },
    "ultron": {
        "id": "id-ID-ArdiNeural",
        "en": "en-US-GuyNeural",
    },
}

VOICES = {
    "id": "id-ID-ArdiNeural",
    "en": "en-US-GuyNeural",
}


def get_voice(language: str = "id", persona: str = "netral") -> str:
    p = (persona or "netral").lower().strip()
    mapping = VOICE_MAP.get(p, VOICE_MAP["netral"])
    return mapping.get(language, mapping.get("id", "id-ID-ArdiNeural"))


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


def synthesize(text: str, language: str = "id", persona: str = "netral") -> bytes:
    """Return bytes mp3. Dipanggil dari endpoint sync (jalan di threadpool)."""
    voice = get_voice(language, persona)
    chunks = _chunks(_clean(text)) or [text]
    return asyncio.run(_synth_all(chunks, voice))
