export interface TermItem {
  term: string;
  definition: string;
}

export interface ExampleItem {
  title: string;
  description: string;
}

export interface NoteStructure {
  title: string;
  overview: string;
  key_points: string[];
  important_terms: TermItem[];
  examples: ExampleItem[];
  summary: string;
  reading_time_minutes?: number;
  subject_tag?: string;
}

export interface AgentThought {
  step: string;
  tool?: string;
  thought: string;
  timestamp: number;
}

export interface GenerateNotesResponse {
  sessionId: string;
  title: string;
  overview: string;
  key_points: string[];
  important_terms: TermItem[];
  examples: ExampleItem[];
  summary: string;
  reading_time_minutes: number;
  subject_tag: string;
  agent_thoughts: AgentThought[];
  tools_used: string[];
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ShortAnswerQuestion {
  id: string;
  question: string;
  sampleAnswer: string;
  keyConcept: string;
}

export interface QuizResult {
  sessionId?: string;
  title: string;
  mcqs: MCQQuestion[];
  short_answer: ShortAnswerQuestion[];
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  updatedNotes?: NoteStructure | null;
  quiz?: QuizResult | null;
  agent_thoughts: AgentThought[];
  tools_used: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  model: string;
  agent: string;
  tools: string[];
  activeSessions: number;
}

const API_BASE = "";

export async function generateNotesApi(params: {
  topic: string;
  content?: string;
  length: "very_short" | "short" | "medium" | "detailed";
  subject?: string;
  sessionId: string;
}): Promise<GenerateNotesResponse> {
  const response = await fetch(`${API_BASE}/api/notes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to generate notes");
  }
  return data;
}

export async function chatApi(params: {
  message: string;
  sessionId: string;
}): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to send chat message");
  }
  return data;
}

export async function generateQuizApi(params: {
  sessionId: string;
  topic?: string;
  numMcqs?: number;
  numShortAnswer?: number;
}): Promise<QuizResult> {
  const response = await fetch(`${API_BASE}/api/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to generate quiz");
  }
  return data;
}

export async function clearMemoryApi(sessionId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/memory/${sessionId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function checkHealthApi(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    throw new Error("Backend service unreachable");
  }
  return response.json();
}
