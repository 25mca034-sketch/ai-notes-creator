import json
import uuid
from typing import Dict, Any
from google.genai import types
from app.services.gemini import client, MODEL_NAME
from app.models.schemas import QuizResult, MCQQuestion, ShortAnswerQuestion

def generate_quiz(topic: str, notes_context: str, num_mcqs: int = 4, num_short: int = 2) -> QuizResult:
    """Generates MCQs and short-answer active-recall questions from notes."""
    prompt = f"""You are the Quiz Generation Tool in an AI Notes Agent.
Create active-recall test questions based on the provided notes context.

Topic: {topic}
Notes Context:
\"\"\"
{notes_context}
\"\"\"

Requirements:
- Generate {num_mcqs} Multiple Choice Questions (MCQs):
  - 4 plausible options.
  - Exactly one correct answer index (0, 1, 2, or 3).
  - Detailed explanation of why the correct option is right.
- Generate {num_short} Short-Answer Questions:
  - Deep-understanding question.
  - Model sample answer.
  - Key concept tested.

Return strictly JSON matching:
{{
  "title": "Quiz: {topic}",
  "mcqs": [
    {{
      "id": "mcq-1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "..."
    }}
  ],
  "short_answer": [
    {{
      "id": "sa-1",
      "question": "...",
      "sampleAnswer": "...",
      "keyConcept": "..."
    }}
  ]
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
        mcqs = [
            MCQQuestion(
                id=m.get("id", str(uuid.uuid4())[:8]),
                question=m["question"],
                options=m["options"],
                correctAnswerIndex=m["correctAnswerIndex"],
                explanation=m["explanation"]
            )
            for m in data.get("mcqs", [])
        ]
        short_answer = [
            ShortAnswerQuestion(
                id=s.get("id", str(uuid.uuid4())[:8]),
                question=s["question"],
                sampleAnswer=s["sampleAnswer"],
                keyConcept=s["keyConcept"]
            )
            for s in data.get("short_answer", [])
        ]
        return QuizResult(
            title=data.get("title", f"Quiz: {topic}"),
            mcqs=mcqs,
            short_answer=short_answer
        )
    except Exception as e:
        return QuizResult(
            title=f"Quiz: {topic}",
            mcqs=[],
            short_answer=[]
        )
