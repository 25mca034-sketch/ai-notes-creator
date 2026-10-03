import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment. AI calls will require valid key.");
}

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const MODEL_NAME = "gemini-3.8-flash";
