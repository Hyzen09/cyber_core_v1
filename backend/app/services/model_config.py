# pyrefly: ignore [missing-import]
from langchain_ollama import OllamaEmbeddings, ChatOllama
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import OLLAMA_BASE_URL, GEMINI_API_KEY

embeddings_model = OllamaEmbeddings(model="nomic-embed-text", base_url=OLLAMA_BASE_URL)
chat_model = ChatOllama(model="qwen2.5-coder:1.5b", base_url=OLLAMA_BASE_URL, temperature=0.4)

gemini_chat_model = None
if GEMINI_API_KEY:
    gemini_chat_model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        api_key=GEMINI_API_KEY
    )

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)
