# AI Notes Maker 📝⚡

A production-ready, full-stack **AI Notes Maker** web application engineered with an **Agent + Tools + Memory + Gemini LLM** architecture. Rather than relying on simple direct model prompts, this system orchestrates modular tools (`summarize_text`, `extract_key_points`, `format_notes`, `generate_quiz`), maintains multi-turn session memory context, and produces concise, structured study notes and active-recall quizzes.

---

## 🏛️ System Architecture

```
                          [ User / Browser ]
                                  │
                                  ▼
                        [ React + Vite SPA ]
                  (NotesInput, Display, Chat, Quiz)
                                  │
                       POST /api/* (session_id)
                                  │
                                  ▼
                 [ FastAPI / Express API Server ]
                                  │
                                  ▼
                       [ Notes Maker Agent ]
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
     [ Modular Tools ]     [ Session Memory ]    [ Gemini 3.8 Flash ]
  • summarize_text          • Active Notes         • Structured JSON
  • extract_key_points      • Turn History         • Reasoning & Synthesis
  • format_notes            • Tool Invocations
  • generate_quiz           • Context Pruning
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ▼
                   [ Structured Study Notes & Quiz ]
                                  │
                                  ▼
                         [ Frontend Render ]
```

---

## 🛠️ Technologies

### Backend
- **Python 3.10+ / FastAPI** (in `/backend`): Pydantic v2 schemas, REST endpoints, modular tool execution, CORS.
- **Node.js / Express + tsx** (server-side runtime): `@google/genai` TypeScript SDK, Vite dev middlewares.
- **Google Gemini API**: `gemini-3.8-flash` with structured outputs (`responseSchema`), zero-hallucination factual guardrails.

### Frontend
- **React 19** with **Vite** & **TypeScript**
- **Tailwind CSS v4** for responsive, dark-mode design
- **Lucide React** icons
- **Active-Recall Quiz Engine**: Interactive MCQs with immediate feedback + Short-answer self-testing.
- **Agent Trace Inspector**: Visualizes real-time agent reasoning steps and tool execution.

---

## ✨ Features

1. **Autonomous Agent Pipeline**:
   - Analyzes intent, extracts high-yield facts, discards fluff, and formats into standardized cards.
2. **Four Modular Tools**:
   - `summarize_text`: Distills text into very short, short, medium, or detailed overviews.
   - `extract_key_points`: Extracts hierarchical bullets, terminology, and definitions.
   - `format_notes`: Assembles Title, Overview, Key Points, Terms, Examples, Summary, and Reading Time.
   - `generate_quiz`: Creates MCQs with explanations and short-answer questions.
3. **Conversational Session Memory**:
   - Preserves active notes and conversation turns.
   - Understands pronouns and follow-up requests ("*Make it shorter*", "*Explain point 3*", "*Add 2 examples*", "*Convert to exam sheet*").
4. **Rich Export & Study Tools**:
   - Copy notes as Markdown or plain text.
   - Download notes as `.md`, `.json`, or `.txt`.
   - Track active study progress by checking off mastered key points.
   - Interactive vocabulary glossary with instant search.

---

## 📁 Repository Structure

