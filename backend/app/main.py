from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routers import sessions, interview

Base.metadata.create_all(bind=engine)

app = FastAPI(title="InterviewPro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(interview.router)


@app.get("/health")
def health():
    return {"status": "ok"}
