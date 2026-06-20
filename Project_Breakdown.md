# Cyber Core V1 - Architecture & Learning Breakdown

Welcome! This document serves as a comprehensive breakdown of the application we have built so far. It is structured to help a new developer understand the codebase **concept-by-concept**, breaking down the tech stack and all the components we have implemented. 

It also includes a **module-wise mind plan** for extending the application with new, advanced Next.js concepts.

---

## 1. Complete Tech Stack Breakdown

### Frontend (Next.js Application - `frontend/`)
* **Framework**: Next.js 16 (App Router) combined with React 19.
* **Language**: TypeScript for strong static typing, auto-completion, and error prevention.
* **Styling**: Tailwind CSS v4, customized heavily for a sleek, modern, professional dark-mode aesthetic using CSS variables, custom classes, and SVGs.
* **Markdown Rendering**: `react-markdown` and `remark-gfm` allow the frontend to render structured markdown (tables, code blocks, lists) returned by the AI.
* **Auth & Database SDK**: `@supabase/ssr` and `@supabase/supabase-js` for robust user authentication and direct database communication.

### Backend (Python API - `backend/`)
* **Framework**: FastAPI, chosen for its high-performance asynchronous request handling.
* **OCR Pipeline**: `pdf2image` and Tesseract (`pytesseract`) to extract raw text from PDF uploads.
* **AI & RAG Framework**: LangChain (`langchain_ollama`, `langchain_text_splitters`) to coordinate AI models and document chunking.
* **Local Models**: 
  * `ChatOllama` running `qwen2.5-coder:7b` as the core reasoning engine.
  * `OllamaEmbeddings` running `nomic-embed-text` for vectorizing text.
* **Databases**: 
  * **Qdrant**: A dedicated high-performance vector database used to store high-dimensional document chunks.
  * **Supabase**: Utilized for standard relational data, including episodic chat history and user authentication.

### Orchestration (`docker-compose.yml`)
* **Docker**: The entire tech stack is containerized. A root `docker-compose.yml` orchestrates the isolated Python Backend, Next.js Frontend, and Qdrant Vector database, routing networking through an internal bridge (`cyber_net`) and exposing necessary ports natively.

---

## 2. Concept-by-Concept Component Breakdown

### A. Next.js App Router (`app/` Directory)
* **Concept**: Next.js uses file-system-based routing where folders define the URL routes, and special files like `page.tsx` define the UI.
* **`app/layout.tsx`**: The root layout wrapper. It establishes the global HTML structure, loads fonts, and imports global styles (`globals.css`).
* **`app/page.tsx`**: The main landing page (`/`). A clean Server Component that introduces the application and directs users to log in or register.

### B. Authentication Flow & Client Components
* **Concept**: Authenticating users and protecting routes. Next.js App Router clearly distinguishes between code that runs on the Server vs. the Browser (Client).
* **Implementation (`app/login/page.tsx` & `app/register/page.tsx`)**:
  * These pages are marked with `'use client'`, meaning they run in the user's browser. This is required because they use React hooks (`useState`) to manage form inputs (email, password) and handle user interactions (button clicks).
  * We use Supabase Auth (`signInWithPassword`, `signInWithOAuth` for Google login) to securely authenticate users before letting them access the workspace.

### C. The Chat Interface & React State
* **Concept**: React uses Hooks to store data that changes over time and trigger UI updates efficiently.
* **Implementation (`app/chat/page.tsx` & `app/components/ChatInterface.tsx`)**:
  * `useState`: Manages chat lists (`chats`), the current conversation (`messages`), and UI states like loading spinners (`isLoading`) or the currently active uploaded file (`activeFilename`).
  * `useEffect`: Handles side effects. When the page loads, it triggers an effect to verify the user's Supabase session. Another effect auto-scrolls the window to the bottom whenever new messages are added.

### D. Server Actions (`app/actions/db.ts`)
* **Concept**: Next.js Server Actions (`'use server'`) allow you to write backend-executed code directly within the frontend repository. They are essentially hidden API endpoints.
* **Implementation**: We use Server Actions (`fetchChatsAction`, `createChatAction`, etc.) to interact securely with our Supabase database. This bypasses client-side restrictions by using a Supabase Service Role key securely on the server side, ensuring safe CRUD (Create, Read, Update, Delete) operations for chat sessions.

### E. File Upload & Retrieval-Augmented Generation (RAG)
* **Concept**: RAG bridges the gap between static LLMs and your custom, private data by storing documents as searchable mathematical vectors.
* **The Upload Flow (`/api/upload-pdf`)**: 
  1. The frontend sends a PDF via `FormData`.
  2. The Python backend extracts text via OCR.
  3. The local LLM generates a summary.
  4. Text is chunked, embedded, and stored in the localized **Qdrant** database (`document_chunks` collection).
* **The Chat Flow (`/api/chat`)**:
  1. The user sends a prompt from Next.js.
  2. The backend retrieves past messages from Supabase (Episodic Memory) and reformulates the question.
  3. A Vector Search (`qdrant.query_points`) finds relevant text from the uploaded PDF.
  4. The chunks and chat history are fed to the LLM to generate a highly contextual answer.

---

## 3. Module-Wise Mind Plan: Extending the Application

To advance your skills as a Next.js developer, here is a structured, module-wise roadmap for the new features and concepts we will introduce to this application next:

### Module 1: Next.js Route Handlers (API Proxying)
* **New Concept**: Route Handlers (`app/api/.../route.ts`).
* **The Plan**: Currently, the frontend talks directly to the FastAPI backend (`http://localhost:8000`). In a production setting, this exposes the backend URL and creates CORS issues. We will create API Routes in Next.js (e.g., `app/api/chat/route.ts`) to intercept the frontend requests and securely forward them to FastAPI from the Next.js server.

### Module 2: Streaming Responses & React Suspense
* **New Concept**: Server-Sent Events (SSE) and Streaming UI.
* **The Plan**: Currently, the user waits until the entire AI response is generated before seeing anything. We will modify the backend to stream tokens one-by-one. We'll use the Next.js AI SDK or custom React streaming to create a real-time "typing" effect in the UI, dramatically improving the perceived speed of the app.

### Module 3: Advanced State Management (Zustand or Context API)
* **New Concept**: Global State Management.
* **The Plan**: As `app/chat/page.tsx` grows, managing all state in one file becomes a "monolith." We will extract the state (`messages`, `currentChatId`, `activeFilename`) into a global React Context provider or a lightweight library like Zustand. This allows child components (like the Sidebar or the Message Input) to access state directly without passing props down multiple levels ("prop drilling").

### Module 4: Server Components for Data Fetching
* **New Concept**: Data Fetching Optimization with React Server Components (RSC).
* **The Plan**: We will refactor the Sidebar. Instead of waiting for the client to render and then using a `useEffect` to fetch the chat history, we will fetch the list of historical chats directly on the server before the page even loads. This demonstrates the power of Next.js Server Components for instant initial page loads and zero loading spinners.

### Module 5: Real-Time Subscriptions (Supabase)
* **New Concept**: WebSockets and Real-Time Databases.
* **The Plan**: We will implement Supabase Realtime subscriptions on the `messages` table. This allows the application to automatically update the chat window if a message is inserted from another device or a background worker, removing the need for manual polling or refreshing.

### Module 6: Generative UI Components
* **New Concept**: AI-Driven Dynamic User Interfaces.
* **The Plan**: Instead of the AI just returning markdown text, we will give the AI the ability to return structured JSON that the Next.js frontend interprets as interactive React components (e.g., rendering a custom Bar Chart component when asking about financial data in a PDF).
