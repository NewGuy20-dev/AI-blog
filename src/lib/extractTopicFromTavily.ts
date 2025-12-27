import { generateText } from "ai";
import { model } from "./ai/config";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Topics to filter out before generation (saves API calls)
const BLOCKED_KEYWORDS = [
  "murder", "killing", "stabbing", "shooting", "attack", "terrorist",
  "suicide", "death toll", "massacre", "assault", "rape", "abuse",
  "bombing", "explosion", "hostage", "kidnap", "war crime", "genocide",
  "hate crime", "extremist", "riot", "violence", "fatal", "victim",
];

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  answer?: string;
}

function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some(keyword => lower.includes(keyword));
}

export async function extractTopicFromTavily(): Promise<{ topic: string; results: TavilyResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const recentTitles = await convex.query(api.posts.getRecentTitles, { limit: 10 });

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: "Trending news right now. Summaries + keywords.",
      search_depth: "basic",
      include_answer: true,
      max_results: 8,
      topic: "news",
      days: 1,
    }),
  });

  if (!response.ok) throw new Error(`Tavily API error: ${response.statusText}`);

  const data = await response.json();
  
  // Filter out violent/sensitive content
  const safeResults: TavilyResult[] = data.results
    .filter((r: any) => !containsBlockedContent(r.title) && !containsBlockedContent(r.content))
    .map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));

  if (!safeResults.length) {
    return { topic: "Latest Technology News", results: [] };
  }

  const context = data.answer && !containsBlockedContent(data.answer) 
    ? `Answer: ${data.answer}\n\n` 
    : "";
  const articles = safeResults.map(r => `- ${r.title}`).join("\n");
  const avoidList = recentTitles.length 
    ? `\n\nAVOID these topics (already covered):\n${recentTitles.map(t => `- ${t}`).join("\n")}`
    : "";

  const { text } = await generateText({
    model,
    prompt: `${context}Headlines:\n${articles}${avoidList}

IMPORTANT: Avoid topics involving violence, crime, death, or graphic content.

Return ONLY a specific topic phrase (5-15 words) for the most newsworthy story. Nothing else.`,
  });

  const topic = text.trim() || "Latest Technology News";
  
  // Final safety check on generated topic
  if (containsBlockedContent(topic)) {
    return { topic: "Latest Technology News", results: safeResults };
  }

  return { topic, results: safeResults };
}
