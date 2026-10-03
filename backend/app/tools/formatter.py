import json
from typing import Dict, Any, List
from google.genai import types
from app.services.gemini import client, MODEL_NAME
from app.models.schemas import NoteStructure, TermItem, ExampleItem

def format_notes(
    topic: str,
    overview: str,
    key_points: List[str],
    terms: List[Dict[str, str]],
    length: str = "short",
    subject: str = "General"
) -> NoteStructure:
    """Formats all extracted notes into a clean, hierarchical, standardized structure."""
    prompt = f"""You are the notes formatting tool in an AI Notes Agent.
Assemble and polish the extracted notes into short, clear, highly structured study notes.

Input Data:
Topic: {topic}
Target Length: {length}
Overview: {overview}
Key Points: {json.dumps(key_points)}
Terms: {json.dumps(terms)}

Ensure:
- Title is clear and authoritative.
- Overview is an engaging 1-3 sentence concept synopsis.
- Key Points are concise, well-phrased bullet points without fluff.
- Important Terms have clear, memorable definitions.
- Examples include concrete real-world illustrations.
- Summary is a 1-2 sentence memory anchor.
- reading_time_minutes is calculated accurately.

Return strictly JSON matching NoteStructure schema:
{{
  "title": "{topic}",
  "overview": "...",
  "key_points": ["..."],
  "important_terms": [{{"term": "...", "definition": "..."}}],
  "examples": [{{"title": "...", "description": "..."}}],
  "summary": "...",
  "reading_time_minutes": 2
}}"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    try:
        data = json.loads(response.text or "{}")
        return NoteStructure(
            title=data.get("title", topic),
            overview=data.get("overview", overview),
            key_points=data.get("key_points", key_points),
            important_terms=[TermItem(**t) for t in data.get("important_terms", terms)],
            examples=[ExampleItem(**e) for e in data.get("examples", [])],
            summary=data.get("summary", f"Summary of {topic}"),
            reading_time_minutes=data.get("reading_time_minutes", 2),
            subject_tag=subject
        )
    except Exception as e:
        return NoteStructure(
            title=topic,
            overview=overview,
            key_points=key_points,
            important_terms=[TermItem(term=t.get("term", ""), definition=t.get("definition", "")) for t in terms],
            examples=[ExampleItem(title="Practical Application", description=f"How {topic} is applied in practice.")],
            summary=f"Overview of {topic}.",
            reading_time_minutes=2,
            subject_tag=subject
        )
