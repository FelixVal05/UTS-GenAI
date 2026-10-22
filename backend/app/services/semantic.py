"""Semantic similarity via Hugging Face Inference API (embedding + cosine)."""
import numpy as np
from huggingface_hub import InferenceClient

from ..config import settings

PRIMARY_MODEL = "BAAI/bge-m3"
FALLBACK_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
MAX_CHARS = 2000

_client = InferenceClient(token=settings.hf_token) if settings.hf_token else None


def _embed(text: str, model: str) -> np.ndarray:
    out = np.asarray(_client.feature_extraction(text[:MAX_CHARS], model=model), dtype=float)
    if out.ndim > 1:  # token-level -> mean pooling
        out = out.reshape(-1, out.shape[-1]).mean(axis=0)
    return out


_hf_disabled_reason: str | None = None   # diisi jika HF menolak (mis. 402 kredit habis)
_local_model = None


def _embed_local(texts: list[str]) -> list[np.ndarray]:
    """Fallback lokal (ONNX, tanpa API) memakai model MiniLM multilingual yang sama."""
    global _local_model
    if _local_model is None:
        from fastembed import TextEmbedding

        _local_model = TextEmbedding(model_name=FALLBACK_MODEL)
    return [np.asarray(v, dtype=float) for v in _local_model.embed([t[:MAX_CHARS] for t in texts])]


def _embed_pair(a: str, b: str) -> tuple[np.ndarray, np.ndarray]:
    global _hf_disabled_reason
    if _client and not _hf_disabled_reason:
        for model in (PRIMARY_MODEL, FALLBACK_MODEL):
            try:
                return _embed(a, model), _embed(b, model)
            except Exception as e:
                msg = str(e)
                print(f"[semantic] HF {model} gagal: {msg.splitlines()[0][:160]}")
                if "402" in msg or "Payment Required" in msg or "401" in msg:
                    _hf_disabled_reason = msg.splitlines()[0][:120]
                    print("[semantic] HF dinonaktifkan sementara, pakai embedding lokal")
                    break
    va, vb = _embed_local([a, b])
    return va, vb


def compute_similarity(text_a: str, text_b: str) -> float | None:
    """Cosine similarity skala 0-100 (1 desimal). None jika gagal total.
    Urutan: HF API (bge-m3 -> MiniLM) -> embedding lokal fastembed (MiniLM)."""
    try:
        if not (text_a or "").strip() or not (text_b or "").strip():
            raise ValueError("teks kosong")
        va, vb = _embed_pair(text_a, text_b)
        denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
        if denom == 0:
            raise ValueError("vektor nol")
        cos = float(np.dot(va, vb) / denom)
        return round(max(0.0, min(1.0, cos)) * 100, 1)
    except Exception as e:
        print(f"[semantic] gagal: {e}")
        return None


EMOTION_MODEL = "superb/wav2vec2-base-superb-er"


_hf_audio_disabled = False
PROSODY_MODEL = "librosa-prosody"


def analyze_prosody(audio_bytes: bytes) -> dict | None:
    """Analisis prosodi akustik (librosa): variasi energi (RMS), rasio suara aktif,
    stabilitas pitch, dan spectral centroid -> label intonasi. Return None bila audio
    tidak bisa didekode / terlalu pendek."""
    try:
        import librosa

        from .audio import SR, decode_audio

        y = decode_audio(audio_bytes)
        if y is None or len(y) < SR * 0.5:
            return None
        hop = 512
        rms = librosa.feature.rms(y=y, hop_length=hop)[0]
        voiced = librosa.effects.split(y, top_db=30)
        active = sum(int(e - s) for s, e in voiced) / len(y)
        thr = max(float(np.max(rms)) * 0.1, 1e-4)
        mask = rms > thr
        rms_cv = float(np.std(rms[mask]) / (np.mean(rms[mask]) + 1e-9)) if mask.sum() > 3 else 0.0
        f0 = librosa.yin(y, fmin=65, fmax=400, sr=SR, hop_length=hop)
        n = min(len(f0), len(mask))
        f0v = f0[:n][mask[:n]]
        f0v = f0v[(f0v > 70) & (f0v < 390)]
        pitch_st = float(np.std(12 * np.log2(f0v / np.median(f0v)))) if len(f0v) > 5 else 0.0
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=SR, hop_length=hop)[0][mask]))
        # jumlah jeda internal (segmen suara terputus-putus)
        gaps = [(voiced[i + 1][0] - voiced[i][1]) / SR for i in range(len(voiced) - 1)]
        long_gaps = sum(1 for g in gaps if g >= 0.7)

        if active < 0.55 or long_gaps >= 3:
            label = "Terindikasi Gugup / Ragu-ragu (Fluktuasi Jeda Tinggi)"
        elif pitch_st > 3.5 and rms_cv > 0.6:
            label = "Antusias & Ekspresif (Dinamika Vokal Tinggi)"
        elif pitch_st < 2.0 and rms_cv < 0.5:
            label = "Tenang & Terkontrol"
        else:
            label = "Stabil & Percaya Diri (Intonasi Konsisten)"
        return {
            "label": label,
            "model": PROSODY_MODEL,
            "features": {
                "active_ratio": round(active, 2),
                "rms_variation": round(rms_cv, 2),
                "pitch_std_semitone": round(pitch_st, 2),
                "spectral_centroid_hz": round(centroid),
                "long_gaps": long_gaps,
            },
        }
    except Exception as e:
        print(f"[semantic] prosodi gagal: {type(e).__name__}: {e}")
        return None


def analyze_audio_emotion(audio_bytes: bytes) -> dict | None:
    """Indikator intonasi/nada suara. Coba HF wav2vec2 (audio_classification); bila gagal
    (402/404/tanpa provider) pakai analisis prosodi akustik librosa."""
    global _hf_audio_disabled
    if _client and not _hf_audio_disabled:
        try:
            res = _client.audio_classification(audio_bytes, model=EMOTION_MODEL)
            if res:
                top = max(res, key=lambda r: r.score)
                return {"label": top.label, "score": round(float(top.score), 3), "model": EMOTION_MODEL}
        except Exception as e:  # termasuk StopIteration (model tanpa provider)
            _hf_audio_disabled = True
            print(f"[semantic] HF wav2vec2 tidak tersedia ({type(e).__name__}), pakai prosodi librosa")
    return analyze_prosody(audio_bytes)


def warmup() -> None:
    """Pre-warm model embedding lokal agar request pertama langsung cepat."""
    try:
        _embed_local(["pemanasan model"])
        print("[semantic] fastembed siap")
    except Exception as e:
        print(f"[semantic] warmup gagal: {e}")
    try:  # kompilasi JIT librosa/numba (panggilan pertama ~3 detik)
        import io

        import soundfile as sf

        y = (0.1 * np.random.randn(16000)).astype("float32")
        buf = io.BytesIO()
        sf.write(buf, y, 16000, format="WAV")
        analyze_prosody(buf.getvalue())
        print("[semantic] prosodi librosa siap")
    except Exception as e:
        print(f"[semantic] warmup prosodi gagal: {e}")
