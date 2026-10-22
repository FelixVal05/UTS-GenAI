import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routers import sessions, interview
from .services import semantic

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Simulacra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _prewarm():
    # Muat model fastembed di background supaya server langsung siap menerima request
    threading.Thread(target=semantic.warmup, daemon=True).start()


app.include_router(sessions.router)
app.include_router(interview.router)


@app.get("/health")
def health():
    return {"status": "ok"}
