# Cyber Core V1 - Data Flow & Architecture

This document explains the end-to-end data flow of the application, detailing how the Caddy Reverse Proxy routes traffic, and what happens under the hood when specific user actions are triggered.

---

## 1. High-Level Architecture
- **Caddy Proxy (`http://13.203.92.73`)**: The single entry point for all internet traffic. It sits in front of the application and routes traffic based on the URL path.
- **Frontend Container (Next.js - Port 3000)**: Serves the User Interface, handles Auth redirects, and manages the LangChain streaming connection to Ollama.
- **Backend Container (FastAPI - Port 8000)**: A heavy-lifting Python worker. It handles Optical Character Recognition (OCR), parsing PDFs, generating vector embeddings, and creating agents.
- **Supabase**: Cloud database used for Google OAuth login and storing Markdown versions of the uploaded PDFs.
- **Qdrant Container (Port 6333)**: Local Vector Database that stores the numerical embeddings generated from the PDFs for similarity search.
- **Ollama Container (Port 11434)**: The local AI Engine running `qwen2.5-coder` and `nomic-embed-text`. 

---

## 2. Request Routing (The Caddyfile)
All traffic hits the EC2 Public IP on Port 80. Caddy intercepts it and decides where it goes:

* **`POST /api/upload-pdf`** ➔ Routed to **Backend** (FastAPI)
* **`POST /api/agents`** ➔ Routed to **Backend** (FastAPI)
* **`GET /*` (Everything Else)** ➔ Routed to **Frontend** (Next.js UI)
* **`POST /api/chat`** ➔ Routed to **Frontend** (Next.js API Routes)

---

## 3. Data Flows by User Action

### A. User Logs In
1. **Action**: User clicks "Login with Google".
2. **Endpoint**: Browser sends request to `https://zuswmcqwudybxbpxcoaw.supabase.co/auth/v1/authorize`.
3. **Flow**:
   - Supabase authenticates the user via Google.
   - Supabase redirects the user back to the EC2 IP: `http://13.203.92.73/chat`.
   - Caddy routes `/chat` to the **Frontend**, which loads the chat interface.

### B. User Uploads a PDF
1. **Action**: User attaches a PDF and clicks send in the chat interface.
2. **Endpoint**: `POST http://13.203.92.73/api/upload-pdf`
3. **Flow**:
   - Caddy sees `/api/upload-pdf` and routes it to the **Backend (FastAPI)**.
   - **Backend** uses Tesseract/Poppler to OCR and extract text from the PDF.
   - **Backend** chunks the text and sends it to **Ollama** (`http://ollama:11434`) using `nomic-embed-text` to turn the chunks into vectors.
   - **Backend** saves the vectors into the **Qdrant DB**.
   - **Backend** asks **Ollama** (`qwen2.5-coder:1.5b`) to generate a Markdown summary of the entire document.
   - **Backend** pushes the final Markdown summary into **Supabase** under the user's ID.

### C. User Sends a Chat Message
1. **Action**: User types a question in the chat box and hits enter.
2. **Endpoint**: `POST http://13.203.92.73/api/chat`
3. **Flow**:
   - Caddy routes this to the **Frontend** because it is not explicitly caught by the backend rules.
   - The Next.js API Route (`frontend/app/api/chat/route.ts`) takes over.
   - **Frontend** queries **Supabase** for the 3 most recently uploaded Markdown summaries belonging to the user.
   - **Frontend** constructs a giant System Prompt containing the Cyberpunk personality instructions + the Markdown context.
   - **Frontend** opens a streaming connection to **Ollama** (`http://ollama:11434`) using `qwen2.5-coder:1.5b`.
   - **Ollama** generates the response word-by-word.
   - **Frontend** streams the text directly back to the user's browser in real-time.

### D. User Initializes a New Agent
1. **Action**: User fills out the form on the Create Agent page and attaches a Gold Dataset.
2. **Endpoint**: `POST http://13.203.92.73/api/agents`
3. **Flow**:
   - Caddy sees `/api/agents` and routes the request to the **Backend (FastAPI)**.
   - **Backend** receives the configuration (System Prompt, Designation, Knowledge base).
   - **Backend** processes the dataset, generates embeddings, and saves the agent profile to the database.
