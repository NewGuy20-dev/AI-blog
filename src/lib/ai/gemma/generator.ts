import { gemmaClient, GEMMA_MODEL } from "./client";
import { TOOLS_DESCRIPTION, executeTool, ToolResult } from "./tools";
import { parseToolCalls, formatToolResults } from "./parser";
import { Article } from "../../schemas/article";

export interface GenerationMetrics {
  totalLatencyMs: number;
  turns: number;
  toolCalls: string[];
}

export interface BlogGenerationResult {
  article: Article;
  metrics: GenerationMetrics;
  toolResults: ToolResult[];
}

const SYSTEM_PROMPT = `You are an expert blog writer creating SEO-optimized, factual news articles.

${TOOLS_DESCRIPTION}

WORKFLOW:
1. First, use google_search to get current information about the topic
2. ALWAYS use openverse_image to find a relevant featured image for the blog
3. After receiving tool results, generate the blog as JSON

CATEGORIES (pick ONE that best fits):
technology, business, sports, entertainment, health, science, politics, world, lifestyle, opinion, law, education

OUTPUT FORMAT (after receiving tool results):
\`\`\`json
{
  "title": "Compelling headline",
  "slug": "url-friendly-slug",
  "summary": "1-2 sentence summary",
  "category": "technology",
  "featuredImage": {"url": "image url from openverse", "alt": "description"},
  "content": [
    {"type": "heading", "level": 1, "text": "Title"},
    {"type": "paragraph", "text": "Content..."}
  ],
  "sources": [{"title": "Source", "url": "https://..."}],
  "tags": ["tag1", "tag2"],
  "readingTime": 5
}
\`\`\`

Now write a blog about:`;

const MAX_TURNS = 3;

export async function generateBlogWithTools(topic: string): Promise<BlogGenerationResult> {
  const startTime = Date.now();
  const allToolResults: ToolResult[] = [];
  const toolCallNames: string[] = [];
  let turns = 0;

  const messages: { role: string; content: string }[] = [
    { role: "user", content: `${SYSTEM_PROMPT} ${topic}` },
  ];

  while (turns < MAX_TURNS) {
    turns++;

    const response = await gemmaClient.models.generateContent({
      model: GEMMA_MODEL,
      contents: messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    });

    const responseText = response.text || "";
    const parsed = parseToolCalls(responseText);

    if (parsed.hasToolCalls) {
      // Execute all tool calls
      const results = await Promise.all(parsed.toolCalls.map(executeTool));
      allToolResults.push(...results);
      toolCallNames.push(...parsed.toolCalls.map(c => c.tool));

      // Add model response and tool results to conversation
      messages.push({ role: "model", content: responseText });
      messages.push({ role: "user", content: `Tool results:\n${formatToolResults(results)}\n\nNow generate the final blog post as JSON. Include featuredImage from the openverse results.` });
    } else {
      // No tool calls - try to parse final article
      const article = parseArticle(responseText, allToolResults);
      return {
        article,
        metrics: { totalLatencyMs: Date.now() - startTime, turns, toolCalls: toolCallNames },
        toolResults: allToolResults,
      };
    }
  }

  throw new Error("Max turns exceeded without generating article");
}

function parseArticle(text: string, toolResults: ToolResult[]): Article {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const parsed = JSON.parse(jsonStr);

  // Handle different content formats from Gemma
  let content = parsed.content || parsed.body || [];

  // Extract featured image from tool results if not in parsed JSON
  let featuredImage = parsed.featuredImage;
  if (!featuredImage) {
    const imageResult = toolResults.find(r => r.tool === "openverse_image" && r.success);
    if (imageResult && imageResult.success && "data" in imageResult) {
      const images = (imageResult.data as any).images;
      if (images && images.length > 0) {
        const img = images[0];
        featuredImage = {
          url: img.url,
          alt: img.title,
        };
      }
    }
  }
  // Normalize featuredImage to match Convex schema (only url and alt)
  if (featuredImage) {
    featuredImage = {
      url: featuredImage.url,
      alt: featuredImage.alt || "Featured image",
    };
  }
  if (Array.isArray(content)) {
    content = content.map((block: any) => {
      if (block.type === "paragraph") {
        return { type: "paragraph", text: block.text || block.content || "" };
      }
      if (block.type === "heading") {
        return { type: "heading", level: block.level || 2, text: block.text || block.content || "" };
      }
      return block;
    });
  }

  return {
    title: parsed.title || "Untitled",
    slug: parsed.slug || parsed.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled",
    summary: parsed.summary || parsed.description || "",
    category: parsed.category || inferCategoryFromTags(parsed.tags),
    content,
    sources: parsed.sources || [],
    tags: parsed.tags || [],
    readingTime: parsed.readingTime || parsed.reading_time || 5,
    featuredImage,
  };
}

function inferCategoryFromTags(tags: string[]): string {
  if (!tags || tags.length === 0) return "world";
  const categoryMap: Record<string, string[]> = {
    technology: ["tech", "ai", "software", "hardware", "cyber", "digital", "internet", "app"],
    business: ["business", "economy", "finance", "market", "stock", "company", "startup"],
    sports: ["sports", "football", "basketball", "soccer", "tennis", "olympics", "athlete"],
    entertainment: ["entertainment", "movie", "music", "celebrity", "tv", "streaming", "gaming"],
    health: ["health", "medical", "covid", "vaccine", "disease", "mental", "fitness"],
    science: ["science", "research", "space", "nasa", "climate", "environment", "discovery"],
    politics: ["politics", "election", "government", "congress", "senate", "president", "policy"],
    world: ["world", "international", "global", "country", "nation", "war", "conflict"],
    lifestyle: ["lifestyle", "travel", "food", "fashion", "home", "relationship"],
    education: ["education", "school", "university", "student", "learning", "college"],
    law: ["law", "legal", "court", "judge", "lawsuit", "crime", "justice"],
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (tags.some(tag => keywords.some(kw => tag.toLowerCase().includes(kw)))) {
      return category;
    }
  }
  return "world";
}
