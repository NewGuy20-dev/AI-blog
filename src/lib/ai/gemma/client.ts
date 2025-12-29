import { GoogleGenAI, Type } from "@google/genai";

export const gemmaClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

// Using Gemma 3-12B with prompt-based function calling via <tool_use> tags
export const GEMMA_MODEL = "gemma-3-12b-it";

export const webSearchFunctionDeclaration = {
  name: "web_search",
  description:
    "Search the web for current information related to blog topics. Use this to find real-time news, facts, and context for generating accurate blog content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The search query for blog research",
      },
      search_depth: {
        type: Type.STRING,
        description: '"basic" for quick search or "advanced" for comprehensive search',
      },
      max_results: {
        type: Type.NUMBER,
        description: "Number of results to return (1-10)",
      },
    },
    required: ["query"],
  },
};

export const blogGenerationConfig = {
  tools: [{ functionDeclarations: [webSearchFunctionDeclaration] }],
};
