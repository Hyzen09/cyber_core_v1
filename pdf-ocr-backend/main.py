import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Initialize Supabase
SUPABASE_URL = "https://zuswmcqwudybxbpxcoaw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3dtY3F3dWR5YnhicHhjb2F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0NTg4NCwiZXhwIjoyMDk2ODIxODg0fQ.L9GcPISzuZa8M8_5spid9XTu6dJjNEbcFdWNb7FYDwc" 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Local Models
embeddings_model = OllamaEmbeddings(model="nomic-embed-text", base_url="http://127.0.0.1:11434")

# NEW: Initialize Qwen to act as the Markdown Analyst
chat_model = ChatOllama(model="qwen2.5-coder:7b", base_url="http://127.0.0.1:11434", temperature=0.2)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)