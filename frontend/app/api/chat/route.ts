import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("RECEIVED PAYLOAD IN NEXT.JS:", body);

    const { messages, modelType, userId, session_id, agent_id } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: Missing or invalid messages array' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lastMessage = messages[messages.length - 1];

    // Forward the request to the Python backend which handles Qdrant RAG, Agents, and LLM (Gemini/Ollama)
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat`;
    
    const pythonResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId || 'anonymous',
        session_id: session_id || 'default_session',
        message: lastMessage.content,
        modelType: modelType || 'local',
        agent_id: agent_id || null
      })
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("Backend Error:", errorText);
      return new Response(JSON.stringify({ error: `Backend Error: ${errorText}` }), { status: pythonResponse.status });
    }

    const data = await pythonResponse.json();
    const answer = data.answer || "I'm sorry, I couldn't generate a response.";

    // Fake the streaming effect so the UI types it out smoothly
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        // Stream chunk by chunk (e.g. 15 characters at a time)
        const chunkSize = 15;
        for (let i = 0; i < answer.length; i += chunkSize) {
          const chunk = answer.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(chunk));
          // Delay to simulate typing speed
          await new Promise(r => setTimeout(r, 15));
        }
        controller.close();
      },
    });

    return new Response(customStream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('API Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}