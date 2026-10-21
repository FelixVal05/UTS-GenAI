import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def new_id() -> str:
    return uuid.uuid4().hex


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    scenario: Mapped[str] = mapped_column(String(200))
    persona: Mapped[str] = mapped_column(String(20), default="netral")  # ramah | netral | tegas
    language: Mapped[str] = mapped_column(String(5), default="id")      # id | en
    cv_text: Mapped[str] = mapped_column(Text, default="")
    job_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    job_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)      # diisi Planner Agent
    report: Mapped[dict | None] = mapped_column(JSON, nullable=True)    # diisi Evaluator Agent
    status: Mapped[str] = mapped_column(String(20), default="created")  # created | active | finished
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    turns: Mapped[list["Turn"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="Turn.id"
    )


class Turn(Base):
    __tablename__ = "turns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("interview_sessions.id"))
    role: Mapped[str] = mapped_column(String(10))  # user | ai
    text: Mapped[str] = mapped_column(Text)
    audio_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # WPM, jeda, emosi
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[InterviewSession] = relationship(back_populates="turns")
