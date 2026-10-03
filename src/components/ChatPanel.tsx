import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../hooks/useNotes";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Wrench,
  HelpCircle,
  Minimize2,
  Maximize2,
  Trash2,
} from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  topic?: string;
  onClearMemory: () => void;
}

const QUICK_PROMPTS = [
  "Make these notes shorter.",
  "Explain point 2 in simpler terms.",
  "Add 2 more real-world examples.",
  "Convert this into exam cram notes.",
  "Create 5 MCQs on this topic.",
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  topic,
  onClearMemory,
}) => {
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleQuickClick = (promptText: string) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  return (
    <div
      className={`bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col transition-all duration-200 overflow-hidden ${
        minimized ? "h-16" : "h-[620px]"
      }`}
    >
      {/* Panel Header */}
      <div className="p-4 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Agent Chat & Memory</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              {topic ? (
                <span>
                  Context: <strong className="text-indigo-300">{topic}</strong>
                </span>
              ) : (
                "Conversational memory connected"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClearMemory}
            title="Reset Session Memory"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">Continuous Memory Copilot</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Ask questions, refine notes, request more examples, or generate flash questions. The agent remembers the current notes.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${
                        isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 border border-slate-700 text-indigo-400"
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                          : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {msg.toolUsed && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono mb-1">
                          <Wrench className="w-2.5 h-2.5" /> Tool: {msg.toolUsed}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-indigo-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Agent is reasoning and consulting memory...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/30">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickClick(qp)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors flex-shrink-0"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Make it shorter, add examples, explain point 3..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-2.5 rounded-xl transition-all ${
                isLoading || !input.trim()
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-95"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
