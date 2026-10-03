import time
from typing import Dict, Optional, List, Any
from app.models.schemas import NoteStructure, QuizResult

class MemoryRecord:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
        self.timestamp = int(time.time())

class SessionState:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.topic: str = ""
        self.subject: str = "General"
        self.length: str = "short"
        self.current_notes: Optional[NoteStructure] = None
        self.current_quiz: Optional[QuizResult] = None
        self.messages: List[MemoryRecord] = []
        self.tool_executions: List[Dict[str, Any]] = []
        self.created_at = int(time.time())
        self.last_updated_at = int(time.time())

class MemoryManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def get_or_create_session(self, session_id: str) -> SessionState:
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionState(session_id)
        return self._sessions[session_id]

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def update_notes(self, session_id: str, topic: str, notes: NoteStructure, length: str = "short", subject: str = "General"):
        session = self.get_or_create_session(session_id)
        session.topic = topic
        session.current_notes = notes
        session.length = length
        session.subject = subject
        session.last_updated_at = int(time.time())

    def update_quiz(self, session_id: str, quiz: QuizResult):
        session = self.get_or_create_session(session_id)
        session.current_quiz = quiz
        session.last_updated_at = int(time.time())

    def add_message(self, session_id: str, role: str, content: str):
        session = self.get_or_create_session(session_id)
        session.messages.append(MemoryRecord(role, content))
        if len(session.messages) > 30:
            session.messages = session.messages[-30:]
        session.last_updated_at = int(time.time())

    def log_tool(self, session_id: str, tool_name: str, details: str):
        session = self.get_or_create_session(session_id)
        session.tool_executions.append({
            "tool": tool_name,
            "details": details,
            "timestamp": int(time.time())
        })

    def clear_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_active_count(self) -> int:
        return len(self._sessions)

memory_manager = MemoryManager()
