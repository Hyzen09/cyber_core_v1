# Cyber Core V1 - Complete Architecture & Breakdown

Welcome! This document serves as a comprehensive breakdown of the application you have built so far, structured to help a new developer understand the codebase concept-by-concept. It also includes a module-wise roadmap for extending the application using advanced Next.js concepts.

---

## 1. Complete Tech Stack Breakdown

### Frontend (Next.js Application - `chatbot/`)
* **Framework**: Next.js 16 (App Router) combined with React 19.
* **Language**: TypeScript for strong static typing and error prevention.
* **Styling**: Tailwind CSS v4, customized heavily for a distinct "Cyberpunk" aesthetic using CSS variables, custom classes (`scanlines`, `btn-cyber`), and SVGs.
* **Markdown Rendering**: `react-markdown` and `remark-gfm` allow the frontend to render structured markdown (tables, code blocks) returned by the AI.
* **Auth & Database SDK**: `@supabase/ssr` and `@supabase/supabase-js` for user authentication and direct database communication.

### Backend (Python API - `pdf-ocr-backend/`)
* **Framework**: FastAPI, chosen for its high-performance asynchronous request handling.
* **OCR Pipeline**: `pdf2image` and Tesseract (`pytesseract`) extract raw text from PDF uploads.
* **AI & RAG Framework**: LangChain (`langchain_ollama`, `langchain_text_splitters`) coordinates AI models and document chunking.
* **Local Models**: 
  * `ChatOllama` running `qwen2.5-coder:7b` as the core reasoning engine.
  * `OllamaEmbeddings` running `nomic-embed-text` for vectorizing text.
* **Vector Store**: Supabase (utilizing PostgreSQL's `pgvector` extension) stores both standard relational data and high-dimensional document vectors.

---

## 2. Concept-by-Concept Component Breakdown

### A. Next.js App Router (`app/` Directory)
* **Concept**: Next.js uses file-system-based routing where folders define routes and `page.tsx` defines the UI.
* **`app/layout.tsx`**: The root layout wrapper. It establishes the global HTML structure and imports global styles (`globals.css`).
* **`app/page.tsx`**: The main landing page (`/`). A simple, clean Server Component directing users to log in or register.
* **`app/chat/page.tsx`**: The main application interface (`/chat`). Designated with `'use client'`, meaning it renders on the browser to handle interactivity, user inputs, and local state.

### B. React State Management in the UI
* **Concept**: React uses Hooks to store data that changes over time and trigger UI updates.
* **Implementation (`app/chat/page.tsx`)**:
  * `useState`: Manages chat lists (`chats`), the current conversation (`messages`), and UI conditions like loading spinners (`isLoading`) or active files (`activeFilename`).
  * `useEffect`: Handles side effects. When the page loads, it triggers an effect to verify the user's Supabase session. Another effect auto-scrolls the window to the bottom when the `messages` array updates.

### C. Server Actions (`app/actions/db.ts`)
* **Concept**: Next.js Server Actions (`'use server'`) allow you to write backend-executed code directly within the frontend repository.
* **Implementation**: The application uses Server Actions (`fetchChatsAction`, `createChatAction`, etc.) to interact securely with Supabase. It explicitly bypasses client-side restrictions by using a Supabase Service Role key securely on the server side, ensuring smooth CRUD (Create, Read, Update, Delete) operations for chat sessions.

### D. File Upload & Retrieval-Augmented Generation (RAG)
* **Concept**: RAG bridges the gap between static LLMs and custom user data by storing documents as searchable mathematical vectors.
* **The Upload Flow (`/api/upload-pdf`)**: 
  1. The Next.js frontend sends a PDF via `FormData`.
  2. FastAPI extracts the text using Tesseract OCR.
  3. Qwen 7B instantly generates a full Markdown summary of the document.
  4. The text is chunked, converted to embeddings, and stored in Supabase.
* **The Chat Flow (`/api/chat`)**:
  1. Next.js sends the user's message alongside the `session_id` and the `activeFilename`.
  2. FastAPI retrieves the user's past 6 messages (Episodic Memory) and reformulates the question for better context.
  3. A Vector Search (`match_document_chunks` RPC) finds relevant document chunks.
  4. The retrieved chunks, the document summary, and the chat history are all combined and fed to Qwen 7B to generate a highly contextual answer.

---

## 3. Module-Wise Mind Plan: Extending the Concepts

To advance your skills as a Next.js developer, here is a structured roadmap for the next features and concepts you should introduce to this application:

### Module 1: Next.js API Routes (Proxying)
* **New Concept**: Route Handlers (`app/api/.../route.ts`).
* **The Plan**: Currently, the frontend talks directly to FastAPI (`http://localhost:8000`). This is a security and CORS risk in production. You will create an API Route in Next.js (e.g., `app/api/chat/route.ts`) that intercepts the frontend request and forwards it to FastAPI securely from the backend.

### Module 2: Streaming Responses & React Suspense
* **New Concept**: Server-Sent Events (SSE) and Streaming UI.
* **The Plan**: Modify the FastAPI endpoint to stream tokens back one-by-one instead of waiting for the entire answer. Implement Next.js AI SDK or custom React streaming to create a real-time "typing" effect in the UI, dramatically improving perceived performance.

### Module 3: Advanced State Management (Context API / Zustand)
* **New Concept**: Global State Management.
* **The Plan**: `app/chat/page.tsx` is becoming monolithic. Extract the state (`messages`, `currentChatId`, `selectedModel`) out of the page component into a global React Context provider or a lightweight library like Zustand. This allows child components (like the Sidebar or Chat Area) to access state directly without passing props deeply.

### Module 4: Server Components & Data Fetching Optimization
* **New Concept**: React Server Components (RSC).
* **The Plan**: Refactor the Sidebar. Fetch the list of historical chats directly on the server before the page loads, rather than waiting for the client to render and trigger a `useEffect`. This demonstrates the power of Next.js Server Components for instant initial page loads.

### Module 5: Real-Time Subscriptions (Supabase)
* **New Concept**: WebSockets and Real-time databases.
* **The Plan**: Implement Supabase Realtime subscriptions on the `messages` table. This allows the application to automatically update the chat window if a message is inserted from another device or a background worker, removing the need for manual polling or state synchronization.
