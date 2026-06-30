from qdrant_client import QdrantClient
try:
    # Try localhost
    client1 = QdrantClient(url="http://localhost:6333")
    print("localhost: ", client1.get_collections())
except Exception as e:
    print("localhost error: ", e)

try:
    # Try 127.0.0.1
    client2 = QdrantClient(url="http://127.0.0.1:6333")
    print("127.0.0.1: ", client2.get_collections())
except Exception as e:
    print("127.0.0.1 error: ", e)
