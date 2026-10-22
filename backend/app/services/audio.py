"""Helper decoding audio (webm/m4a/wav) ke array mono 16 kHz di memori."""
import io
import shutil
import subprocess

import numpy as np

SR = 16000


def decode_audio(audio_bytes: bytes) -> np.ndarray | None:
    """Decode ke float32 mono 16 kHz. Coba soundfile dulu (wav/flac/ogg), lalu ffmpeg
    (webm/opus, m4a, dll). Return None jika keduanya gagal."""
    if not audio_bytes:
        return None
    try:
        import librosa
        import soundfile as sf

        y, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
        if getattr(y, "ndim", 1) > 1:
            y = y.mean(axis=1)
        if sr != SR:
            y = librosa.resample(y, orig_sr=sr, target_sr=SR)
        return y.astype("float32")
    except Exception:
        pass

    if not shutil.which("ffmpeg"):
        print("[audio] ffmpeg tidak ditemukan, audio tidak bisa didekode")
        return None
    try:
        # WAV 16 kHz mono ke pipe, lalu dibaca dari memori
        p = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", "pipe:0", "-f", "wav", "-ac", "1", "-ar", str(SR), "pipe:1"],
            input=audio_bytes, capture_output=True, timeout=20,
        )
        if p.returncode != 0 or not p.stdout:
            print(f"[audio] ffmpeg gagal: {p.stderr.decode(errors='ignore')[:150]}")
            return None
        import soundfile as sf

        y, _ = sf.read(io.BytesIO(p.stdout), dtype="float32", always_2d=False)
        return y if len(y) else None
    except Exception as e:
        print(f"[audio] decode gagal: {e}")
        return None
