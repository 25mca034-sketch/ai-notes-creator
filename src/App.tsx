import React, { useState } from "react";
import { useNotes } from "./hooks/useNotes";
import { NotesInput } from "./components/NotesInput";
import { NotesDisplay } from "./components/NotesDisplay";
import { ChatPanel } from "./components/ChatPanel";
import { QuizPanel } from "./components/QuizPanel";
import { Loading } from "./components/Loading";
import { AgentTraceInspector } from "./components/AgentTraceInspector";
import {
  Sparkles,
  Bot,
  BrainCircuit,
  RotateCcw,
  BookOpen,
  Award,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

export default function App() {
  const {
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
    clearError,
  } = useNotes();

  const [activeTab, setActiveTab] = useState<"notes" | "quiz">("notes");
  const [showInputSection, setShowInputSection] = useState(true);

  // When a quiz is loaded, switch tab to quiz
  const handleGenerateQuiz = async () => {
    setActiveTab("quiz");
    if (!quiz) {
      await loadQuiz();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  AI Notes Maker
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Agent Core
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Autonomous agent + modular tools + conversation memory
              </p>
            </div>
          </div>

          {/* Center Tabs if notes exist */}
          {notes && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "notes"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Notes</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("quiz");
                  if (!quiz) loadQuiz();
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "quiz"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Quiz & Recall</span>
                {quiz && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          )}

          {/* Right session info & reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mem: {sessionId.slice(0, 14)}...</span>
            </div>

            <button
              onClick={resetSession}
              title="Clear conversational memory and start a new session"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-2xl flex items-start justify-between gap-3 text-sm text-rose-200 shadow-xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Action Failed</p>
                <p className="text-xs text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Card */}
        {(!notes || showInputSection) && (
          <div className="space-y-4">
            {notes && (
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span>Generate notes for a new topic or source material</span>
                <button
                  onClick={() => setShowInputSection(false)}
                  className="text-indigo-400 hover:underline"
                >
                  Hide Input
                </button>
              </div>
            )}
            <NotesInput
              onGenerate={(params) => {
                generateNotes(params);
                setActiveTab("notes");
              }}
              isLoading={loading}
            />
          </div>
        )}

        {/* Collapsed Input toggle button if notes exist and input is hidden */}
        {notes && !showInputSection && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowInputSection(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Notes for Another Topic</span>
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && <Loading stepText={loadingStep} />}

        {/* Agent Inspector Trace */}
        {!loading && (
          <AgentTraceInspector
            thoughts={agentThoughts}
            toolsUsed={toolsUsed}
            sessionId={sessionId}
          />
        )}

        {/* Content Area with Split Layout for Chat */}
        {notes && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Main Column: Notes or Quiz */}
            <div className="lg:col-span-8 space-y-6">
              {activeTab === "notes" ? (
                <NotesDisplay
                  notes={notes}
                  onQuickAction={triggerQuickAction}
                  onGenerateQuiz={handleGenerateQuiz}
                  onRegenerate={() =>
                    generateNotes({
                      topic: notes.title,
                      length: "short",
                      subject: notes.subject_tag,
                    })
                  }
                  isLoading={chatLoading || quizLoading}
                />
              ) : quiz ? (
                <QuizPanel
                  quiz={quiz}
                  onRetake={loadQuiz}
                  isLoading={quizLoading}
                />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Active Recall Quiz</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Generate MCQs and short-answer questions created by the agent directly from your notes.
                  </p>
                  <button
                    onClick={loadQuiz}
                    disabled={quizLoading}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {quizLoading ? "Generating Quiz..." : "Generate Quiz Questions"}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Conversational Memory Chat Copilot */}
            <div className="lg:col-span-4 sticky top-24">
              <ChatPanel
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                isLoading={chatLoading}
                topic={notes.title}
                onClearMemory={resetSession}
              />
            </div>
          </div>
        )}

        {/* Empty State when no notes have been generated yet */}
        {!notes && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">AI Agent Architecture</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rather than direct single-prompt calls, the Notes Agent orchestrates a tool pipeline (summarize, extract, format) and evaluates synthesis quality.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Continuous Session Memory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Commands like &ldquo;Make it shorter&rdquo; or &ldquo;Add examples&rdquo; resolve against prior context without losing your topic or notes state.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Active Recall & Quizzes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically generate MCQs with explanations and short-answer self-testing questions to maximize retention and exam readiness.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>AI Notes Maker • Powered by Google Gemini 3.8 Flash • Agent + Tools + Memory</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Tools: summarize, extract, format, quiz</span>
            <span>•</span>
            <span>REST API v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
