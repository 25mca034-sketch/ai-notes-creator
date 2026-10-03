import React, { useState } from "react";
import { QuizResult, MCQQuestion, ShortAnswerQuestion } from "../services/api";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Award,
  Sparkles,
  Check,
  ChevronRight,
} from "lucide-react";

interface QuizPanelProps {
  quiz: QuizResult;
  onRetake: () => void;
  isLoading: boolean;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({ quiz, onRetake, isLoading }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedShort, setRevealedShort] = useState<Record<string, boolean>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [selfGradedShort, setSelfGradedShort] = useState<Record<string, "correct" | "review">>({});

  const handleSelectMCQ = (questionId: string, optionIdx: number) => {
    // Only allow selecting once per question
    if (selectedAnswers[questionId] !== undefined) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const toggleRevealShort = (questionId: string) => {
    setRevealedShort((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSelfGrade = (questionId: string, status: "correct" | "review") => {
    setSelfGradedShort((prev) => ({
      ...prev,
      [questionId]: status,
    }));
  };

  // Calculate score
  let mcqCorrectCount = 0;
  quiz.mcqs.forEach((mcq) => {
    if (selectedAnswers[mcq.id] === mcq.correctAnswerIndex) {
      mcqCorrectCount++;
    }
  });

  const mcqAnsweredCount = Object.keys(selectedAnswers).length;
  const shortSelfGradedCount = Object.values(selfGradedShort).filter((s) => s === "correct").length;
  const totalQuestions = quiz.mcqs.length + quiz.short_answer.length;
  const totalScore = mcqCorrectCount + shortSelfGradedCount;

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Active Recall
              </span>
              <span className="text-xs text-slate-400">
                {quiz.mcqs.length} MCQs + {quiz.short_answer.length} Short Answer
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">{quiz.title}</h2>
          </div>
        </div>

        {/* Score & Retake */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 text-xs">
            <span className="text-slate-400">Score:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {totalScore} / {totalQuestions}
            </span>
          </div>

          <button
            onClick={() => {
              setSelectedAnswers({});
              setRevealedShort({});
              setShortAnswers({});
              setSelfGradedShort({});
              onRetake();
            }}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Questions
          </button>
        </div>
      </div>

      {/* Section 1: Multiple Choice Questions */}
      {quiz.mcqs.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">
              1
            </span>
            Multiple Choice Questions
          </h3>

          <div className="space-y-6">
            {quiz.mcqs.map((mcq, idx) => {
              const selectedOpt = selectedAnswers[mcq.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = isAnswered && selectedOpt === mcq.correctAnswerIndex;

              return (
                <div
                  key={mcq.id}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      <span className="text-indigo-400 mr-2">Q{idx + 1}.</span>
                      {mcq.question}
                    </p>
                    {isAnswered && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                          isCorrect
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {mcq.options.map((opt, optIdx) => {
                      const isThisSelected = selectedOpt === optIdx;
                      const isThisCorrect = optIdx === mcq.correctAnswerIndex;

                      let optClass = "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60";
                      if (isAnswered) {
                        if (isThisCorrect) {
                          optClass = "bg-emerald-950/40 border-emerald-500 text-emerald-200";
                        } else if (isThisSelected) {
                          optClass = "bg-rose-950/40 border-rose-500 text-rose-200";
                        } else {
                          optClass = "bg-slate-950/30 border-slate-800 text-slate-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectMCQ(mcq.id, optIdx)}
                          disabled={isAnswered}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-start gap-2.5 ${optClass} ${
                            !isAnswered ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation drawer when answered */}
                  {isAnswered && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-normal space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block font-mono">
                        Explanation:
                      </span>
                      <p>{mcq.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Short-Answer Self-Test Questions */}
      {quiz.short_answer.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-mono">
              2
            </span>
            Conceptual & Short-Answer Questions
          </h3>

          <div className="space-y-6">
            {quiz.short_answer.map((sa, idx) => {
              const isRevealed = !!revealedShort[sa.id];
              const grade = selfGradedShort[sa.id];

              return (
                <div
                  key={sa.id}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      <span className="text-purple-400 mr-2">Q{idx + 1}.</span>
                      {sa.question}
                    </p>
                    <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                      {sa.keyConcept}
                    </span>
                  </div>

                  {/* User answer input */}
                  <textarea
                    rows={2}
                    placeholder="Type your answer to practice active recall (optional)..."
                    value={shortAnswers[sa.id] || ""}
                    onChange={(e) =>
                      setShortAnswers((prev) => ({ ...prev, [sa.id]: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />

                  {/* Reveal model answer button */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleRevealShort(sa.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-300 border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      {isRevealed ? "Hide Model Answer" : "Reveal Model Answer"}
                    </button>

                    {isRevealed && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Self Grade:</span>
                        <button
                          type="button"
                          onClick={() => handleSelfGrade(sa.id, "correct")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            grade === "correct"
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400"
                          }`}
                        >
                          Got it right (+1)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelfGrade(sa.id, "review")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            grade === "review"
                              ? "bg-amber-500/20 border-amber-500 text-amber-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400"
                          }`}
                        >
                          Need Review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Model answer drawer */}
                  {isRevealed && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-purple-300 font-semibold font-mono text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" /> Model Sample Answer:
                      </div>
                      <p className="leading-relaxed font-normal">{sa.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
