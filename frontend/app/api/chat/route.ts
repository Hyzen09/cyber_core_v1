import { NextRequest } from 'next/server';
import { ChatOllama } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { createClient } from '@supabase/supabase-js';

// 1. FIX: Removed the 'edge' runtime so this runs securely on the native Node.js Docker environment
export const runtime = 'nodejs';

// Initialize Supabase to fetch the Markdown files
const supabaseUrl = 'https://zuswmcqwudybxbpxcoaw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PASTE_YOUR_SERVICE_KEY_HERE_IF_NO_ENV_FILE';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("RECEIVED PAYLOAD:", body); // Logs exactly what the frontend sent to Docker

    const { messages, modelType, userId } = body;

    // 🛡️ NEW VALIDATION ARMOR: Prevents the '.map() of undefined' crash
    if (!messages || !Array.isArray(messages)) {
      console.error("Validation Error: 'messages' array is missing or invalid in payload.");
      return new Response(
        JSON.stringify({ error: 'Bad Request: Missing or invalid messages array' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. FETCH THE MARKDOWN FILES FROM SUPABASE
    let markdownContext = "";
    if (userId) {
      const { data: summaries } = await supabase
        .from('document_summaries')
        .select('filename, markdown_content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (summaries && summaries.length > 0) {
        markdownContext = "\n\nCRITICAL CONTEXT - You have access to the following Markdown (.md) reference files extracted from the user's documents. Use this information to answer their queries with extreme accuracy:\n\n";
        summaries.forEach(doc => {
          markdownContext += `=== START OF FILE: ${doc.filename} ===\n${doc.markdown_content}\n=== END OF FILE ===\n\n`;
        });
      }
    }

    // 2. CONFIGURE THE CYBERPUNK SYSTEM PROMPT
    const systemPrompt = `You are a highly advanced, brutally efficient assistant. 
    Your tone is informative, sharp, and data-driven. Do use pleasantries. Output data clearly.
    ${markdownContext}`;

    // 3. FORMAT MESSAGES FOR LANGCHAIN
    const formattedMessages: BaseMessage[] = messages.map((m: any) => 
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    formattedMessages.unshift(new SystemMessage(systemPrompt));

    // 4. ROUTE TO THE CORRECT MODEL
    let llm;
    if (modelType === 'gemini') {
      llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        temperature: 0.2,
        apiKey: process.env.GEMINI_API_KEY,
      });
    } else {
      llm = new ChatOllama({
        model: 'qwen2.5-coder:1.5b',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
        temperature: 0.2,
      });
    }
    
    if (!llm) { 
      return new Response(JSON.stringify({ error: 'Model not found' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. STREAM THE RESPONSE
    const stream = await llm.stream(formattedMessages);
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk.text));
        }
        controller.close();
      },
    });

    // 2. FIX: Added crucial headers to bypass Next.js compression and explicitly allow chunked streaming
    return new Response(customStream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}