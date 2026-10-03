from typing import List, Optional
from pydantic import BaseModel, Field

class TermItem(BaseModel):
    term: str = Field(description="Concept name, term, acronym or formula")
    definition: str = Field(description="Concise, memorable definition")

class ExampleItem(BaseModel):
    title: str = Field(description="Title of example or scenario")
    description: str = Field(description="Explanation of how the concept applies")

class GenerateNotesRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500, description="Topic of the notes")
    content: Optional[str] = Field(default="", max_length=50000, description="Optional raw text or study material")
    length: Optional[str] = Field(default="short", description="very_short, short, medium, or detailed")
    subject: Optional[str] = Field(default="General", description="Subject category")
    sessionId: Optional[str] = Field(default=None, description="Optional session tracking ID")

class NoteStructure(BaseModel):
    title: str
    overview: str
    key_points: List[str]
    important_terms: List[TermItem]
    examples: List[ExampleItem]
    summary: str
    reading_time_minutes: Optional[int] = 2
    subject_tag: Optional[str] = "General"

class AgentThought(BaseModel):
    step: str
    tool: Optional[str] = None
    thought: str
    timestamp: int

class GenerateNotesResponse(BaseModel):
    sessionId: str
    title: str
    overview: str
    key_points: List[str]
    important_terms: List[TermItem]
    examples: List[ExampleItem]
    summary: str
    reading_time_minutes: int
    subject_tag: str
    agent_thoughts: List[AgentThought]
    tools_used: List[str]

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    sessionId: str = Field(..., min_length=1)

class MCQQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correctAnswerIndex: int
    explanation: str

class ShortAnswerQuestion(BaseModel):
    id: str
    question: str
    sampleAnswer: str
    keyConcept: str

class QuizResult(BaseModel):
    title: str
    mcqs: List[MCQQuestion]
    short_answer: List[ShortAnswerQuestion]

class QuizRequest(BaseModel):
    sessionId: Optional[str] = None
    topic: Optional[str] = None
    numMcqs: Optional[int] = 4
    numShortAnswer: Optional[int] = 2

class ChatResponse(BaseModel):
    reply: str
    sessionId: str
    updatedNotes: Optional[NoteStructure] = None
    quiz: Optional[QuizResult] = None
    agent_thoughts: List[AgentThought]
    tools_used: List[str]

class HealthResponse(BaseModel):
    status: str
    version: str
    model: str
    agent: str
    tools: List[str]
    activeSessions: int
