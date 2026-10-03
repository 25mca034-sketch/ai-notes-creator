from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import notes, chat, quiz
from app.memory.memory_manager import memory_manager
from app.models.schemas import HealthResponse

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Production-ready AI Notes Maker with Agent, Tools, Memory, and Gemini LLM."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)
app.include_router(chat.router)
app.include_router(quiz.router)

@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="healthy",
        version=settings.version,
        model=settings.model_name,
        agent="NotesMakerAgent",
        tools=["summarize_text", "extract_key_points", "format_notes", "generate_quiz"],
        activeSessions=memory_manager.get_active_count()
    )

@app.delete("/api/memory/{session_id}")
def clear_memory(session_id: str):
    cleared = memory_manager.clear_session(session_id)
    return {
        "success": True,
        "sessionId": session_id,
        "cleared": cleared,
        "message": f"Memory for session {session_id} has been reset."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
