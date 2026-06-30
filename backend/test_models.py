import os
from dotenv import load_dotenv
load_dotenv(".env.local")
load_dotenv(".env")
from google import genai

api_key = os.getenv("GEMINI_API_KEY", "").strip('"')

client = genai.Client(api_key=api_key)
print("Available models:")
for m in client.models.list():
    if "flash" in m.name:
        print(m.name)
