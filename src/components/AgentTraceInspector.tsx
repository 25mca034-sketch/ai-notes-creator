import React, { useState } from "react";
import { AgentThought } from "../services/api";
import { Bot, Wrench, Brain, History, ChevronDown, ChevronUp, Clock, CheckCircle } from "lucide-react";

interface AgentTraceInspectorProps {
  thoughts: AgentThought[];
  toolsUsed: string[];
  sessionId: string;
}

export const AgentTraceInspector: React.FC<AgentTraceInspectorProps> = ({
  thoughts,
  toolsUsed,
  sessionId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thoughts || thoughts.length === 0) return null;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden mb-6 transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Agent Execution Trace</span>
              <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                {thoughts.length} steps
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tools invoked:{" "}
              {toolsUsed.length > 0 ? (
                toolsUsed.map((t) => (
                  <span key={t} className="inline-block mx-1 font-mono text-indigo-300 underline underline-offset-2">
                    {t}()
                  </span>
                ))
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{isOpen ? "Hide Architecture Log" : "View Agent Reasoning"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800/80 p-5 bg-slate-950/60 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/50">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Session ID: <span className="text-slate-200 font-semibold">{sessionId}</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Memory Synced
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {thoughts.map((item, idx) => {
              const isTool = item.step === "tool_invocation";
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isTool
                      ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-200"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {isTool ? (
                      <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                    ) : item.step === "intent_analysis" ? (
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                        Step {idx + 1}: {item.step} {item.tool ? `→ [${item.tool}]` : ""}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-200 leading-relaxed">{item.thought}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
