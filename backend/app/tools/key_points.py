import json
from typing import Dict, Any
from google.genai import types
from app.services.gemini import client, MODEL_NAME

def extract_key_points(topic: str, content: str) -> Dict[str, Any]:
    """Extracts essential concepts, facts, definitions, formulas, and terminology."""
    prompt = f"""You are a key points extraction tool in an AI Notes Agent.
Analyze the topic and content below, and extract the most important information.

Topic: {topic}
Content:
\"\"\"
{content}
\"\"\"

Extract:
1. "keyPoints": High-yield, factual bullet points.
2. "terms": Critical vocabulary or formulas with definitions.

Return strictly JSON matching:
{{
  "keyPoints": ["point 1", "point 2"],
  "terms": [{{"term": "...", "definition": "..."}}]
}}"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    try:
        return json.loads(response.text or "{}")
    except Exception:
        return {
            "keyPoints": [f"Core mechanisms and principles of {topic}"],
            "terms": []
        }
