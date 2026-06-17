import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pdf2image import convert_from_bytes
import pytesseract
from supabase import create_client, Client
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings, ChatOllama
from dotenv import load_dotenv

# Import Qdrant
from qdrant_client import QdrantClient, models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv(".env.local")

# ==========================================
# 1. INITIALIZE SUPABASE
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 2. INITIALIZE QDRANT
# ==========================================
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

collection_names = ["document_chunks", "document_summaries"]
for name in collection_names:
    if not qdrant.collection_exists(name):
        qdrant.create_collection(
            collection_name=name,
            vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE)
        )
        print(f"Created Qdrant Collection: {name}")

# ==========================================
# 3. INITIALIZE AI MODELS
# ==========================================
embeddings_model = OllamaEmbeddings(model="nomic-embed-text", base_url="http://127.0.0.1:11434")
chat_model = ChatOllama(model="qwen2.5-coder:7b", base_url="http://127.0.0.1:11434", temperature=0.4) # Slightly increased temperature for more natural flow
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)

# ==========================================
# DATA MODELS
# ==========================================
class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    filename: str | None = None  

# ==========================================
# ENDPOINT 1: DOCUMENT INGESTION
# ==========================================
@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(...) 
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # 1. OCR Extraction
        pdf_bytes = await file.read()
        images = convert_from_bytes(pdf_bytes)
        
        full_text = ""
        for image in images:
            full_text += pytesseract.image_to_string(image) + "\n"

        # 2. GENERATE MARKDOWN SUMMARY
        print(f"Asking Qwen to generate Markdown for {file.filename}...")
        prompt = f"""You are a master data analyst. Read the following document text and extract all the detailed and key information. 
        Format your response strictly as a comprehensive Markdown (.md) document. Include headers, bullet points, and key metrics.
        
        DOCUMENT TEXT:
        {full_text[:25000]}"""
        
        summary_response = chat_model.invoke(prompt)
        markdown_content = summary_response.content

        # 3. Save Summary to Qdrant
        summary_vector = embeddings_model.embed_query(markdown_content)
        qdrant.upsert(
            collection_name="document_summaries",
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=summary_vector,
                    payload={
                        "user_id": user_id,
                        "filename": file.filename,
                        "markdown_content": markdown_content
                    }
                )
            ]
        )

        # 4. Standard Vector Chunking
        chunks = text_splitter.split_text(full_text)
        points = []
        for chunk in chunks:
            vector = embeddings_model.embed_query(chunk)
            points.append(
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "user_id": user_id,
                        "filename": file.filename,
                        "content": chunk
                    }
                )
            )
            
        qdrant.upsert(collection_name="document_chunks", points=points)

        return {
            "filename": file.filename,
            "status": "success",
            "chunks_stored": len(points),
            "markdown_generated": True
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to process and embed PDF")

# ==========================================
# ENDPOINT 2: RAG CHAT WITH MEMORY
# ==========================================
@app.post("/api/chat")
async def chat_with_memory(request: ChatRequest):
    try:
        # 1. FETCH EPISODIC MEMORY FROM SUPABASE
        history_response = supabase.table("messages") \
            .select("role, content") \
            .eq("chat_id", request.session_id) \
            .order("created_at", desc=False) \
            .limit(6) \
            .execute()
        
        chat_history = history_response.data
        formatted_history = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in chat_history]) if chat_history else "No previous conversation."

        # 2. QUERY REFORMULATION
        standalone_query = request.message
        if chat_history:
            reformulation_prompt = f"""Given the following conversation history and the user's new question, rephrase the question to be a standalone query that contains all necessary context. Do not answer the question, just reformulate it.
            
            Chat History:
            {formatted_history}
            
            New Question: {request.message}
            Standalone Question:"""
            
            reformulation_response = chat_model.invoke(reformulation_prompt)
            standalone_query = reformulation_response.content.strip()

        # 3. SEMANTIC SEARCH WITH QDRANT
        query_vector = embeddings_model.embed_query(standalone_query)

        search_result = qdrant.query_points(
            collection_name="document_chunks",
            query=query_vector,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_id",
                        match=models.MatchValue(value=request.user_id)
                    )
                ]
            ),
            limit=4,
            score_threshold=0.4
        )

        context_texts = [hit.payload['content'] for hit in search_result.points]
        retrieved_context = "\n\n---\n\n".join(context_texts) if context_texts else ""

        # 4. FETCH DOCUMENT SUMMARY FROM QDRANT
        document_summary = ""
        if request.filename:
            scroll_res, _ = qdrant.scroll(
                collection_name="document_summaries",
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(key="user_id", match=models.MatchValue(value=request.user_id)),
                        models.FieldCondition(key="filename", match=models.MatchValue(value=request.filename))
                    ]
                ),
                limit=1
            )
            
            if scroll_res:
                summary_text = scroll_res[0].payload.get("markdown_content", "")
                document_summary = f"--- Document Summary for {request.filename} ---\n{summary_text}\n\n"

        final_context = document_summary + "--- Specific Document Chunks ---\n" + (retrieved_context if retrieved_context else "No specific chunks matched.")

        # 5. NEW: HUMAN-CENTRIC FINAL PROMPT WITH SUGGESTED QUESTIONS
        final_prompt = f"""You are an intuitive, engaging, and articulate AI assistant. Your goal is to answer the user's question by seamlessly weaving together information from the retrieved context. 

        CRITICAL GUIDELINES FOR YOUR RESPONSE:
        - Talk like a human expert. Do not copy-paste or regurgitate chunks verbatim. Synthesize facts into a smooth, natural flow.
        - Structure your response cleanly using markdown (bolding, clear lists, short paragraphs) to make it highly readable.
        - If the retrieved context doesn't contain the answer, gracefully let the user know without guessing.
        - Keep the conversational history in mind to stay contextually relevant.

        COMPLETION REQUIREMENT:
        At the absolute end of your response, leave two line breaks and create a section titled "### Suggested Questions". 
        Under this header, provide 2 to 3 concise, highly relevant follow-up questions that the user might want to ask next based on this document and your current answer. Use standard bullet points.

        Retrieved Document Context:
        {final_context}

        Conversation History:
        {formatted_history}

        User Question: {request.message}
        Answer:"""

        final_response = chat_model.invoke(final_prompt)
        ai_answer = final_response.content

        # 6. SAVE TO EPISODIC MEMORY (SUPABASE)
        supabase.table("messages").insert({
            "chat_id": request.session_id,
            "role": "user",
            "content": request.message
        }).execute()

        supabase.table("messages").insert({
            "chat_id": request.session_id,
            "role": "assistant",
            "content": ai_answer
        }).execute()

        return {
            "status": "success",
            "answer": ai_answer,
            "retrieved_documents": len(context_texts)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)