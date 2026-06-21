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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)