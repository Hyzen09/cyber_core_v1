import re
from fastapi import HTTPException
from app.models import ChatRequest
from app.core.database import supabase
from app.core.vector_store import qdrant, models
from app.services.llm_service import chat_model, embeddings_model

async def generate_chat_response(request: ChatRequest):
    history_response = supabase.table("messages") \
        .select("role, content") \
        .eq("chat_id", request.session_id) \
        .order("created_at", desc=False) \
        .limit(6) \
        .execute()
    
    chat_history = history_response.data
    formatted_history = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in chat_history]) if chat_history else "No previous conversation."

    standalone_query = request.message
    if chat_history:
        reformulation_prompt = f"""Given the following conversation history and the user's new question, rephrase the question to be a standalone query that contains all necessary context. Do not answer the question, just reformulate it.
        
        Chat History:
        {formatted_history}
        
        New Question: {request.message}
        Standalone Question:"""
        
        reformulation_response = chat_model.invoke(reformulation_prompt)
        standalone_query = reformulation_response.content.strip()

    query_vector = embeddings_model.embed_query(standalone_query)

    search_result = qdrant.query_points(
        collection_name="document_chunks",
        query=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(key="user_id", match=models.MatchValue(value=request.user_id)),
                models.FieldCondition(key="session_id", match=models.MatchValue(value=request.session_id))
            ]
        ),
        limit=4,
        score_threshold=0.4
    )

    context_texts = [hit.payload['content'] for hit in search_result.points]
    retrieved_context = "\n\n---\n\n".join(context_texts) if context_texts else ""

    document_summary = ""
    scroll_res, _ = qdrant.scroll(
        collection_name="document_summaries",
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(key="user_id", match=models.MatchValue(value=request.user_id)),
                models.FieldCondition(key="session_id", match=models.MatchValue(value=request.session_id))
            ]
        ),
        limit=5 
    )
    
    for res in scroll_res:
        summary_text = res.payload.get("markdown_content", "")
        fname = res.payload.get("filename", "Document")
        document_summary += f"--- Document Summary for {fname} ---\n{summary_text}\n\n"

    final_context = document_summary + "--- Specific Document Chunks ---\n" + (retrieved_context if retrieved_context else "No specific chunks matched.")

    final_prompt = f"""You are an intuitive, engaging, and articulate AI assistant. Your goal is to answer the user's question by seamlessly weaving together information from the retrieved context. 

    CRITICAL GUIDELINES FOR YOUR RESPONSE:
    - Talk like a human expert. Do not copy-paste chunks verbatim. Synthesize facts into a smooth, natural flow.
    - Structure your response cleanly using markdown (bolding, clear lists, short paragraphs).
    - If the retrieved context doesn't contain the answer, gracefully let the user know without guessing.
    - Do not add text "Suggested Prompts:" in your response 
    
    SUGGESTION REQUIREMENT (CRITICAL):
    You must generate 2 to 3 suggested prompts that the USER can click to ask YOU next, based on the document's content.
    
    You MUST wrap these suggested user prompts strictly inside <suggestions> and </suggestions> XML tags. 
    Place each prompt on a new line. Do NOT use numbers or bullet points.

    Retrieved Document Context:
    {final_context}

    Conversation History:
    {formatted_history}

    User Question: {request.message}
    Answer:"""

    final_response = chat_model.invoke(final_prompt)
    raw_content = final_response.content

    ai_answer = raw_content
    suggestions = []

    xml_match = re.search(r'<suggestions>(.*?)</suggestions>', raw_content, re.IGNORECASE | re.DOTALL)
    
    if xml_match:
        suggestions_text = xml_match.group(1).strip()
        ai_answer = raw_content[:xml_match.start()].strip()
    else:
        fallback_match = re.search(r'(?:\[SUGGESTIONS\]|\*\*SUGGESTIONS?:?\*\*|### SUGGESTIONS?|\*\*SUGGESTED QUESTIONS?:?\*\*|### SUGGESTED QUESTIONS?)', raw_content, re.IGNORECASE)
        if fallback_match:
            suggestions_text = raw_content[fallback_match.end():].strip()
            ai_answer = raw_content[:fallback_match.start()].strip()
        else:
            suggestions_text = ""

    if suggestions_text:
        raw_lines = suggestions_text.split('\n')
        for line in raw_lines:
            clean_line = line.strip().lstrip("-*•1234567890. \t").strip()
            clean_line = re.sub(r'<[^>]+>', '', clean_line).strip()
            if len(clean_line) > 5 and clean_line.endswith('?'):
                suggestions.append(clean_line)

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
        "suggestions": suggestions,
        "retrieved_documents": len(context_texts)
    }
