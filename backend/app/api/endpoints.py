from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models import ChatRequest
from app.services.pdf_extraction import process_and_store_pdf
from app.services.chat_generation import generate_chat_response
from app.core.database import supabase
import traceback

router = APIRouter()

@router.post("/api/engine/upload-pdf")
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

@router.post("/api/engine/chat")
async def chat_route(request: ChatRequest):
    try:
        return await generate_chat_response(request)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@router.post("/api/engine/agents")
async def create_agent_route(
    name: str = Form(...),
    description: str = Form(...),
    prompt: str = Form(...),
    user_id: str = Form(...),
    is_public: str = Form("false"),
    file: UploadFile = File(...)
):
    try:
        is_public_bool = is_public.lower() == "true"
        agent_data = {
            "name": name,
            "description": description,
            "prompt": prompt,
            "user_id": user_id,
            "is_public": is_public_bool,
            "status": "Active"
        }
        res = supabase.table("agents").insert(agent_data).execute()
        agent_id = res.data[0]["id"]
        
        await process_and_store_pdf(file, user_id, agent_id)
        
        return {"status": "success", "agent_id": agent_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")
