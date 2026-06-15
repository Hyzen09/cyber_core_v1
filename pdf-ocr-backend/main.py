import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pdf2image import convert_from_bytes
import pytesseract
from supabase import create_client, Client
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings, ChatOllama

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Initialize Local Models
embeddings_model = OllamaEmbeddings(model="nomic-embed-text", base_url="http://127.0.0.1:11434")

# Initialize Qwen to act as the Markdown Analyst and Chat Assistant
chat_model = ChatOllama(model="qwen2.5-coder:7b", base_url="http://127.0.0.1:11434", temperature=0.2)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)

# ==========================================
# DATA MODELS
# ==========================================

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    filename: str | None = None  # Added to track which document the user is chatting about

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

        # 2. GENERATE MARKDOWN SUMMARY WITH QWEN
        print(f"Asking Qwen to generate Markdown for {file.filename}...")
        # We limit to the first 25,000 characters to prevent overloading the context window
        prompt = f"""You are a master data analyst. Read the following document text and extract all the detailed and key information. 
        Format your response strictly as a comprehensive Markdown (.md) document. Include headers, bullet points, and key metrics.
        
        DOCUMENT TEXT:
        {full_text[:25000]}"""
        
        summary_response = chat_model.invoke(prompt)
        markdown_content = summary_response.content

        # 3. Save the Markdown File to Supabase
        supabase.table("document_summaries").insert({
            "user_id": user_id,
            "filename": file.filename,
            "markdown_content": markdown_content
        }).execute()
        print("Markdown saved to database!")

        # 4. Standard Vector Chunking (Kept for hybrid search later if needed)
        chunks = text_splitter.split_text(full_text)
        records_inserted = 0
        for chunk in chunks:
            vector = embeddings_model.embed_query(chunk)
            supabase.table("document_chunks").insert({
                "user_id": user_id,
                "filename": file.filename,
                "content": chunk,
                "embedding": vector
            }).execute()
            records_inserted += 1

        return {
            "filename": file.filename,
            "status": "success",
            "chunks_stored": records_inserted,
            "markdown_generated": True
        }
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to process and embed PDF")

# ==========================================
# ENDPOINT 2: RAG CHAT WITH MEMORY
# ==========================================

@app.post("/api/chat")
async def chat_with_memory(request: ChatRequest):
    try:
        # 1. FETCH EPISODIC MEMORY (Get the last 6 messages)
        history_response = supabase.table("messages") \
            .select("role, content") \
            .eq("chat_id", request.session_id) \
            .order("created_at", desc=False) \
            .limit(6) \
            .execute()
        
        chat_history = history_response.data
        
        # Format history into a readable string for the prompt
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
            print(f"Reformulated query: {standalone_query}")

        # 3. SEMANTIC SEARCH (RAG)
        query_vector = embeddings_model.embed_query(standalone_query)

        # Call the Supabase RPC function to find matching document chunks
        matching_docs = None
        try:
            matching_docs = supabase.rpc(
                'match_document_chunks', 
                {
                    'query_embedding': query_vector, 
                    'match_threshold': 0.5, # Adjust based on nomic-embed-text sensitivity
                    'match_count': 4, 
                    'p_user_id': request.user_id
                }
            ).execute()
        except Exception as rpc_error:
            print(f"RPC match_document_chunks failed (possibly overloaded function): {rpc_error}")

        # Combine retrieved chunks into a single context string
        context_texts = [doc['content'] for doc in matching_docs.data] if matching_docs and hasattr(matching_docs, 'data') and matching_docs.data else []
        retrieved_context = "\n\n---\n\n".join(context_texts) if context_texts else ""

        # ==========================================
        # NEW: FETCH DOCUMENT SUMMARY
        # ==========================================
        document_summary = ""
        if request.filename:
            summary_response = supabase.table("document_summaries") \
                .select("markdown_content") \
                .eq("user_id", request.user_id) \
                .eq("filename", request.filename) \
                .execute()
            
            if summary_response.data:
                document_summary = f"--- Document Summary for {request.filename} ---\n{summary_response.data[0]['markdown_content']}\n\n"

        # Combine the summary and the specific RAG chunks
        final_context = document_summary + "--- Specific Document Chunks ---\n" + (retrieved_context if retrieved_context else "No specific chunks matched.")

        # 4. GENERATE THE FINAL ANSWER
        final_prompt = f"""You are a helpful AI assistant. Use the following retrieved document context to answer the user's question. 
        If you don't know the answer based on the context, just say so. Consider the conversation history if relevant.

        Retrieved Document Context:
        {final_context}

        Conversation History:
        {formatted_history}

        User Question: {request.message}
        Answer:"""

        final_response = chat_model.invoke(final_prompt)
        ai_answer = final_response.content

        # 5. SAVE TO EPISODIC MEMORY
        # Save the User's message
        supabase.table("messages").insert({
            "chat_id": request.session_id,
            "role": "user",
            "content": request.message
        }).execute()

        # Save the AI's response
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