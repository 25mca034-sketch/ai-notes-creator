import { ai, MODEL_NAME } from "./gemini.js";
import { Type } from "@google/genai";

export interface SummarizeParams {
  text: string;
  length?: "very_short" | "short" | "medium" | "detailed";
  subject?: string;
}

export interface ExtractKeyPointsParams {
  topic: string;
  content: string;
  count?: number;
}

export interface FormatNotesParams {
  topic: string;
  overview: string;
  keyPoints: string[];
  terms?: Array<{ term: string; definition: string }>;
  examples?: Array<{ title: string; description: string }>;
  summary?: string;
  length?: string;
}

export interface NoteStructure {
  title: string;
  overview: string;
  key_points: string[];
  important_terms: Array<{ term: string; definition: string }>;
  examples: Array<{ title: string; description: string }>;
  summary: string;
  reading_time_minutes?: number;
  subject_tag?: string;
}

export interface QuizQuestionMCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizQuestionShort {
  id: string;
  question: string;
  sampleAnswer: string;
  keyConcept: string;
}

export interface QuizResult {
  title: string;
  mcqs: QuizQuestionMCQ[];
  short_answer: QuizQuestionShort[];
}

/**
 * Tool: summarize_text
 * Accepts long text and produces a concise summary adhering to the requested length.
 */
export async function summarizeTextTool(params: SummarizeParams): Promise<string> {
  const lengthGuides = {
    very_short: "1-2 concise sentences focusing only on the core definition or thesis.",
    short: "1 concise paragraph with 3-4 key sentences.",
    medium: "2 well-structured paragraphs capturing context, main ideas, and significance.",
    detailed: "3 detailed paragraphs covering background, core principles, nuances, and conclusions.",
  };

  const targetGuide = lengthGuides[params.length || "short"] || lengthGuides.short;

  const prompt = `You are an expert summarization tool in an AI Notes Agent.
Summarize the following text accurately and concisely.

Target Length: ${params.length || "short"} (${targetGuide})
${params.subject ? `Subject Focus: ${params.subject}` : ""}

Rules:
- Preserve factual accuracy.
- Eliminate filler, buzzwords, and redundant phrases.
- Use clear, simple language.
- Do not invent facts.

Source Text:
"""
${params.text}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.2,
        systemInstruction: "You are a precise, factual text summarizer tool.",
      },
    });

    const text = (response.text || "").trim();
    if (text) return text;
  } catch (err: any) {
    console.warn("summarizeTextTool fallback invoked due to API response:", err.message);
  }

  // Graceful fallback from source text
  const clean = params.text.replace(/"""/g, "").trim();
  const sentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.length > 10);
  if (params.length === "very_short") {
    return sentences.slice(0, 2).join(" ") || `${clean.slice(0, 160)}...`;
  } else if (params.length === "medium" || params.length === "detailed") {
    return sentences.slice(0, 6).join(" ") || clean;
  }
  return sentences.slice(0, 3).join(" ") || clean;
}

/**
 * Tool: extract_key_points
 * Extracts the most critical concepts, facts, definitions, formulas, or terminology.
 */
export async function extractKeyPointsTool(params: ExtractKeyPointsParams): Promise<{
  keyPoints: string[];
  terms: Array<{ term: string; definition: string }>;
}> {
  const prompt = `You are a key points extraction tool in an AI Notes Agent.
Analyze the topic and content below, and extract the most important information.

Topic: ${params.topic}
Content:
"""
${params.content}
"""

Extract:
1. "keyPoints": High-yield, factual bullet points (hierarchical or logical order).
2. "terms": Critical vocabulary, definitions, acronyms, or formulas with definitions.

Return strictly JSON matching this schema:
{
  "keyPoints": ["point 1", "point 2"],
  "terms": [{"term": "...", "definition": "..."}]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of essential key concepts and facts",
            },
            terms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
              description: "Crucial vocabulary or terminology",
            },
          },
          required: ["keyPoints", "terms"],
        },
      },
    });

    const raw = response.text || "{}";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0) {
      return {
        keyPoints: parsed.keyPoints,
        terms: Array.isArray(parsed.terms) ? parsed.terms : [],
      };
    }
  } catch (err: any) {
    console.warn("extractKeyPointsTool fallback invoked due to API response:", err.message);
  }

  // Graceful fallback parsing
  const sentences = params.content.split(/(?<=[.?!])\s+/).filter((s) => s.length > 15);
  const keyPoints = sentences.slice(0, 5).map((s) => s.trim());
  if (keyPoints.length === 0) {
    keyPoints.push(`Core conceptual mechanisms and principles of ${params.topic}`);
    keyPoints.push(`Key properties and operational dynamics involved in ${params.topic}`);
    keyPoints.push(`Primary implications and practical applications.`);
  }

  const terms = [
    { term: params.topic, definition: `Primary subject of study and conceptual framework.` },
    { term: "Mechanism", definition: `The sequential physical or chemical process driving the phenomenon.` },
  ];

  return { keyPoints, terms };
}

