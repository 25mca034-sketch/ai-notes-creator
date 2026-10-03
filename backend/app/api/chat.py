from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.agents.notes_agent import notes_agent

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if not request.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required.")
    try:
        return notes_agent.handle_chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
