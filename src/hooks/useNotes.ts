import { useState, useEffect, useCallback } from "react";
import {
  generateNotesApi,
  chatApi,
  generateQuizApi,
  clearMemoryApi,
  NoteStructure,
  QuizResult,
  AgentThought,
} from "../services/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolUsed?: string;
}

export function useNotes() {
  const [sessionId, setSessionId] = useState<string>(() => {
    const existing = localStorage.getItem("ai_notes_session_id");
    if (existing) return existing;
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("ai_notes_session_id", newId);
    return newId;
  });

  const [notes, setNotes] = useState<NoteStructure | null>(null);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("Initializing...");
  const [chatLoading, setChatLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentThoughts, setAgentThoughts] = useState<AgentThought[]>([]);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Generate new notes
  const generateNotes = useCallback(
    async (params: {
      topic: string;
      content?: string;
      length: "very_short" | "short" | "medium" | "detailed";
      subject?: string;
    }) => {
      setLoading(true);
      setError(null);
      setLoadingStep("Agent: Analyzing topic and study material...");

      const timer1 = setTimeout(() => {
        setLoadingStep("Agent: Selecting and executing tools (summarize_text & extract_key_points)...");
      }, 1200);

      const timer2 = setTimeout(() => {
        setLoadingStep("Agent: Synthesizing hierarchical notes via format_notes...");
      }, 2600);

      try {
        const response = await generateNotesApi({
          topic: params.topic,
          content: params.content,
          length: params.length,
          subject: params.subject,
          sessionId,
        });

        clearTimeout(timer1);
        clearTimeout(timer2);

        const newNote: NoteStructure = {
          title: response.title,
          overview: response.overview,
          key_points: response.key_points,
          important_terms: response.important_terms,
          examples: response.examples,
          summary: response.summary,
          reading_time_minutes: response.reading_time_minutes,
          subject_tag: response.subject_tag,
        };

        setNotes(newNote);
        setAgentThoughts(response.agent_thoughts || []);
        setToolsUsed(response.tools_used || []);
        setQuiz(null); // Reset quiz for new notes

        // Add welcome message to chat for this topic
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_u`,
            role: "user",
            content: `Created ${params.length} notes for: ${params.topic}`,
            timestamp: Date.now(),
          },
          {
            id: `msg_${Date.now()}_a`,
            role: "assistant",
            content: `I've synthesized your structured notes on **${response.title}**! You can ask me to make them shorter, add examples, explain any point, or test you with an active-recall quiz.`,
            timestamp: Date.now(),
          },
        ]);
      } catch (err: any) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setError(err.message || "Failed to generate notes. Please check input and try again.");
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  // Send message to conversational agent
  const sendChatMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: messageText.trim(),
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, userMsg]);
      setChatLoading(true);
      setError(null);

      try {
        const response = await chatApi({
          message: messageText.trim(),
          sessionId,
        });

        if (response.updatedNotes) {
          setNotes(response.updatedNotes);
        }

        if (response.quiz) {
          setQuiz(response.quiz);
        }

        if (response.agent_thoughts && response.agent_thoughts.length > 0) {
          setAgentThoughts((prev) => [...prev, ...response.agent_thoughts]);
        }

        if (response.tools_used && response.tools_used.length > 0) {
          setToolsUsed((prev) => Array.from(new Set([...prev, ...response.tools_used])));
        }

        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: response.reply,
          timestamp: Date.now(),
          toolUsed: response.tools_used?.[0],
        };

        setChatMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setError(`Chat error: ${err.message}`);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_err`,
            role: "assistant",
            content: `I encountered an issue processing your request: ${err.message}. Please try again.`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [sessionId]
  );

  // Generate quiz directly
  const loadQuiz = useCallback(async () => {
    setQuizLoading(true);
    setError(null);
    try {
      const result = await generateQuizApi({
        sessionId,
        topic: notes?.title || undefined,
        numMcqs: 4,
        numShortAnswer: 2,
      });
      setQuiz(result);
      setToolsUsed((prev) => Array.from(new Set([...prev, "generate_quiz"])));
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  }, [sessionId, notes]);

  // Quick action: make shorter, more detailed, add examples
  const triggerQuickAction = useCallback(
    (action: "shorter" | "detailed" | "examples" | "exam") => {
      const map = {
        shorter: "Make these notes shorter and more concise.",
        detailed: "Make these notes more detailed with deeper explanations.",
        examples: "Add 2 more real-world concrete examples to these notes.",
        exam: "Convert these notes into an ultra-high-yield exam cheat sheet with key formulas and mnemonics.",
      };
      sendChatMessage(map[action]);
    },
    [sendChatMessage]
  );

  // Reset session and clear memory
  const resetSession = useCallback(async () => {
    try {
      await clearMemoryApi(sessionId);
    } catch (e) {
      console.warn("Error clearing memory on server:", e);
    }

    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("ai_notes_session_id", newId);
    setSessionId(newId);
    setNotes(null);
    setQuiz(null);
    setAgentThoughts([]);
    setToolsUsed([]);
    setChatMessages([]);
    setError(null);
  }, [sessionId]);

  return {
    sessionId,
    notes,
    quiz,
    loading,
    loadingStep,
    chatLoading,
    quizLoading,
    error,
    agentThoughts,
    toolsUsed,
    chatMessages,
    generateNotes,
    sendChatMessage,
    loadQuiz,
    triggerQuickAction,
    resetSession,
    setNotes,
    clearError: () => setError(null),
  };
}
