import os
from dotenv import load_dotenv
load_dotenv(".env.local")
load_dotenv(".env")
from google import genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import asyncio

api_key = os.getenv("GEMINI_API_KEY", "").strip('"')

async def main():
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=api_key)
        res = await embeddings.aembed_query("hello")
        print("models/gemini-embedding-2 worked! length:", len(res))
    except Exception as e:
        print("Error with models/gemini-embedding-2:", e)

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)
        res = await embeddings.aembed_query("hello")
        print("models/text-embedding-004 worked! length:", len(res))
    except Exception as e:
        pass

asyncio.run(main())
