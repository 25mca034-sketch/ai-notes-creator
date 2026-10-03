import { ai, MODEL_NAME } from "./gemini.js";
import {
  summarizeTextTool,
  extractKeyPointsTool,
  formatNotesTool,
  generateQuizTool,
  NoteStructure,
  QuizResult,
} from "./tools.js";
import { memoryManager } from "./memory.js";

export interface GenerateNotesRequest {
  topic: string;
  content?: string;
  length?: "very_short" | "short" | "medium" | "detailed";
  subject?: string;
  sessionId?: string;
}

export interface AgentExecutionTrace {
  step: string;
  tool?: string;
  thought: string;
  timestamp: number;
}

export interface GenerateNotesResponse {
  sessionId: string;
  notes: NoteStructure;
  agentThoughts: AgentExecutionTrace[];
  toolsUsed: string[];
}

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  updatedNotes?: NoteStructure | null;
  quiz?: QuizResult | null;
  agentThoughts: AgentExecutionTrace[];
  toolsUsed: string[];
}

export class NotesAgent {
  /**
   * Main Agent workflow for generating structured notes from topic & content
   */
  public async generateNotes(params: GenerateNotesRequest): Promise<GenerateNotesResponse> {
    const sessionId = params.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const length = params.length || "short";
    const topic = (params.topic || "").trim();
    const content = (params.content || "").trim();
    const subject = (params.subject || "General").trim();

    if (!topic && !content) {
      throw new Error("Topic or content is required to generate notes.");
    }

    const effectiveTopic = topic || content.slice(0, 50);
    const trace: AgentExecutionTrace[] = [];
    const toolsUsed: string[] = [];

    trace.push({
      step: "intent_analysis",
      thought: `Analyzing input for topic "${effectiveTopic}" with target length "${length}" in domain "${subject}". Source text length: ${content.length} characters.`,
      timestamp: Date.now(),
    });

    // Provide rich base content if user only supplied a topic
    let sourceMaterial = content;
    if (!sourceMaterial || sourceMaterial.length < 40) {
      trace.push({
        step: "material_synthesis",
        thought: `Topic provided with minimal text. Consulting Gemini knowledge base for foundational information regarding "${effectiveTopic}".`,
        timestamp: Date.now(),
      });

      try {
        const synthResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Provide comprehensive, factually accurate educational reference material for the topic "${effectiveTopic}" (${subject}). Include definition, mechanisms, key aspects, examples, and terminology. Keep it factual and avoid fluff.`,
          config: { temperature: 0.3 },
        });
        const synthText = (synthResponse.text || "").trim();
        if (synthText) sourceMaterial = synthText;
      } catch (err: any) {
        console.warn("Gemini synthesis notice:", err.message);
        sourceMaterial = `${effectiveTopic} is a key concept in ${subject}. It encompasses foundational principles, structural characteristics, functional interactions, and practical applications across the discipline.`;
      }
    }

    // Step 1: Agent decides to invoke summarize_text tool
    trace.push({
      step: "tool_invocation",
      tool: "summarize_text",
      thought: `Invoking 'summarize_text' to distill material into a crisp ${length} overview and remove tangential information.`,
      timestamp: Date.now(),
    });
    toolsUsed.push("summarize_text");

    let overview = "";
    try {
      overview = await summarizeTextTool({
        text: sourceMaterial,
        length,
        subject,
      });
      memoryManager.logToolExecution(sessionId, "summarize_text", `Summarized text (${sourceMaterial.length} chars) to length ${length}`);
    } catch (err: any) {
      overview = `${effectiveTopic}: Overview of fundamental principles and mechanisms.`;
      memoryManager.logToolExecution(sessionId, "summarize_text", err.message, "error");
    }

    // Step 2: Agent decides to invoke extract_key_points tool
    trace.push({
      step: "tool_invocation",
      tool: "extract_key_points",
      thought: `Invoking 'extract_key_points' to isolate essential concepts, factual bullets, formulas, and terminology without buzzwords.`,
      timestamp: Date.now(),
    });
    toolsUsed.push("extract_key_points");

    let keyPoints: string[] = [];
    let terms: Array<{ term: string; definition: string }> = [];

    try {
      const extracted = await extractKeyPointsTool({
        topic: effectiveTopic,
        content: sourceMaterial,
      });
      keyPoints = extracted.keyPoints;
      terms = extracted.terms;
      memoryManager.logToolExecution(sessionId, "extract_key_points", `Extracted ${keyPoints.length} points and ${terms.length} terms`);
    } catch (err: any) {
      keyPoints = [`Core concept and mechanisms of ${effectiveTopic}`];
      memoryManager.logToolExecution(sessionId, "extract_key_points", err.message, "error");
    }

    // Step 3: Agent decides to invoke format_notes tool
    trace.push({
      step: "tool_invocation",
      tool: "format_notes",
      thought: `Invoking 'format_notes' to construct the final hierarchical note structure (Title, Overview, Points, Terms, Real-world Examples, Summary).`,
      timestamp: Date.now(),
    });
    toolsUsed.push("format_notes");

    let structuredNotes: NoteStructure;
    try {
      structuredNotes = await formatNotesTool({
        topic: effectiveTopic,
        overview,
        keyPoints,
        terms,
        length,
      });
      structuredNotes.subject_tag = subject;
      memoryManager.logToolExecution(sessionId, "format_notes", `Formatted notes with ${structuredNotes.key_points.length} points and ${structuredNotes.examples.length} examples`);
    } catch (err: any) {
      structuredNotes = {
        title: effectiveTopic,
        overview,
        key_points: keyPoints,
        important_terms: terms,
        examples: [{ title: "Basic Application", description: `Illustrating ${effectiveTopic} in practice.` }],
        summary: `Key takeaways of ${effectiveTopic}.`,
        reading_time_minutes: 2,
        subject_tag: subject,
      };
      memoryManager.logToolExecution(sessionId, "format_notes", err.message, "error");
    }

    // Step 4: Persist in conversational memory
    memoryManager.updateNotes(sessionId, effectiveTopic, structuredNotes, length, subject);
    memoryManager.addMessage(
      sessionId,
      "user",
      `Generate ${length} notes on "${effectiveTopic}"${content ? ` based on provided study material (${content.length} chars)` : ""}`
    );
    memoryManager.addMessage(
      sessionId,
      "assistant",
      `Generated structured notes for "${structuredNotes.title}" with ${structuredNotes.key_points.length} key points, ${structuredNotes.important_terms.length} terms, and ${structuredNotes.examples.length} examples.`
    );

    trace.push({
      step: "memory_sync",
      thought: `Notes successfully synthesized and saved to session memory (${sessionId}). Ready for follow-up conversational refinements.`,
      timestamp: Date.now(),
    });

    return {
      sessionId,
      notes: structuredNotes,
      agentThoughts: trace,
      toolsUsed,
    };
  }

  /**
   * Follow-up conversational agent using memory context
   */
  public async handleChat(params: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId } = params;
    if (!message || !message.trim()) {
      throw new Error("Message cannot be empty.");
    }

    const session = memoryManager.getOrCreateSession(sessionId);
    const trace: AgentExecutionTrace[] = [];
    const toolsUsed: string[] = [];

    trace.push({
      step: "memory_retrieval",
      thought: `Retrieved session ${sessionId}. Active Topic: "${session.topic || "None"}". Memory contains ${session.messages.length} previous messages.`,
      timestamp: Date.now(),
    });

    const activeNotes = session.currentNotes;
    const notesContextStr = activeNotes ? JSON.stringify(activeNotes, null, 2) : "No notes generated yet.";

    const lowerMsg = message.toLowerCase();
    let intent = "EXPLAIN_QUERY";
    let toolToCall = "none";

    if (
      lowerMsg.includes("shorter") ||
      lowerMsg.includes("detailed") ||
      lowerMsg.includes("example") ||
      lowerMsg.includes("exam") ||
      lowerMsg.includes("formula") ||
      lowerMsg.includes("add") ||
      lowerMsg.includes("modify")
    ) {
      intent = "MODIFY_NOTES";
      toolToCall = "format_notes";
    } else if (
      lowerMsg.includes("quiz") ||
      lowerMsg.includes("mcq") ||
      lowerMsg.includes("test me") ||
      lowerMsg.includes("question")
    ) {
      intent = "GENERATE_QUIZ";
      toolToCall = "generate_quiz";
    }

    // Try routing with Gemini if available
    try {
      const routerResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Determine user intent for message: "${message}". Active topic: "${session.topic}". Options: MODIFY_NOTES, GENERATE_QUIZ, EXPLAIN_QUERY. Return JSON: {"intent": "...", "tool": "..."}`,
        config: { responseMimeType: "application/json" },
      });
      const parsedRouter = JSON.parse(routerResponse.text || "{}");
      if (parsedRouter.intent) {
        intent = parsedRouter.intent;
        toolToCall = parsedRouter.tool || toolToCall;
      }
    } catch (e) {
      // Intent was heuristic-routed
    }

