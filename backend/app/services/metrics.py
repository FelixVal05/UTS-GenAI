import re

PAUSE_S = 0.7        # jeda >= 0.7 detik dihitung sebagai jeda
LONG_PAUSE_S = 2.0   # jeda panjang
# Daftar sengaja konservatif. Whisper sering membuang "eh/um", jadi angka ini batas bawah.
FILLERS = {"eh", "ehm", "em", "emm", "hmm", "mmm", "mm", "anu", "uh", "um", "uhm",
           "kayak", "kayaknya"}


def _norm(w: str) -> str:
    return re.sub(r"[^\w]", "", (w or "").lower())


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
