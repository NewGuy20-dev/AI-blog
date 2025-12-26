import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const model = google("gemini-2.5-flash-lite");

// Critic model uses separate API key for independent validation
const googleCritic = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_CRITIC_API_KEY,
});

export const criticModel = googleCritic("gemini-2.5-flash-lite");

export const refinementConfig = {
  maxRetries: 2,
  fallbackThreshold: 0.6,
};
