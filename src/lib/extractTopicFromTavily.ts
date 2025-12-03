import { generateText } from "ai";
import { model } from "./ai/config";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  answer?: string;
}

export async function extractTopicFromTavily(): Promise<{ topic: string; results: TavilyResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: "Trending technology news right now. Summaries + keywords.",
      search_depth: "basic",
      include_answer: true,
      max_results: 5,
      topic: "news",
      days: 1,
    }),
  });

  if (!response.ok) throw new Error(`Tavily API error: ${response.statusText}`);

  const data = await response.json();
  const results: TavilyResult[] = data.results.map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));

  if (!results.length) {
    return { topic: "Latest Technology News", results: [] };
  }

  const context = data.answer
    ? `Answer: ${data.answer}\n\n`
    : "";
  const articles = results.map(r => `- ${r.title}`).join("\n");

  const { text } = await generateText({
    model,
    prompt: `${context}Headlines:\n${articles}\n\nReturn ONLY a specific topic phrase (5-15 words) for the most newsworthy story. Nothing else.`,
  });

  return {
    topic: text.trim() || "Latest Technology News",
    results,
  };
}
