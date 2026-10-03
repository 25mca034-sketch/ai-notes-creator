from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.schemas import NoteStructure, QuizResult, AgentThought

class AgentState(BaseModel):
    session_id: str
    topic: str
    content: Optional[str] = ""
    length: str = "short"
    subject: str = "General"
    current_notes: Optional[NoteStructure] = None
    current_quiz: Optional[QuizResult] = None
    thoughts: List[AgentThought] = []
    tools_used: List[str] = []
