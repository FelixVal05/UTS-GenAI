from groq import Groq

from ..config import settings

_groq = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None

WHISPER_MODEL = settings.groq_stt_model


def transcribe(audio_bytes: bytes, filename: str, language: str = "id", prompt: str | None = None) -> dict:
    """
    return: {"text": str, "duration": float|None, "words": list}
    words dipakai di Bagian 4 buat hitung WPM & jeda hening.
    """
    if _groq is None:
        raise RuntimeError("GROQ_API_KEY belum diisi")

    result = _groq.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model=WHISPER_MODEL,
        language=language,
        response_format="verbose_json",
        timestamp_granularities=["word"],
        temperature=0.0,
        prompt=prompt,
    )
    words = getattr(result, "words", None) or []
    return {
        "text": (result.text or "").strip(),
        "duration": getattr(result, "duration", None),
        "words": [
            {
                "word": w["word"] if isinstance(w, dict) else w.word,
                "start": w["start"] if isinstance(w, dict) else w.start,
                "end": w["end"] if isinstance(w, dict) else w.end,
            }
            for w in words
        ],
    }