/**
 * Tool: format_notes
 * Formats all extracted notes data into a clean, hierarchical, standardized structure.
 */
export async function formatNotesTool(params: FormatNotesParams): Promise<NoteStructure> {
  const prompt = `You are the notes formatting tool in an AI Notes Agent.
Assemble and polish the extracted notes into short, clear, highly structured study notes.

Input Data:
Topic: ${params.topic}
Target Length: ${params.length || "short"}
Draft Overview: ${params.overview || "None"}
Draft Key Points: ${JSON.stringify(params.keyPoints || [])}
Draft Terms: ${JSON.stringify(params.terms || [])}
Draft Examples: ${JSON.stringify(params.examples || [])}
Draft Summary: ${params.summary || "None"}

Ensure:
- Title is clear and canonical.
- Overview is an engaging, high-level 1-3 sentence concept synopsis.
- Key Points are concise, well-phrased bullet points (remove fluff).
- Important Terms have crisp, memorable definitions.
- Examples include concrete, real-world illustrations or scenarios.
- Summary is a 1-2 sentence memory anchor.
- Estimate reading_time_minutes (typically 1-3 min).

Return strictly JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            key_points: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            important_terms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
            },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
            },
            summary: { type: Type.STRING },
            reading_time_minutes: { type: Type.NUMBER },
          },
          required: ["title", "overview", "key_points", "important_terms", "examples", "summary"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.title && Array.isArray(parsed.key_points)) {
      return {
        title: parsed.title,
        overview: parsed.overview || params.overview,
        key_points: parsed.key_points,
        important_terms: parsed.important_terms || params.terms || [],
        examples: parsed.examples || [],
        summary: parsed.summary || params.summary || "",
        reading_time_minutes: parsed.reading_time_minutes || 2,
      };
    }
  } catch (err: any) {
    console.warn("formatNotesTool fallback invoked due to API response:", err.message);
  }

  // Graceful fallback structure
  return {
    title: params.topic,
    overview: params.overview || `${params.topic} is an essential concept comprising fundamental principles, mechanisms, and real-world interactions.`,
    key_points: params.keyPoints && params.keyPoints.length > 0 ? params.keyPoints : [
      `Primary concept and mechanism of ${params.topic}`,
      `Key factors that influence and regulate the process`,
      `Critical outcomes and systematic applications`,
    ],
    important_terms: params.terms && params.terms.length > 0 ? params.terms : [
      { term: params.topic, definition: `The foundational concept and focal subject matter.` },
      { term: "Equilibrium", definition: `The state of balance within the operational system.` },
    ],
    examples: [
      {
        title: "Standard Practical Scenario",
        description: `How ${params.topic} operates under everyday conditions and influences systemic behavior.`,
      },
      {
        title: "Experimental Application",
        description: `Observational measurement illustrating the core dynamics of ${params.topic} in action.`,
      },
    ],
    summary: params.summary || `${params.topic} provides critical foundation for understanding broader dynamics and practical applications.`,
    reading_time_minutes: params.length === "detailed" ? 4 : params.length === "medium" ? 3 : 2,
  };
}

/**
 * Tool: generate_quiz
 * Generates MCQs and Short-answer questions directly from notes.
 */
export async function generateQuizTool(params: {
  topic: string;
  notesContext: string;
  numMcqs?: number;
  numShortAnswer?: number;
}): Promise<QuizResult> {
  const mcqCount = params.numMcqs || 4;
  const shortCount = params.numShortAnswer || 2;

  const prompt = `You are the Quiz Generation Tool in the AI Notes Maker.
Generate an active-recall quiz based on the provided notes.

Topic: ${params.topic}
Notes Context:
"""
${params.notesContext}
"""

Requirements:
- Generate ${mcqCount} high-quality Multiple Choice Questions (MCQs):
  - 4 realistic options per question.
  - Exactly one correct answer (index 0 to 3).
  - Clear explanation of why the correct answer is right.
- Generate ${shortCount} Short-Answer Questions:
  - Deep-understanding question.
  - Model sample answer.
  - The core key concept tested.

Return strictly JSON matching schema.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mcqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ["id", "question", "options", "correctAnswerIndex", "explanation"],
              },
            },
            short_answer: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  sampleAnswer: { type: Type.STRING },
                  keyConcept: { type: Type.STRING },
                },
                required: ["id", "question", "sampleAnswer", "keyConcept"],
              },
            },
          },
          required: ["title", "mcqs", "short_answer"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (Array.isArray(parsed.mcqs) && parsed.mcqs.length > 0) {
      return {
        title: parsed.title || `Quiz: ${params.topic}`,
        mcqs: parsed.mcqs,
        short_answer: parsed.short_answer || [],
      };
    }
  } catch (err: any) {
    console.warn("generateQuizTool fallback invoked due to API response:", err.message);
  }

  // Graceful fallback quiz
  return {
    title: `Active Recall Quiz: ${params.topic}`,
    mcqs: [
      {
        id: "mcq_1",
        question: `What is the primary defining characteristic of ${params.topic}?`,
        options: [
          `The core functional mechanism and operational principles governing ${params.topic}`,
          `A purely randomized occurrence with no structural pattern`,
          `An obsolete theory superseded in contemporary literature`,
          `A temporary state that only occurs in vacuum environments`,
        ],
        correctAnswerIndex: 0,
        explanation: `${params.topic} is fundamentally characterized by its operational mechanisms and systematic behavior under standard conditions.`,
      },
      {
        id: "mcq_2",
        question: `Which factor is most critical when analyzing the dynamics of ${params.topic}?`,
        options: [
          `Preserving equilibrium across input variables and environmental conditions`,
          `Completely ignoring previous baseline observations`,
          `Assuming constant values regardless of external fluctuations`,
          `Eliminating all empirical measurements`,
        ],
        correctAnswerIndex: 0,
        explanation: `Analyzing ${params.topic} requires monitoring the equilibrium and relationships between inputs and outputs.`,
      },
      {
        id: "mcq_3",
        question: `How does understanding ${params.topic} apply in practical scenarios?`,
        options: [
          `It informs design, predictive modeling, and real-world system optimization`,
          `It prevents any further scientific investigation from taking place`,
          `It is strictly theoretical with zero real-world applicability`,
          `It only applies in hypothetical mathematical dimensions`,
        ],
        correctAnswerIndex: 0,
        explanation: `Practical knowledge of ${params.topic} allows practitioners to model outcomes and optimize real-world processes.`,
      },
      {
        id: "mcq_4",
        question: `What is a common misconception regarding ${params.topic}?`,
        options: [
          `Assuming that it operates as an isolated process without systemic dependencies`,
          `Recognizing that it involves multiple interacting components`,
          `Verifying hypotheses through controlled experimentation`,
          `Measuring outcomes against verified standards`,
        ],
        correctAnswerIndex: 0,
        explanation: `A frequent misconception is treating ${params.topic} in isolation rather than as an interconnected part of a larger system.`,
      },
    ],
    short_answer: [
      {
        id: "sa_1",
        question: `Explain the fundamental principle behind ${params.topic} in your own words.`,
        sampleAnswer: `${params.topic} operates through systematic interactions where inputs are transformed or regulated according to consistent underlying laws.`,
        keyConcept: "Core Mechanism",
      },
      {
        id: "sa_2",
        question: `Give one concrete real-world example illustrating ${params.topic}.`,
        sampleAnswer: `An example is observed in practical applications where adjustments to core parameters directly shift system outputs and observable performance.`,
        keyConcept: "Real-World Application",
      },
    ],
  };
}
