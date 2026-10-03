import React, { useState } from "react";
import { Sparkles, BookOpen, Clock, FileText, Wand2, RefreshCw } from "lucide-react";

interface NotesInputProps {
  onGenerate: (params: {
    topic: string;
    content: string;
    length: "very_short" | "short" | "medium" | "detailed";
    subject: string;
  }) => void;
  isLoading: boolean;
}

const SAMPLE_TOPICS = [
  {
    topic: "Photosynthesis",
    subject: "Biology",
    snippet: "Photosynthesis is the biological process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds like glucose. The process takes place in chloroplasts through light-dependent reactions in thylakoid membranes and light-independent reactions (Calvin cycle) in the stroma.",
  },
  {
    topic: "Transformer Neural Networks",
    subject: "Computer Science",
    snippet: "The Transformer architecture was introduced in the 2017 paper 'Attention Is All You Need'. Unlike recurrent neural networks that process sequential data step-by-step, Transformers rely exclusively on self-attention mechanisms to compute representations of input and output without sequence-aligned RNNs or convolution. Key components include Multi-Head Self-Attention, Positional Encoding, and Feed-Forward Networks.",
  },
  {
    topic: "CRISPR-Cas9 Gene Editing",
    subject: "Genetics & Medicine",
    snippet: "CRISPR-Cas9 is a molecular technology adapted from the natural defense mechanism of bacteria against invading bacteriophages. It utilizes a guide RNA (gRNA) complementary to a target DNA sequence and a Cas9 endonuclease enzyme that creates double-strand breaks at the targeted genomic site, enabling precise gene knockouts, insertions, and repairs.",
  },
  {
    topic: "Supply and Demand Economics",
    subject: "Economics",
    snippet: "The law of supply and demand describes how prices vary based on the balance between product availability and consumer desire. When demand increases and supply remains unchanged, prices rise leading to higher equilibrium price. Conversely, increased supply with constant demand drives prices downward.",
  },
];

const SUBJECTS = [
  "General",
  "Biology",
  "Computer Science",
  "Physics & Chemistry",
  "Economics & Business",
  "History & Politics",
  "Medicine & Health",
  "Literature & Philosophy",
];

const LENGTHS = [
  { id: "very_short", label: "Very Short", desc: "1-2 sentence core thesis" },
  { id: "short", label: "Short", desc: "Crisp bulleted highlights" },
  { id: "medium", label: "Medium", desc: "Balanced conceptual study notes" },
  { id: "detailed", label: "Detailed", desc: "In-depth comprehensive guide" },
];

export const NotesInput: React.FC<NotesInputProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [length, setLength] = useState<"very_short" | "short" | "medium" | "detailed">("short");
  const [subject, setSubject] = useState("General");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !content.trim()) return;
    onGenerate({
      topic: topic.trim(),
      content: content.trim(),
      length,
      subject,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (topic.trim() || content.trim()) {
        handleSubmit(e);
      }
    }
  };

  const loadSample = (sample: (typeof SAMPLE_TOPICS)[0]) => {
    setTopic(sample.topic);
    setSubject(sample.subject);
    setContent(sample.snippet);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl transition-all">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic & Subject row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Topic or Heading <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Photosynthesis, Transformer Neural Networks, French Revolution..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                required={!content.trim()}
              />
              <BookOpen className="w-4 h-4 text-slate-500 absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Subject Domain
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Source Text / Study Material */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Study Material, Paragraph, or Article <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {content.length} characters
            </span>
          </div>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="Paste article text, textbook chapter, lecture transcripts, or notes here. If left empty, the AI Agent will synthesize factual notes directly from the topic."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm leading-relaxed resize-y font-normal"
            />
            {content && (
              <button
                type="button"
                onClick={() => setContent("")}
                className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Length Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Notes Length & Depth
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {LENGTHS.map((item) => {
              const isSelected = length === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLength(item.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5 line-clamp-1">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick sample chips */}
        <div className="space-y-2 pt-1 border-t border-slate-800/50">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            Try sample study material:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TOPICS.map((samp) => (
              <button
                key={samp.topic}
                type="button"
                onClick={() => loadSample(samp)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/30 text-slate-300 hover:text-indigo-200 transition-all flex items-center gap-1.5"
              >
                <span>{samp.topic}</span>
                <span className="text-[10px] text-slate-500 font-mono">({samp.subject})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">⌘+Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">Ctrl+Enter</kbd> to generate
          </p>

          <button
            type="submit"
            disabled={isLoading || (!topic.trim() && !content.trim())}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-xl ${
              isLoading || (!topic.trim() && !content.trim())
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95 hover:shadow-indigo-500/25 cursor-pointer active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Agent Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Notes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
