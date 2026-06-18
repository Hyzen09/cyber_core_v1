# pyrefly: ignore [missing-import]
from langchain_ollama import OllamaEmbeddings, ChatOllama
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import OLLAMA_BASE_URL

embeddings_model = OllamaEmbeddings(model="nomic-embed-text", base_url=OLLAMA_BASE_URL)
chat_model = ChatOllama(model="qwen2.5-coder:7b", base_url=OLLAMA_BASE_URL, temperature=0.4)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)
