import base64
import re
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import InterviewSession, Turn
from ..services import llm, stt, tts, planner, evaluator
from ..services import metrics as audio_metrics
from ..services.interviewer import MAX_QUESTIONS, build_system_prompt

router = APIRouter(prefix="/sessions", tags=["interview"])

KICKOFF = "(Sesi dimulai. Silakan mulai wawancara dengan sapaan singkat dan pertanyaan pertama.)"


def _get_session(db: Session, session_id: str) -> InterviewSession:
    session_id = session_id.strip()
    s = db.get(InterviewSession, session_id)
    if not s:
        raise HTTPException(404, "Sesi tidak ditemukan")
    return s


def _history(s: InterviewSession) -> list[dict]:
    msgs = [{"role": "user", "content": KICKOFF}]
    for t in s.turns:
        msgs.append({"role": t.role, "content": t.text})
    return msgs


def _ai_reply(db: Session, s: InterviewSession) -> tuple[Turn, str]:
    ai_done = sum(1 for t in s.turns if t.role == "ai")
    system = build_system_prompt(s, ai_done)
    text, provider = llm.chat(system, _history(s))
    turn = Turn(session_id=s.id, role="ai", text=text)
    db.add(turn)
    if ai_done + 1 > MAX_QUESTIONS:
        s.status = "finished"
    db.commit()
    db.refresh(s)
    return turn, provider


def _stt_hint(s: InterviewSession) -> str:
    """Kata-kata khusus dari CV supaya Whisper tidak salah tulis istilah/singkatan."""
    terms = []
    for w in re.findall(r"\b[A-Z][A-Za-z0-9+#.]{2,}\b", s.cv_text or ""):
        if w not in terms:
            terms.append(w)
    return f"Wawancara {s.scenario}. Istilah: " + ", ".join(terms[:30])


def _pack_audio(text: str, language: str, include: bool) -> str | None:
    if not include:
        return None
    try:
        return base64.b64encode(tts.synthesize(text, language)).decode()
    except Exception:
        return None  # TTS gagal -> frontend bisa fallback ke teks / speechSynthesis


@router.post("/{session_id}/plan")
def make_plan(session_id: str, db: Session = Depends(get_db)):
    """Jalankan Planner Agent + GitHub fact-checker (bisa dites terpisah)."""
    s = _get_session(db, session_id)
    if s.turns:
        raise HTTPException(400, "Sesi sudah dimulai")
    s.plan = planner.build_plan(s)
    db.commit()
    return s.plan


@router.post("/{session_id}/start")
def start_interview(
    session_id: str,
    audio: bool = Query(True, description="False = skip TTS (buat tes di Swagger)"),
    db: Session = Depends(get_db),
):
    s = _get_session(db, session_id)
    if s.turns:
        raise HTTPException(400, "Sesi sudah dimulai")
    if s.plan is None:                      # belum ada rencana -> bikin dulu
        s.plan = planner.build_plan(s)
        db.commit()
    s.status = "active"
    try:
        turn, provider = _ai_reply(db, s)
    except RuntimeError as e:
        raise HTTPException(502, str(e))
    return {
        "ai_text": turn.text,
        "ai_audio_b64": _pack_audio(turn.text, s.language, audio),
        "llm_provider": provider,
        "finished": s.status == "finished",
    }


@router.post("/{session_id}/turn")
def user_turn(
    session_id: str,
    file: UploadFile = File(..., description="Rekaman suara user (webm/mp3/m4a/wav)"),
    audio: bool = Query(True),
    db: Session = Depends(get_db),
):
    s = _get_session(db, session_id)
    if s.status == "finished":
        raise HTTPException(400, "Sesi sudah selesai")
    if not s.turns:
        raise HTTPException(400, "Panggil /start dulu")

    data = file.file.read()
    if not data:
        raise HTTPException(400, "File audio kosong")
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(400, "Audio maksimal 25 MB")

    filename = file.filename or "audio.webm"
    if not Path(filename).suffix:
        filename += ".webm"

    # 1) STT
    try:
        tr = stt.transcribe(data, filename, s.language, prompt=_stt_hint(s))
    except Exception as e:
        raise HTTPException(502, f"STT gagal: {e}")
    if not tr["text"]:
        raise HTTPException(422, "Suara tidak terdeteksi, coba ulangi")

    db.add(
        Turn(
            session_id=s.id,
            role="user",
            text=tr["text"],
            audio_seconds=tr["duration"],
            metrics={"words": tr["words"]},  # dipakai metrik penyampaian
        )
    )
    db.commit()
    db.refresh(s)

    # 2) LLM + 3) TTS
    try:
        turn, provider = _ai_reply(db, s)
    except RuntimeError as e:
        raise HTTPException(502, str(e))

    return {
        "user_text": tr["text"],
        "ai_text": turn.text,
        "ai_audio_b64": _pack_audio(turn.text, s.language, audio),
        "llm_provider": provider,
        "finished": s.status == "finished",
    }


@router.post("/{session_id}/finish")
def finish_interview(
    session_id: str,
    refresh: bool = Query(False, description="True = hitung ulang laporan"),
    db: Session = Depends(get_db),
):
    s = _get_session(db, session_id)
    user_turns = [t for t in s.turns if t.role == "user"]
    if not user_turns:
        raise HTTPException(400, "Belum ada jawaban kandidat")
    if s.report and not refresh:
        return s.report

    delivery = audio_metrics.summarize(user_turns)
    try:
        report = evaluator.evaluate(s, delivery)
    except Exception as e:
        raise HTTPException(502, f"Evaluator gagal: {e}")

    s.report = report
    s.status = "finished"
    db.commit()
    return report
