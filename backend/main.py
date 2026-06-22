from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from contextlib import asynccontextmanager
import logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.vector_store import init_collections
    try:
        init_collections()
        logging.info("Qdrant collections initialized successfully.")
    except Exception as e:
        logging.error(f"Failed to connect to Qdrant during startup: {e}")
        logging.error("Ensure Qdrant is running (e.g., via docker compose up -d qdrant).")
    yield

app = FastAPI(title="Cyber Core OCR Backend", lifespan=lifespan)

from app.config import ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)