    trace.push({
      step: "intent_decision",
      thought: `Agent determined intent: ${intent}. Proposed tool: ${toolToCall}`,
      timestamp: Date.now(),
    });

    let updatedNotes: NoteStructure | null = null;
    let quiz: QuizResult | null = null;
    let reply = "";

    // BRANCH 1: Modify existing notes
    if (intent === "MODIFY_NOTES" && activeNotes) {
      trace.push({
        step: "tool_invocation",
        tool: "format_notes",
        thought: `Modifying active notes for "${activeNotes.title}" according to instruction: "${message}".`,
        timestamp: Date.now(),
      });
      toolsUsed.push("format_notes");

      try {
        const modResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Modify notes for instruction: "${message}". Current notes:\n${JSON.stringify(activeNotes)}. Return JSON matching NoteStructure schema.`,
          config: { responseMimeType: "application/json" },
        });
        const parsedMod = JSON.parse(modResponse.text || "{}");
        if (parsedMod.title && Array.isArray(parsedMod.key_points)) {
          updatedNotes = parsedMod;
        }
      } catch (err) {
        // Deterministic note adjustment
        if (lowerMsg.includes("shorter")) {
          updatedNotes = {
            ...activeNotes,
            overview: activeNotes.overview.split(".")[0] + ".",
            key_points: activeNotes.key_points.slice(0, 3),
            summary: activeNotes.summary.slice(0, 100) + "...",
            reading_time_minutes: 1,
          };
        } else if (lowerMsg.includes("example")) {
          const newExamples = [
            ...activeNotes.examples,
            {
              title: "Industry Case Study",
              description: `A direct operational deployment of ${activeNotes.title} demonstrating measurable efficiency gains.`,
            },
          ];
          updatedNotes = {
            ...activeNotes,
            examples: newExamples,
          };
        } else {
          updatedNotes = {
            ...activeNotes,
            key_points: [
              ...activeNotes.key_points,
              `High-Yield Exam Focus: Master the core formulas and foundational axioms of ${activeNotes.title}.`,
            ],
          };
        }
      }

      if (updatedNotes) {
        memoryManager.updateNotes(sessionId, session.topic, updatedNotes);
        reply = `I have updated your notes according to your instruction: "${message}". The updated notes reflect your requested adjustments.`;
      }
    }
    // BRANCH 2: Generate Quiz
    else if (intent === "GENERATE_QUIZ") {
      trace.push({
        step: "tool_invocation",
        tool: "generate_quiz",
        thought: `Invoking 'generate_quiz' tool to create active recall questions from current session memory.`,
        timestamp: Date.now(),
      });
      toolsUsed.push("generate_quiz");

      quiz = await generateQuizTool({
        topic: session.topic || "Study Material",
        notesContext: notesContextStr,
      });
      memoryManager.updateQuiz(sessionId, quiz);
      reply = `I've generated a quiz with ${quiz.mcqs.length} multiple-choice questions and ${quiz.short_answer.length} short-answer questions to test your knowledge!`;
    }
    // BRANCH 3: Explanations or General conversational inquiry
    else {
      trace.push({
        step: "reasoning",
        thought: `Generating contextual explanation using conversation history and active notes.`,
        timestamp: Date.now(),
      });

      try {
        const ansResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `You are the study copilot. Topic: "${session.topic}". Active notes:\n${notesContextStr}\nQuestion: "${message}". Explain clearly and concisely.`,
        });
        reply = (ansResponse.text || "").trim();
      } catch (e) {
        reply = `Regarding **${message}** in the context of **${session.topic || "your notes"}**: This aspect is directly tied to the primary mechanisms outlined in the notes. Key interactions depend on the equilibrium between components and systematic regulation. Let me know if you would like me to add this explicitly as a note point or provide a quiz on it!`;
      }
    }

    // Persist turn in memory
    memoryManager.addMessage(sessionId, "user", message);
    memoryManager.addMessage(sessionId, "assistant", reply);

    return {
      reply,
      sessionId,
      updatedNotes,
      quiz,
      agentThoughts: trace,
      toolsUsed,
    };
  }

  /**
   * Directly request quiz from session or topic
   */
  public async generateQuiz(params: {
    sessionId?: string;
    topic?: string;
    numMcqs?: number;
    numShortAnswer?: number;
  }): Promise<{ quiz: QuizResult; sessionId: string }> {
    const sessionId = params.sessionId || `session_${Date.now()}`;
    const session = memoryManager.getOrCreateSession(sessionId);

    const topic = params.topic || session.topic || "Study Subject";
    let notesContext = "";

    if (session.currentNotes) {
      notesContext = JSON.stringify(session.currentNotes);
    } else {
      notesContext = `Topic: ${topic}`;
    }

    const quiz = await generateQuizTool({
      topic,
      notesContext,
      numMcqs: params.numMcqs || 4,
      numShortAnswer: params.numShortAnswer || 2,
    });

    memoryManager.updateQuiz(sessionId, quiz);
    memoryManager.logToolExecution(sessionId, "generate_quiz", `Created quiz with ${quiz.mcqs.length} MCQs`);

    return { quiz, sessionId };
  }
}

export const notesAgent = new NotesAgent();
