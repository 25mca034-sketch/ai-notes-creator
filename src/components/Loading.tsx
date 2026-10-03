import React from "react";
import { Sparkles, Cpu, Layers, CheckCircle2 } from "lucide-react";

interface LoadingProps {
  stepText: string;
}

export const Loading: React.FC<LoadingProps> = ({ stepText }) => {
  const steps = [
    { label: "Topic & material intent analysis", icon: Cpu },
    { label: "Agent tool orchestration (summarize & extract)", icon: Layers },
    { label: "Hierarchical structuring & quality synthesis", icon: Sparkles },
  ];

  return (
    <div className="w-full bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center my-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Central rotating spinner */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 border-r-purple-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white tracking-tight mb-2">
        AI Agent at Work
      </h3>
      <p className="text-sm font-medium text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        {stepText}
      </p>

      {/* Pipeline progress steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-xl text-left">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300"
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Icon className="w-4 h-4" />
              </div>
              <span className="leading-snug">{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