```
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py                # FastAPI entry point & routes
│   │   ├── config.py              # Environment configuration
│   │   ├── api/                   # REST API routes (notes, chat, quiz)
│   │   │   ├── notes.py
│   │   │   ├── chat.py
│   │   │   └── quiz.py
│   │   ├── agents/                # Agent orchestration & prompts
│   │   │   ├── notes_agent.py
│   │   │   ├── prompts.py
│   │   │   └── state.py
│   │   ├── tools/                 # Modular tool layer
│   │   │   ├── summarize.py
│   │   │   ├── key_points.py
│   │   │   ├── formatter.py
│   │   │   └── quiz.py
│   │   ├── memory/                # Multi-turn session memory
│   │   │   └── memory_manager.py
│   │   ├── models/                # Pydantic data schemas
│   │   │   └── schemas.py
│   │   └── services/              # Gemini SDK client
│   │       └── gemini.py
│   ├── tests/                     # Unit and integration tests
│   │   ├── test_api.py
│   │   └── test_agent.py
│   ├── requirements.txt
│   └── .env.example
├── server/                        # Node.js Server Agent & Tools
│   ├── agent.ts                   # Agent orchestration logic
│   ├── tools.ts                   # Tool implementations
│   ├── memory.ts                  # Memory manager
│   └── gemini.ts                  # GoogleGenAI client
├── src/                           # React Frontend
│   ├── components/
│   │   ├── NotesInput.tsx         # Topic and study material input
│   │   ├── NotesDisplay.tsx       # Structured card rendering & export
│   │   ├── ChatPanel.tsx          # Conversational memory assistant
│   │   ├── QuizPanel.tsx          # Active-recall MCQ & short-answer
│   │   ├── Loading.tsx            # Animated agent pipeline indicator
│   │   └── AgentTraceInspector.tsx# Agent reasoning & tool viewer
│   ├── services/
│   │   └── api.ts                 # Typed fetch client
│   ├── hooks/
│   │   └── useNotes.ts            # State management hook
│   ├── App.tsx                    # Main app container
│   └── main.tsx                   # React root
├── server.ts                      # Full-stack server entry point
├── package.json
└── README.md
```

---

## 🚀 Running the Application

### 1. Environment Setup

Create your environment configuration with your Gemini API key:

```bash
# In root directory or backend/.env:
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Running with Node.js Full-Stack Server (Port 3000)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:3000`.

### 3. Running with Python FastAPI Backend (Port 8000)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run FastAPI with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Run tests:
```bash
pytest tests/
```

---

## 📡 API Documentation

### 1. Generate Notes
`POST /api/notes/generate`

**Request:**
```json
{
  "topic": "Photosynthesis",
  "content": "Photosynthesis is the process by which green plants...",
  "length": "short",
  "subject": "Biology",
  "sessionId": "sess_123"
}
```

**Response:**
```json
{
  "sessionId": "sess_123",
  "title": "Photosynthesis",
  "overview": "Process by which plants convert sunlight, water, and CO2 into glucose and oxygen.",
  "key_points": [
    "Light reactions occur in the thylakoid membranes.",
    "Calvin cycle fixes CO2 into carbohydrates in the stroma."
  ],
  "important_terms": [
    { "term": "Chlorophyll", "definition": "Green pigment absorbing solar radiation." }
  ],
  "examples": [
    { "title": "Forest Canopy", "description": "High-surface leaves maximizing photon capture." }
  ],
  "summary": "Foundational biological process sustaining atmospheric oxygen and terrestrial energy.",
  "reading_time_minutes": 2,
  "agent_thoughts": [ ... ],
  "tools_used": ["summarize_text", "extract_key_points", "format_notes"]
}
```

### 2. Follow-up Chat with Memory
`POST /api/chat`

**Request:**
```json
{
  "message": "Make it shorter and add 1 more example.",
  "sessionId": "sess_123"
}
```

**Response:**
```json
{
  "reply": "I have updated your notes according to your request...",
  "sessionId": "sess_123",
  "updatedNotes": { ... },
  "tools_used": ["format_notes"]
}
```

### 3. Active-Recall Quiz
`POST /api/quiz`

**Request:**
```json
{
  "sessionId": "sess_123",
  "topic": "Photosynthesis",
  "numMcqs": 4,
  "numShortAnswer": 2
}
```

### 4. Clear Session Memory
`DELETE /api/memory/:sessionId`

---

## 🛡️ Security & Reliability

- **Server-Side API Key Storage**: The `GEMINI_API_KEY` is strictly held on the server and is never exposed to browser client bundles.
- **Input Validation**: Request size constraints (maximum 50,000 characters) and Pydantic validation prevent buffer bloat and denial of service.
- **Fail-safe Error Handling**: Model formatting errors trigger deterministic fallback parsing to guarantee clean user feedback without application crashes.
