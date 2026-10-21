from google import genai
from google.genai import types
from groq import Groq

from ..config import settings

GEMINI_MODEL = settings.gemini_model
GROQ_MODEL = settings.groq_model

_gemini = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
_groq = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None


def _call_gemini(system: str, messages: list[dict], temperature: float) -> str:
    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
    ]
    resp = _gemini.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system, temperature=temperature
        ),
    )
    return (resp.text or "").strip()


def _call_groq(system: str, messages: list[dict], temperature: float) -> str:
    msgs = [{"role": "system", "content": system}]
    for m in messages:
        msgs.append(
            {
                "role": "user" if m["role"] == "user" else "assistant",
                "content": m["content"],
            }
        )
    resp = _groq.chat.completions.create(
        model=GROQ_MODEL, messages=msgs, temperature=temperature
    )
    return (resp.choices[0].message.content or "").strip()


def chat(system: str, messages: list[dict], temperature: float = 0.7) -> tuple[str, str]:
    """
    messages: [{"role": "user"|"ai", "content": "..."}]
    return: (teks_balasan, provider)  -> provider = "gemini" | "groq"
    """
    errors = []
    if _gemini:
        try:
            text = _call_gemini(system, messages, temperature)
            if text:
                return text, "gemini"
            errors.append("gemini: respons kosong")
            print("[llm] gemini mengembalikan teks kosong")
        except Exception as e:
            errors.append(f"gemini: {e}")
            print(f"[llm] gemini gagal: {e}")
    if _groq:
        try:
            text = _call_groq(system, messages, temperature)
            if text:
                return text, "groq"
            errors.append("groq: respons kosong")
        except Exception as e:
            errors.append(f"groq: {e}")
            print(f"[llm] groq gagal: {e}")
    raise RuntimeError("Semua LLM gagal -> " + " | ".join(errors))
