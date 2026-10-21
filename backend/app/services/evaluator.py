import json

from . import llm
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
- Metode STAR: Situation, Task, Action, Result. Beri true hanya jika elemen itu benar-benar muncul.
- Jika jawaban kandidat tidak nyambung dengan pertanyaan, skor relevansi rendah dan katakan apa adanya.
- Jika jawaban sangat sedikit (kurang dari 2), sebutkan bahwa penilaian terbatas.
- ketepatan_teknis: seberapa tepat jawaban teknis kandidat terhadap syarat wajib lowongan. Isi null jika tidak ada data lowongan.
- Jangan menilai emosi atau kepribadian. Data audio hanya konteks tambahan untuk saran penyampaian.
- Jangan menyimpulkan kata pengisi atau jeda dari transkrip; transkrip tidak memuatnya. Gunakan hanya DATA PENYAMPAIAN AUDIO.
- Tulis dalam bahasa yang sama dengan sesi. Bersikap jujur, spesifik, dan membangun."""


def _transcript(session) -> str:
    lines = []
    for t in session.turns:
        who = "PEWAWANCARA" if t.role == "ai" else "KANDIDAT"
        lines.append(f"{who}: {t.text}")
    return "\n".join(lines)


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
    report["evaluator_llm"] = provider
    return report
