import { NoteStructure, QuizResult } from "./tools.js";

export interface MessageRecord {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  topic: string;
  subject?: string;
  length?: string;
  currentNotes: NoteStructure | null;
  currentQuiz: QuizResult | null;
  messages: MessageRecord[];
  toolUsageLog: Array<{
    tool: string;
    timestamp: number;
    inputSummary: string;
    status: "success" | "error";
  }>;
  createdAt: number;
  lastUpdatedAt: number;
}

class MemoryManager {
  private sessions: Map<string, SessionData> = new Map();

  /**
   * Get an existing session or initialize a fresh one
   */
  public getOrCreateSession(sessionId: string): SessionData {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        topic: "",
        currentNotes: null,
        currentQuiz: null,
        messages: [],
        toolUsageLog: [],
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Retrieve session if exists
   */
  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update active notes in session memory
   */
  public updateNotes(sessionId: string, topic: string, notes: NoteStructure, length?: string, subject?: string) {
    const session = this.getOrCreateSession(sessionId);
    session.topic = topic;
    session.currentNotes = notes;
    if (length) session.length = length;
    if (subject) session.subject = subject;
    session.lastUpdatedAt = Date.now();
  }

  /**
   * Update quiz in session memory
   */
  public updateQuiz(sessionId: string, quiz: QuizResult) {
    const session = this.getOrCreateSession(sessionId);
    session.currentQuiz = quiz;
    session.lastUpdatedAt = Date.now();
  }

  /**
   * Append a message to conversational history
   */
  public addMessage(sessionId: string, role: "user" | "assistant" | "system" | "tool", content: string, name?: string) {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push({
      role,
      content,
      name,
      timestamp: Date.now(),
    });
    session.lastUpdatedAt = Date.now();

    // Prevent unbounded memory growth by keeping last 30 turns
    if (session.messages.length > 30) {
      session.messages = session.messages.slice(-30);
    }
  }

  /**
   * Record tool invocation
   */
  public logToolExecution(sessionId: string, tool: string, inputSummary: string, status: "success" | "error" = "success") {
    const session = this.getOrCreateSession(sessionId);
    session.toolUsageLog.push({
      tool,
      timestamp: Date.now(),
      inputSummary,
      status,
    });
  }

  /**
   * Clear session memory
   */
  public clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Diagnostic statistics
   */
  public getStats() {
    return {
      activeSessions: this.sessions.size,
      allSessionIds: Array.from(this.sessions.keys()),
    };
  }
}

export const memoryManager = new MemoryManager();
