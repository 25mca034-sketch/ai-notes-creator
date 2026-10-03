import time
import json
import uuid
from typing import Dict, Any, Tuple
from app.services.gemini import client, MODEL_NAME
from app.memory.memory_manager import memory_manager
from app.tools.summarize import summarize_text
from app.tools.key_points import extract_key_points
from app.tools.formatter import format_notes
from app.tools.quiz import generate_quiz
from app.models.schemas import (
    GenerateNotesRequest,
    GenerateNotesResponse,
    ChatRequest,
    ChatResponse,
    NoteStructure,
    AgentThought,
    QuizResult,
)
from app.agents.prompts import SYSTEM_PROMPT_NOTES_MAKER

class NotesAgent:
    """
    Notes Maker Agent:
    - Analyzes user topic and study content
    - Decides when and how to invoke tools (summarize_text, extract_key_points, format_notes, generate_quiz)
    - Leverages conversation memory across turns
    - Returns structured notes and agent reasoning trace
    """

    def generate_notes(self, request: GenerateNotesRequest) -> GenerateNotesResponse:
        session_id = request.sessionId or f"sess_{uuid.uuid4().hex[:8]}"
        topic = request.topic.strip()
        content = (request.content or "").strip()
        length = request.length or "short"
        subject = request.subject or "General"

        thoughts: list[AgentThought] = []
        tools_used: list[str] = []

        # 1. Understanding & Intent Analysis
        thoughts.append(AgentThought(
            step="intent_analysis",
            thought=f"Analyzing topic '{topic}' in domain '{subject}' with target depth '{length}'. Provided input length: {len(content)} chars.",
            timestamp=int(time.time())
        ))

        # Synthesize source material if user provided only topic
        source_text = content
        if not source_text or len(source_text) < 40:
            thoughts.append(AgentThought(
                step="material_synthesis",
                thought=f"Input lacks detailed context. Querying Gemini to synthesize foundational factual material for topic '{topic}'.",
                timestamp=int(time.time())
            ))
            synth_resp = client.models.generate_content(
                model=MODEL_NAME,
                contents=f"Provide foundational, factually verified educational reference notes for '{topic}' ({subject}). Explain core definitions, mechanisms, key components, and applications."
            )
            source_text = (synth_resp.text or topic).strip()

        # 2. Tool: summarize_text
        thoughts.append(AgentThought(
            step="tool_invocation",
            tool="summarize_text",
            thought=f"Invoking 'summarize_text' tool to distill key themes into a {length} overview.",
            timestamp=int(time.time())
        ))
        tools_used.append("summarize_text")
        overview = summarize_text(source_text, length=length, subject=subject)
        memory_manager.log_tool(session_id, "summarize_text", f"Summarized {len(source_text)} chars to length {length}")

        # 3. Tool: extract_key_points
        thoughts.append(AgentThought(
            step="tool_invocation",
            tool="extract_key_points",
            thought="Invoking 'extract_key_points' tool to isolate core concepts, bullet points, and definitions.",
            timestamp=int(time.time())
        ))
        tools_used.append("extract_key_points")
        extracted = extract_key_points(topic, source_text)
        key_points = extracted.get("keyPoints", [f"Fundamental principles of {topic}"])
        terms = extracted.get("terms", [])
        memory_manager.log_tool(session_id, "extract_key_points", f"Isolated {len(key_points)} points and {len(terms)} terms")

        # 4. Tool: format_notes
        thoughts.append(AgentThought(
            step="tool_invocation",
            tool="format_notes",
            thought="Invoking 'format_notes' tool to assemble canonical structured study notes.",
            timestamp=int(time.time())
        ))
        tools_used.append("format_notes")
        structured_notes = format_notes(
            topic=topic,
            overview=overview,
            key_points=key_points,
            terms=terms,
            length=length,
            subject=subject
        )
        memory_manager.log_tool(session_id, "format_notes", f"Synthesized notes for {topic}")

        # 5. Persist to memory
        memory_manager.update_notes(session_id, topic, structured_notes, length=length, subject=subject)
        memory_manager.add_message(session_id, "user", f"Generate {length} notes on {topic}")
        memory_manager.add_message(session_id, "assistant", f"Generated structured notes for {structured_notes.title}")

        thoughts.append(AgentThought(
            step="memory_sync",
            thought=f"Notes stored in conversation memory for session {session_id}. Ready for follow-up refinements.",
            timestamp=int(time.time())
        ))

        return GenerateNotesResponse(
            sessionId=session_id,
            title=structured_notes.title,
            overview=structured_notes.overview,
            key_points=structured_notes.key_points,
            important_terms=structured_notes.important_terms,
            examples=structured_notes.examples,
            summary=structured_notes.summary,
            reading_time_minutes=structured_notes.reading_time_minutes or 2,
            subject_tag=structured_notes.subject_tag or subject,
            agent_thoughts=thoughts,
            tools_used=tools_used
        )

    def handle_chat(self, request: ChatRequest) -> ChatResponse:
        session = memory_manager.get_or_create_session(request.sessionId)
        message = request.message.strip()
        thoughts: list[AgentThought] = []
        tools_used: list[str] = []

        thoughts.append(AgentThought(
            step="memory_retrieval",
            thought=f"Retrieved session {request.sessionId}. Current topic: '{session.topic}'. Prior messages: {len(session.messages)}.",
            timestamp=int(time.time())
        ))

        notes_ctx = session.current_notes.model_dump_json() if session.current_notes else "No notes generated yet."

        # Route intent
        route_prompt = f"""You are the routing engine of an AI Notes Agent.
Analyze the user's message in context of previous notes.

Topic: {session.topic}
Active Notes:
{notes_ctx}

User message: "{message}"

Determine intent:
- MODIFY_NOTES (e.g., "make it shorter", "add examples", "convert to exam sheet", "make it more detailed")
- GENERATE_QUIZ (e.g., "create a quiz", "test me", "generate 5 MCQs")
- EXPLAIN_QUERY (e.g., "explain point 3", "what is X?", general study questions)

Return JSON:
{{"intent": "MODIFY_NOTES" | "GENERATE_QUIZ" | "EXPLAIN_QUERY", "tool": "format_notes" | "generate_quiz" | "none"}}"""

        route_resp = client.models.generate_content(
            model=MODEL_NAME,
            contents=route_prompt
        )
        try:
            route_data = json.loads(route_resp.text or "{}")
        except Exception:
            route_data = {"intent": "EXPLAIN_QUERY", "tool": "none"}

        intent = route_data.get("intent", "EXPLAIN_QUERY")
        tool = route_data.get("tool", "none")

        thoughts.append(AgentThought(
            step="intent_decision",
            thought=f"Agent classified intent as '{intent}', proposing tool '{tool}'.",
            timestamp=int(time.time())
        ))

        updated_notes = None
        quiz = None
        reply = ""

        if intent == "MODIFY_NOTES" and session.current_notes:
            thoughts.append(AgentThought(
                step="tool_invocation",
                tool="format_notes",
                thought=f"Modifying active notes with user instruction: '{message}'",
                timestamp=int(time.time())
            ))
            tools_used.append("format_notes")
            mod_prompt = f"""You are the Notes Modifier in an AI Notes Agent.
Current Notes:
{notes_ctx}

User Instruction: "{message}"

Apply user's instruction and return updated notes strictly adhering to JSON schema:
{{
  "title": str,
  "overview": str,
  "key_points": [str],
  "important_terms": [{{"term": str, "definition": str}}],
  "examples": [{{"title": str, "description": str}}],
  "summary": str,
  "reading_time_minutes": int
}}"""
            mod_resp = client.models.generate_content(
                model=MODEL_NAME,
                contents=mod_prompt
            )
            try:
                mod_data = json.loads(mod_resp.text or "{}")
                updated_notes = NoteStructure(**mod_data)
                session.current_notes = updated_notes
                reply = f"I've updated your notes based on your request: '{message}'."
            except Exception:
                reply = "I attempted to update the notes but encountered a parsing error. Please specify what you'd like changed."
        elif intent == "GENERATE_QUIZ":
            thoughts.append(AgentThought(
                step="tool_invocation",
                tool="generate_quiz",
                thought="Generating active-recall quiz from notes context.",
                timestamp=int(time.time())
            ))
            tools_used.append("generate_quiz")
            quiz = generate_quiz(session.topic or "General Topic", notes_ctx)
            session.current_quiz = quiz
            reply = f"I've generated a quiz with {len(quiz.mcqs)} MCQs and {len(quiz.short_answer)} short-answer questions!"
        else:
            thoughts.append(AgentThought(
                step="reasoning",
                thought="Generating detailed explanation using active notes context.",
                timestamp=int(time.time())
            ))
            history_str = "\n".join([f"{m.role.upper()}: {m.content}" for m in session.messages[-5:]])
            ans_prompt = f"""You are the study copilot in AI Notes Maker.
Active Topic: {session.topic}
Notes Context:
{notes_ctx}

Conversation History:
{history_str}

User Question: "{message}"
Answer factually and educationally. Reference the notes where relevant."""
            ans_resp = client.models.generate_content(
                model=MODEL_NAME,
                contents=ans_prompt
            )
            reply = (ans_resp.text or "").strip()

        memory_manager.add_message(request.sessionId, "user", message)
        memory_manager.add_message(request.sessionId, "assistant", reply)

        return ChatResponse(
            reply=reply,
            sessionId=request.sessionId,
            updatedNotes=updated_notes,
            quiz=quiz,
            agent_thoughts=thoughts,
            tools_used=tools_used
        )

notes_agent = NotesAgent()
