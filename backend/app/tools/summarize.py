from app.services.gemini import client, MODEL_NAME

def summarize_text(text: str, length: str = "short", subject: str = "General") -> str:
    """Summarizes text into concise, high-yield overview based on target length."""
    length_guides = {
        "very_short": "1-2 concise sentences focusing only on the core definition.",
        "short": "1 concise paragraph with 3-4 key sentences.",
        "medium": "2 well-structured paragraphs capturing context and main ideas.",
        "detailed": "3 detailed paragraphs covering background, core principles, nuances, and conclusions.",
    }
    guide = length_guides.get(length, length_guides["short"])

    prompt = f"""You are an expert summarization tool in an AI Notes Agent.
Summarize the following text accurately and concisely.

Target Length: {length} ({guide})
Subject Focus: {subject}

Rules:
- Preserve factual accuracy.
- Eliminate filler and redundant phrases.
- Use clear, simple language.
- Do not invent facts.

Source Text:
\"\"\"
{text}
\"\"\""""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )
    return (response.text or "").strip()
