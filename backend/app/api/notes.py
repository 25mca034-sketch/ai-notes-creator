from fastapi import APIRouter, HTTPException
from app.models.schemas import GenerateNotesRequest, GenerateNotesResponse
from app.agents.notes_agent import notes_agent
from app.memory.memory_manager import memory_manager

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.post("/generate", response_model=GenerateNotesResponse)
def generate_notes_endpoint(request: GenerateNotesRequest):
    if not request.topic and not request.content:
        raise HTTPException(status_code=400, detail="Either topic or content must be provided.")
    try:
        return notes_agent.generate_notes(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
