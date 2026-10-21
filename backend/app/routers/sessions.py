import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import InterviewSession
from ..services.cv_parser import extract_cv_text
from ..services.job_scraper import fetch_job_text, JobFetchError

router = APIRouter(prefix="/sessions", tags=["sessions"])

VALID_PERSONAS = {"ramah", "netral", "tegas"}
VALID_LANGS = {"id", "en"}


@router.post("")
async def create_session(
    scenario: str = Form(...),
    persona: str = Form("netral"),
    language: str = Form("id"),
    github: str = Form(""),
    job_url: str = Form(""),
    job_text: str = Form(""),
    cv: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    if persona not in VALID_PERSONAS:
        raise HTTPException(400, f"persona harus salah satu dari {VALID_PERSONAS}")
    if language not in VALID_LANGS:
        raise HTTPException(400, f"language harus salah satu dari {VALID_LANGS}")

    cv_text = ""
    if cv is not None:
        if cv.content_type != "application/pdf":
            raise HTTPException(400, "CV harus berupa file PDF")
        data = await cv.read()
        if len(data) > 5 * 1024 * 1024:
            raise HTTPException(400, "Ukuran CV maksimal 5 MB")
        try:
            cv_text = extract_cv_text(data)
        except Exception:
            raise HTTPException(400, "PDF tidak bisa dibaca")
        if not cv_text:
            raise HTTPException(400, "PDF tidak berisi teks (mungkin hasil scan)")

    gh = github.strip().lstrip("@")
    gh = re.sub(r"^https?://(www\.)?github\.com/", "", gh, flags=re.I).strip("/")
    gh = gh.split("/")[0] if gh else ""
    if gh:
        if not re.fullmatch(r"[A-Za-z0-9-]{1,39}", gh):
            raise HTTPException(400, "Username GitHub tidak valid")
        cv_text += f"\n\nLINK DI CV:\nhttps://github.com/{gh}"

    job_text_final = job_text.strip()[:8000]
    job_url_final = job_url.strip()[:500]
    if len(job_text_final) < 50:   # isi bawaan/terlalu pendek dianggap kosong
        job_text_final = ""
    if not job_text_final and job_url_final:
        try:
            job_text_final = await fetch_job_text(job_url_final)
        except JobFetchError as e:
            raise HTTPException(
                422,
                f"Gagal membaca lowongan: {e}. Tempel teks deskripsi lowongan secara manual di kolom yang tersedia.",
            )

    session = InterviewSession(
        scenario=scenario, persona=persona, language=language, cv_text=cv_text,
        job_url=job_url_final, job_text=job_text_final,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "scenario": session.scenario,
        "persona": session.persona,
        "language": session.language,
        "cv_chars": len(cv_text),
        "job_chars": len(job_text_final),
        "status": session.status,
    }


@router.get("/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    s = db.get(InterviewSession, session_id.strip())
    if not s:
        raise HTTPException(404, "Sesi tidak ditemukan")
    return {
        "id": s.id,
        "scenario": s.scenario,
        "persona": s.persona,
        "language": s.language,
        "status": s.status,
        "plan": s.plan,
        "report": s.report,
        "turns": [
            {"role": t.role, "text": t.text, "metrics": t.metrics} for t in s.turns
        ],
    }


@router.get("")
def list_sessions(db: Session = Depends(get_db)):
    rows = (
        db.query(InterviewSession)
        .order_by(InterviewSession.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "scenario": r.scenario,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
