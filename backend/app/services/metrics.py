import re

PAUSE_S = 0.7        # jeda >= 0.7 detik dihitung sebagai jeda
LONG_PAUSE_S = 2.0   # jeda panjang
# Daftar sengaja konservatif. Whisper sering membuang "eh/um", jadi angka ini batas bawah.
FILLERS = {"eh", "ehm", "em", "emm", "hmm", "mmm", "mm", "anu", "uh", "um", "uhm",
           "kayak", "kayaknya"}


def _norm(w: str) -> str:
    return re.sub(r"[^\w]", "", (w or "").lower())


def acoustic_silence_ratio(audio_bytes: bytes, top_db: float = 30.0) -> float | None:
    """
    Rasio hening fisik (0-1) memakai librosa.effects.split.
    Return None jika audio tidak bisa didekode (soundfile maupun ffmpeg gagal),
    sehingga pemanggil fallback ke timestamp kata Whisper (pause_pct).
    """
    try:
        import librosa

        from .audio import decode_audio

        y = decode_audio(audio_bytes)  # webm/m4a -> WAV 16 kHz mono via ffmpeg bila perlu
        if y is None or len(y) == 0:
            return None
        voiced = librosa.effects.split(y, top_db=top_db)
        voiced_len = sum(int(e - s) for s, e in voiced)
        return round(1 - voiced_len / len(y), 3)
    except Exception as e:
        print(f"[metrics] acoustic_silence_ratio dilewati: {e}")
        return None


def turn_metrics(words: list[dict]) -> dict | None:
    clean = [
        {"w": _norm(x["word"]), "start": x["start"], "end": x["end"]}
        for x in words
        if _norm(x.get("word", ""))
    ]
    if not clean:
        return None
    start, end = clean[0]["start"], clean[-1]["end"]
    window = max(end - start, 0.001)
    gaps = [clean[i + 1]["start"] - clean[i]["end"] for i in range(len(clean) - 1)]
    pauses = [g for g in gaps if g >= PAUSE_S]
    return {
        "words": len(clean),
        "speaking_seconds": round(window, 1),
        "wpm": round(len(clean) / (window / 60)) if len(clean) >= 5 else None,
        "start_delay": round(start, 1),  # jeda sebelum mulai bicara
        "pause_count": len(pauses),
        "long_pause_count": sum(1 for g in pauses if g >= LONG_PAUSE_S),
        "pause_seconds": round(sum(pauses), 1),
        "longest_pause": round(max(pauses), 1) if pauses else 0,
        "fillers": sum(1 for c in clean if c["w"] in FILLERS),
    }


def summarize(user_turns) -> dict:
    per_turn = []
    for i, t in enumerate(user_turns, 1):
        m = turn_metrics((t.metrics or {}).get("words", []))
        if m:
            per_turn.append({"turn": i, **m})

    if not per_turn:
        return {"per_turn": [], "overall": None, "flags": ["Data audio tidak tersedia"]}

    words = sum(m["words"] for m in per_turn)
    secs = sum(m["speaking_seconds"] for m in per_turn)
    pause_s = sum(m["pause_seconds"] for m in per_turn)
    overall = {
        "total_words": words,
        "speaking_seconds": round(secs, 1),
        "wpm": round(words / (secs / 60)) if secs > 0 and words >= 5 else None,
        "pause_pct": round(100 * pause_s / secs) if secs > 0 else 0,
        "long_pause_count": sum(m["long_pause_count"] for m in per_turn),
        "longest_pause": max(m["longest_pause"] for m in per_turn),
        "avg_start_delay": round(sum(m["start_delay"] for m in per_turn) / len(per_turn), 1),
        "fillers": sum(m["fillers"] for m in per_turn),
    }

    # Rasio hening akustik (librosa) bila tersedia; jika tidak, fallback ke pause_pct (Whisper)
    ratios = [
        (t.metrics or {}).get("acoustic_silence_ratio") for t in user_turns
    ]
    ratios = [r for r in ratios if r is not None]
    if ratios:
        overall["acoustic_silence_ratio"] = round(sum(ratios) / len(ratios), 3)
        overall["silence_source"] = "librosa"
    else:
        overall["acoustic_silence_ratio"] = round(overall["pause_pct"] / 100, 3)
        overall["silence_source"] = "whisper_timestamps"

    tones = [
        (t.metrics or {}).get("voice_tone") for t in user_turns
    ]
    tones = [x for x in tones if x]
    if tones:
        labels = [x["label"] for x in tones if x.get("label")]
        if labels:
            top = max(set(labels), key=labels.count)
            overall["voice_tone_indicator"] = {
                "label": top,
                "turn_labels": labels,
                "model": tones[0].get("model"),
                "experimental": True,
            }

    # Aturan sederhana (heuristik kasar, bukan standar baku)
    flags = []
    wpm = overall["wpm"]
    if wpm is not None:
        if wpm > 170:
            flags.append(f"Bicara cukup cepat ({wpm} kata/menit); coba lebih pelan dan beri jeda.")
        elif wpm < 100:
            flags.append(f"Tempo bicara agak lambat ({wpm} kata/menit).")
        else:
            flags.append(f"Tempo bicara wajar ({wpm} kata/menit).")
    if overall["long_pause_count"] >= 3:
        flags.append(f"Ada {overall['long_pause_count']} jeda panjang (>2 detik) saat menjawab.")
    if overall["avg_start_delay"] > 3:
        flags.append("Rata-rata butuh >3 detik sebelum mulai menjawab.")
    if overall["fillers"] >= 5:
        flags.append(f"Terdeteksi {overall['fillers']} kata pengisi (eh/anu/kayak).")
    return {"per_turn": per_turn, "overall": overall, "flags": flags}
