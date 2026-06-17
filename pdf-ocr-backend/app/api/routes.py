from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models import ChatRequest
from app.services.document_processor import process_and_store_pdf
from app.services.rag_service import generate_chat_response
import traceback

router = APIRouter()

@router.post("/api/upload-pdf")
async def upload_pdf_route(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    session_id: str = Form(...)  
):
    try:
        return await process_and_store_pdf(file, user_id, session_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to process and embed PDF")

@router.post("/api/chat")
async def chat_route(request: ChatRequest):
    try:
        return await generate_chat_response(request)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
