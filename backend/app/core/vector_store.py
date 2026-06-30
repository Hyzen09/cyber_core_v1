# pyrefly: ignore [missing-import]
from qdrant_client import QdrantClient, models
from app.config import QDRANT_URL, QDRANT_API_KEY

qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def init_collections():
    collection_names = ["document_chunks", "document_summaries"]
    for name in collection_names:
        if not qdrant.collection_exists(name):
            qdrant.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(size=3072, distance=models.Distance.COSINE)
            )
            print(f"Created Qdrant Collection: {name}")
