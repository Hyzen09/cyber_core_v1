import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const isDev = process.env.NODE_ENV === 'development';
    const internalApiUrl = process.env.INTERNAL_API_URL || (isDev ? 'http://127.0.0.1:8000' : 'http://backend:8000');
    const backendUrl = `${internalApiUrl}/api/engine/agents`;
    
    // Safety check to prevent routing loops if internalApiUrl is misconfigured
    if (backendUrl.includes(req.nextUrl.host)) {
      console.error("Routing loop detected! backendUrl resolves back to the frontend host.");
      return NextResponse.json({ error: "Configuration Error: API routing loop detected." }, { status: 500 });
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: err }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
