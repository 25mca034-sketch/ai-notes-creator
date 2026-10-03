import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { notesAgent } from "./server/agent.js";
import { memoryManager } from "./server/memory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "2mb" }));

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    const stats = memoryManager.getStats();
    res.json({
      status: "healthy",
      service: "AI Notes Maker API",
      version: "1.0.0",
      architecture: "Agent + Tools + Memory + Gemini LLM",
      model: "gemini-3.8-flash",
      agent: "NotesMakerAgent",
      tools: ["summarize_text", "extract_key_points", "format_notes", "generate_quiz"],
      activeSessions: stats.activeSessions,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Generate Notes endpoint
  app.post("/api/notes/generate", async (req: Request, res: Response) => {
    try {
      const { topic, content, length, subject, sessionId } = req.body;

      if (!topic && !content) {
        res.status(400).json({
          error: "Invalid input",
          message: "Please provide either a topic or study content.",
        });
        return;
      }

      if (content && typeof content === "string" && content.length > 50000) {
        res.status(400).json({
          error: "Input too large",
          message: "Input content exceeds the maximum limit of 50,000 characters. Please provide a shorter excerpt.",
        });
        return;
      }

      const validLengths = ["very_short", "short", "medium", "detailed"];
      const selectedLength = validLengths.includes(length) ? length : "short";

      const result = await notesAgent.generateNotes({
        topic: typeof topic === "string" ? topic : "",
        content: typeof content === "string" ? content : "",
        length: selectedLength as any,
        subject: typeof subject === "string" ? subject : "General",
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
      });

      // Response matching the prompt schema requirements
      res.json({
        sessionId: result.sessionId,
        title: result.notes.title,
        overview: result.notes.overview,
        key_points: result.notes.key_points,
        important_terms: result.notes.important_terms,
        examples: result.notes.examples,
        summary: result.notes.summary,
        reading_time_minutes: result.notes.reading_time_minutes || 2,
        subject_tag: result.notes.subject_tag || subject || "General",
        agent_thoughts: result.agentThoughts,
        tools_used: result.toolsUsed,
      });
    } catch (error: any) {
      console.error("Error in /api/notes/generate:", error);
      res.status(500).json({
        error: "Generation Failed",
        message: error.message || "An unexpected error occurred while generating notes.",
      });
    }
  });

  // Follow-up Chat endpoint with Memory
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, sessionId } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({
          error: "Invalid input",
          message: "A chat message is required.",
        });
        return;
      }

      if (!sessionId || typeof sessionId !== "string") {
        res.status(400).json({
          error: "Invalid session",
          message: "A valid sessionId is required to maintain conversation memory.",
        });
        return;
      }

      const result = await notesAgent.handleChat({
        message: message.trim(),
        sessionId: sessionId.trim(),
      });

      res.json({
        reply: result.reply,
        sessionId: result.sessionId,
        updatedNotes: result.updatedNotes || null,
        quiz: result.quiz || null,
        agent_thoughts: result.agentThoughts,
        tools_used: result.toolsUsed,
      });
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({
        error: "Chat Processing Failed",
        message: error.message || "Failed to process chat conversation.",
      });
    }
  });

  // Quiz generation endpoint
  app.post("/api/quiz", async (req: Request, res: Response) => {
    try {
      const { sessionId, topic, numMcqs, numShortAnswer } = req.body;

      const result = await notesAgent.generateQuiz({
        sessionId,
        topic,
        numMcqs: typeof numMcqs === "number" ? numMcqs : 4,
        numShortAnswer: typeof numShortAnswer === "number" ? numShortAnswer : 2,
      });

      res.json({
        sessionId: result.sessionId,
        title: result.quiz.title,
        mcqs: result.quiz.mcqs,
        short_answer: result.quiz.short_answer,
      });
    } catch (error: any) {
      console.error("Error in /api/quiz:", error);
      res.status(500).json({
        error: "Quiz Generation Failed",
        message: error.message || "Failed to generate quiz.",
      });
    }
  });

  // Clear Session Memory endpoint
  app.delete("/api/memory/:sessionId", (req: Request, res: Response) => {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId parameter" });
      return;
    }

    const deleted = memoryManager.clearSession(sessionId);
    res.json({
      success: true,
      sessionId,
      cleared: deleted,
      message: deleted
        ? `Conversation memory successfully cleared for session ${sessionId}.`
        : `Session ${sessionId} was already empty or not found.`,
    });
  });

  // Retrieve current session status
  app.get("/api/session/:sessionId", (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = memoryManager.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found", sessionId });
      return;
    }

    res.json({
      sessionId: session.sessionId,
      topic: session.topic,
      subject: session.subject,
      length: session.length,
      hasNotes: !!session.currentNotes,
      hasQuiz: !!session.currentQuiz,
      messageCount: session.messages.length,
      toolExecutions: session.toolUsageLog,
      createdAt: session.createdAt,
      lastUpdatedAt: session.lastUpdatedAt,
    });
  });

  // Mount Vite or static file serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI Notes Maker server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
