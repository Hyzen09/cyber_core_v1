# Cyber Core V1 🦾

> A full-stack, AI-powered chat application featuring a modern Next.js frontend, secure Supabase authentication, and a powerful Python backend handling PDF OCR and Retrieval-Augmented Generation (RAG) entirely through local LLMs via Ollama.

---

## 🚀 Features

- **Modern Chat Interface**: A sleek, dark-mode "Cyberpunk" aesthetic built with React 19, Next.js App Router, and Tailwind CSS v4.
- **Secure Authentication**: End-to-end user authentication (Email & Google OAuth) via Supabase Auth and Server Actions.
- **PDF Upload & OCR Processing**: Seamlessly upload PDFs to be processed by a FastAPI backend using Tesseract OCR.
- **Local AI & RAG**: Uses `Ollama` locally for completely private inference. Powered by `qwen2.5-coder:7b` for reasoning and `nomic-embed-text` for vectorizing document chunks.
- **Vector Search**: Leverages **Qdrant** to securely store document embeddings and perform high-speed similarity searches, while using Supabase for chat history and authentication.

---

## 💻 Tech Stack

### Frontend (`/frontend`)
- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Auth & Database SDK**: `@supabase/ssr`, `@supabase/supabase-js`
- **Markdown Rendering**: `react-markdown`, `remark-gfm`

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **OCR Engine**: `pdf2image`, Tesseract (`pytesseract`)
- **AI Framework**: LangChain (`langchain-ollama`, `langchain-text-splitters`)
- **Vector Database**: Qdrant
- **Local Models**: Ollama (`qwen2.5-coder:7b`, `nomic-embed-text`)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
1. **Node.js** (v20+ recommended)
2. **Python** (v3.10+ recommended)
3. **Ollama**: Installed and running locally.
4. **Docker & Docker Compose**: Required to spin up the containerized application stack.
5. **Supabase Account**: A Supabase project set up with Auth and a `messages` table for chat history.

### Local Model Setup
Ensure Ollama is running, then pull the necessary models:
```bash
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/cyber_core_v1.git
cd cyber_core_v1
```

### 2. Environment Configuration
Create a `.env.local` file in the `frontend/` directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Create a `.env` file in the `backend/` directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key

QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_API_KEY=""
```

### 3. Run with Docker Compose
The entire stack (Frontend, Backend, and Qdrant) is fully containerized. To build and start the cluster:
```bash
docker compose up -d --build
```

The application will now be available at `http://localhost:3000`, and the API runs securely at `http://localhost:8000`.

---

## 📁 Project Structure

```
cyber_core_v1/
├── frontend/                    # Next.js Frontend Application
│   ├── app/                     # Next.js App Router (Pages & Layouts)
│   │   ├── actions/             # Server Actions for DB operations
│   │   ├── api/                 # Next.js API Routes
│   │   ├── chat/                # Chat Interface UI
│   │   ├── components/          # Reusable React Components
│   │   ├── login/               # Authentication UI
│   │   └── lib/                 # Utility functions (Supabase clients)
│   └── package.json             # Frontend Dependencies
│
├── backend/                     # FastAPI Python Backend
│   ├── app/                     # Backend API logic & routes
│   ├── main.py                  # FastAPI Application Entrypoint
│   └── requirements.txt         # Python Dependencies
│
├── DESIGN.md                    # UI/UX Design System Documentation
└── Project_Breakdown.md         # In-depth technical architecture breakdown
```

---

## 📜 License

This project is licensed under the MIT License.
