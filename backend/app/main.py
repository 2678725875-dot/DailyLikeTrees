"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import init_db
from .routers import sessions, trees, todos, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title="DailyLikeTrees API",
    description="Focus assistant backend — plant trees while you focus",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(sessions.router)
app.include_router(trees.router)
app.include_router(todos.router)
app.include_router(settings.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
