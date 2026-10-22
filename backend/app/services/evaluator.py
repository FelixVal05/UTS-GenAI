import json

from . import llm, semantic
from .planner import _parse_json

SYSTEM = """Kamu adalah Evaluator Agent untuk simulasi wawancara. Nilai kandidat HANYA berdasarkan
transkrip yang diberikan. Jangan mengarang jawaban yang tidak ada di transkrip.

OUTPUT: HANYA JSON valid (tanpa markdown) dengan skema:
{
  "overall_score": 0-100,
  "scores": {
    "relevansi": 0-10,
    "struktur_star": 0-10,
    "kejelasan": 0-10,
    "kedalaman": 0-10,
    "ketepatan_teknis": 0-10 atau null jika tidak ada data lowongan
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "per_answer": [
    {"question": "pertanyaan pewawancara (ringkas)",
     "answer_summary": "ringkasan jawaban kandidat",
     "star": {"situation": true|false, "task": true|false, "action": true|false, "result": true|false},
     "feedback": "apa yang kurang / sudah bagus",
     "better_answer": "contoh kalimat jawaban yang lebih baik, memakai fakta dari CV/transkrip, jangan mengarang fakta baru"}
  ],
  "recommendations": ["saran latihan konkret"]
}

ATURAN:
- Nilai HANYA pertanyaan yang sudah dijawab oleh kandidat pada transkrip. Jangan menghukum kandidat atas pertanyaan yang tidak sempat dijawab karena sesi diakhiri.
- Metode STAR: Situation, Task, Action, Result. Beri true hanya jika elemen itu benar-benar muncul.
- Jika jawaban kandidat tidak nyambung dengan pertanyaan, skor relevansi rendah dan katakan apa adanya.
- Jika jawaban sangat sedikit (kurang dari 2), sebutkan bahwa penilaian terbatas.
- ketepatan_teknis: seberapa tepat jawaban teknis kandidat terhadap syarat wajib lowongan. Isi null jika tidak ada data lowongan.
- Jangan menilai emosi atau kepribadian. Data audio hanya konteks tambahan untuk saran penyampaian.
- Jangan menyimpulkan kata pengisi atau jeda dari transkrip; transkrip tidak memuatnya. Gunakan hanya DATA PENYAMPAIAN AUDIO.
- Tulis dalam bahasa yang sama dengan sesi. Bersikap jujur, spesifik, dan membangun."""


def _evaluated_turns(session) -> list:
    """Ambil turns tetapi abaikan turn AI terakhir jika belum ada jawaban user sesudahnya."""
    turns = list(session.turns or [])
    while turns and turns[-1].role == "ai":
        turns.pop()
    return turns


def _transcript(session) -> str:
    lines = []
    turns = _evaluated_turns(session)
    for t in turns:
        who = "PEWAWANCARA" if t.role == "ai" else "KANDIDAT"
        lines.append(f"{who}: {t.text}")
    return "\n".join(lines)


def _job_context(job) -> str:
    if not job or job.get("error"):
        return ""
    parts = (job.get("must_have") or []) + (job.get("tech_stack") or [])
    return "Syarat lowongan: " + "; ".join(str(p) for p in parts) if parts else ""


def _semantic_relevance(session, job) -> float | None:
    """Rata-rata kemiripan semantik tiap jawaban user vs (pertanyaan + syarat lowongan)."""
    ctx_job = _job_context(job)
    scores = []
    last_q = ""
    turns = _evaluated_turns(session)
    for t in turns:
        if t.role == "ai":
            last_q = t.text
        elif t.role == "user" and (t.text or "").strip():
            s = semantic.compute_similarity(t.text, f"{last_q}\n{ctx_job}".strip())
            if s is not None:
                scores.append(s)
    return round(sum(scores) / len(scores), 1) if scores else None


def evaluate(session, delivery: dict) -> dict:
    cv = (session.cv_text or "").strip()[:4000] or "(tidak ada CV)"
    job = (session.plan or {}).get("job")
    job_txt = (
        json.dumps(job, ensure_ascii=False)[:2500]
        if job and not job.get("error")
        else "(tidak ada data lowongan)"
    )
    user_msg = f"""SKENARIO: {session.scenario}
BAHASA SESI: {"Indonesia" if session.language == "id" else "English"}

LOWONGAN YANG DITUJU (JSON):
{job_txt}

CV KANDIDAT (ringkas):
{cv}

TRANSKRIP:
{_transcript(session)}

DATA PENYAMPAIAN AUDIO (hasil hitung otomatis):
{json.dumps(delivery.get("overall"), ensure_ascii=False)}
"""
    text, provider = llm.chat(
        SYSTEM, [{"role": "user", "content": user_msg}], temperature=0.2
    )
    report = _parse_json(text)
    report["delivery"] = delivery
    tone = (delivery.get("overall") or {}).get("voice_tone_indicator")
    if tone:
        delivery["voice_tone_indicator"] = tone
    report["semantic_relevance_score"] = _semantic_relevance(session, job)
    report["evaluator_llm"] = provider
    return report
