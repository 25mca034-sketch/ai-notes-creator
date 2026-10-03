from fastapi import APIRouter, HTTPException
from app.models.schemas import QuizRequest, QuizResult
from app.tools.quiz import generate_quiz
from app.memory.memory_manager import memory_manager

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

@router.post("", response_model=QuizResult)
def quiz_endpoint(request: QuizRequest):
    topic = request.topic or "Study Material"
    notes_ctx = ""
    if request.sessionId:
        session = memory_manager.get_session(request.sessionId)
        if session and session.current_notes:
            notes_ctx = session.current_notes.model_dump_json()
            topic = session.topic or topic

    try:
        return generate_quiz(
            topic=topic,
            notes_context=notes_ctx,
            num_mcqs=request.numMcqs or 4,
            num_short=request.numShortAnswer or 2
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
