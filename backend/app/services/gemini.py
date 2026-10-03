import os
from google import genai
from google.genai import types
from app.config import settings

def get_gemini_client() -> genai.Client:
    api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
    return genai.Client(
        api_key=api_key,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

client = get_gemini_client()
MODEL_NAME = settings.model_name
