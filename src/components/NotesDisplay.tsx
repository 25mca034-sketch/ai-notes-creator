import React, { useState } from "react";
import { NoteStructure } from "../services/api";
import {
  BookOpen,
  CheckCircle,
  Copy,
  Download,
  ListOrdered,
  Tag,
  Lightbulb,
  FileCheck,
  Sparkles,
  Scissors,
  Maximize2,
  HelpCircle,
  Check,
  Search,
  Share2,
} from "lucide-react";

interface NotesDisplayProps {
  notes: NoteStructure;
  onQuickAction: (action: "shorter" | "detailed" | "examples" | "exam") => void;
  onGenerateQuiz: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export const NotesDisplay: React.FC<NotesDisplayProps> = ({
  notes,
  onQuickAction,
  onGenerateQuiz,
  onRegenerate,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});
  const [termSearch, setTermSearch] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);

  const togglePoint = (idx: number) => {
    setCheckedPoints((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedPointsCount = Object.values(checkedPoints).filter(Boolean).length;
  const totalPoints = notes.key_points.length;
  const masteryPercentage = totalPoints > 0 ? Math.round((completedPointsCount / totalPoints) * 100) : 0;

  // Format notes into pure markdown string
  const formatAsMarkdown = () => {
    let md = `# ${notes.title}\n\n`;
    if (notes.subject_tag) md += `**Subject:** ${notes.subject_tag} | **Reading Time:** ~${notes.reading_time_minutes || 2} min\n\n`;
    md += `## Overview\n${notes.overview}\n\n`;
    md += `## Key Points\n`;
    notes.key_points.forEach((kp) => {
      md += `- ${kp}\n`;
    });
    md += `\n## Important Terms\n`;
    notes.important_terms.forEach((t) => {
      md += `- **${t.term}**: ${t.definition}\n`;
    });
    if (notes.examples && notes.examples.length > 0) {
      md += `\n## Real-World Examples\n`;
      notes.examples.forEach((ex) => {
        md += `### ${ex.title}\n${ex.description}\n\n`;
      });
    }
    md += `## Summary\n${notes.summary}\n`;
    return md;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatAsMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Download files
  const handleDownload = (format: "md" | "json" | "txt") => {
    const filename = `${notes.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_notes.${format}`;
    let content = "";
    let mimeType = "text/plain";

    if (format === "json") {
      content = JSON.stringify(notes, null, 2);
      mimeType = "application/json";
    } else {
      content = formatAsMarkdown();
      mimeType = format === "md" ? "text/markdown" : "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadOpen(false);
  };

  const filteredTerms = notes.important_terms.filter((item) => {
    const q = termSearch.toLowerCase();
    return item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Action Toolbar Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Regenerate
          </button>

          <button
            onClick={() => onQuickAction("shorter")}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition-all flex items-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-pink-400" />
            Make Shorter
          </button>

          <button
            onClick={() => onQuickAction("detailed")}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition-all flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
            Make More Detailed
          </button>

          <button
            onClick={() => onQuickAction("examples")}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition-all flex items-center gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Add Examples
          </button>

          <button
            onClick={onGenerateQuiz}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 hover:border-emerald-500/80 text-xs font-semibold text-emerald-300 transition-all flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Generate Quiz
          </button>
        </div>

        {/* Copy & Export */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Notes</span>
              </>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setDownloadOpen(!downloadOpen)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-medium text-indigo-200 border border-indigo-500/40 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download</span>
            </button>

            {downloadOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-20 font-medium text-xs">
                <button
                  onClick={() => handleDownload("md")}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-indigo-600/20 hover:text-white flex items-center justify-between"
                >
                  <span>Markdown</span>
                  <span className="text-[10px] text-slate-500 font-mono">.md</span>
                </button>
                <button
                  onClick={() => handleDownload("json")}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-indigo-600/20 hover:text-white flex items-center justify-between"
                >
                  <span>JSON Schema</span>
                  <span className="text-[10px] text-slate-500 font-mono">.json</span>
                </button>
                <button
                  onClick={() => handleDownload("txt")}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-indigo-600/20 hover:text-white flex items-center justify-between"
                >
                  <span>Plain Text</span>
                  <span className="text-[10px] text-slate-500 font-mono">.txt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 1: Title & Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
              {notes.subject_tag || "General"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              ~{notes.reading_time_minutes || 2} min read
            </span>
          </div>

          {totalPoints > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Study Mastery:</span>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${masteryPercentage}%` }}
                />
              </div>
              <span className="font-mono text-emerald-400 font-semibold">{masteryPercentage}%</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
          {notes.title}
        </h1>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Executive Overview
          </span>
          <p className="text-slate-200 text-base leading-relaxed font-normal">
            {notes.overview}
          </p>
        </div>
      </div>

      {/* Card 2: Key Points */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Key Points & Core Concepts</h2>
              <p className="text-xs text-slate-400">Click checkboxes to mark concepts as reviewed</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            {completedPointsCount}/{totalPoints} mastered
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {notes.key_points.map((pt, idx) => {
            const isChecked = !!checkedPoints[idx];
            return (
              <div
                key={idx}
                onClick={() => togglePoint(idx)}
                className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start gap-3.5 select-none ${
                  isChecked
                    ? "bg-slate-950/40 border-emerald-500/30 text-slate-400 line-through"
                    : "bg-slate-950/70 border-slate-800/90 hover:border-indigo-500/40 text-slate-100 hover:bg-slate-900"
                }`}
              >
                <div
                  className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center transition-all ${
                    isChecked
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "border-slate-700 bg-slate-900 text-transparent hover:border-slate-500"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-sm leading-relaxed font-normal">
                  {pt}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Important Terms & Definitions */}
      {notes.important_terms && notes.important_terms.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Important Terms & Definitions</h2>
                <p className="text-xs text-slate-400">Essential terminology and vocabulary</p>
              </div>
            </div>

            {notes.important_terms.length > 3 && (
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={termSearch}
                  onChange={(e) => setTermSearch(e.target.value)}
                  placeholder="Filter terms..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {filteredTerms.map((termItem, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-sm font-bold text-purple-300 font-mono tracking-tight">
                    {termItem.term}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal pl-4">
                  {termItem.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card 4: Real-World Examples */}
      {notes.examples && notes.examples.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Illustrative & Practical Examples</h2>
              <p className="text-xs text-slate-400">Connecting abstract concepts to real-world scenarios</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {notes.examples.map((ex, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/30 transition-all space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 text-amber-300">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    Case {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">{ex.title}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {ex.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card 5: Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-purple-950/30 border border-indigo-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Summary & Memory Anchor</h2>
            <p className="text-xs text-indigo-300">The most important takeaway in 1-2 sentences</p>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 border border-indigo-500/20 p-4 rounded-2xl font-medium">
          {notes.summary}
        </p>
      </div>
    </div>
  );
};
