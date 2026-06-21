import uuid
from fastapi import UploadFile, HTTPException
# pyrefly: ignore [missing-import]
from pdf2image import convert_from_bytes
# pyrefly: ignore [missing-import]
import pytesseract
from app.services.model_config import embeddings_model, chat_model, text_splitter
from app.core.vector_store import qdrant, models

async def process_and_store_pdf(file: UploadFile, user_id: str, session_id: str):
    if file.filename.endswith('.pdf'):
        pdf_bytes = await file.read()
        images = convert_from_bytes(pdf_bytes)
        
        full_text = ""
        for image in images:
            full_text += pytesseract.image_to_string(image) + "\n"
    elif file.filename.endswith('.txt') or file.filename.endswith('.csv'):
        raw_bytes = await file.read()
        full_text = raw_bytes.decode('utf-8')
    else:
        raise HTTPException(status_code=400, detail="Only PDF, CSV, and TXT files are allowed")

    print(f"Asking Qwen to generate Markdown for {file.filename} in session {session_id}...")
    prompt = f"""You are a master data analyst. Read the following document text and extract all the detailed and key information. 
    Format your response strictly as a comprehensive Markdown (.md) document. Include headers, bullet points, and key metrics.
    
    DOCUMENT TEXT:
    {full_text[:25000]}"""
    
    summary_response = await chat_model.ainvoke(prompt)
    markdown_content = summary_response.content

    summary_vector = await embeddings_model.aembed_query(markdown_content)
    qdrant.upsert(
        collection_name="document_summaries",
        points=[
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=summary_vector,
                payload={
                    "user_id": user_id,
                    "session_id": session_id, 
                    "filename": file.filename,
                    "markdown_content": markdown_content
                }
            )
        ]
    )

    chunks = text_splitter.split_text(full_text)
    points = []
    
    # Process chunks efficiently with aembed_documents to avoid blocking event loop
    if chunks:
        chunk_vectors = await embeddings_model.aembed_documents(chunks)
        for chunk, vector in zip(chunks, chunk_vectors):
            points.append(
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "user_id": user_id,
                        "session_id": session_id, 
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
