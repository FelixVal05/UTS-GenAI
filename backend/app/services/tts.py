import asyncio

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


def synthesize(text: str, language: str = "id") -> bytes:
    """Return bytes mp3. Dipanggil dari endpoint sync (jalan di threadpool)."""
    return asyncio.run(_synth(text, VOICES.get(language, VOICES["id"])))
