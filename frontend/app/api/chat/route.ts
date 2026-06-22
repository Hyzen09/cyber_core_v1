import { NextRequest } from 'next/server';
import { ChatOllama } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Initialize Supabase to fetch the Markdown files
const supabaseUrl = 'https://zuswmcqwudybxbpxcoaw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PASTE_YOUR_SERVICE_KEY_HERE_IF_NO_ENV_FILE';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { messages, modelType, userId } = await req.json();

    // 1. FETCH THE MARKDOWN FILES FROM SUPABASE
    let markdownContext = "";
    if (userId) {
      // Get the 3 most recently uploaded document summaries for this user
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
    const systemPrompt = `You are CYBER_CORE_V1, a highly advanced, brutally efficient Cyberpunk AI Terminal assistant. 
    Your tone is technical, sharp, and data-driven. Do not use pleasantries. Output data clearly.
    ${markdownContext}`;

    // 3. FORMAT MESSAGES FOR LANGCHAIN
    const formattedMessages = messages.map((m: any) => 
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );
    
    // Inject the Markdown Context at the very beginning of the AI's memory
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
        baseUrl: 'http://127.0.0.1:11434',
        temperature: 0.2,
      });
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

    return new Response(customStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}