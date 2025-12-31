import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { generateBlogWithTools } from "./generator";
import { executeGoogleSearch } from "./tools";
import { v4 as uuidv4 } from "uuid";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function discoverTrendingTopic(): Promise<string> {
  // Rotate through different categories for variety
  const categories = [
    "trending technology news today",
    "breaking business finance news",
    "latest sports news highlights",
    "entertainment celebrity news today",
    "health medical breakthrough news",
    "science discovery news today",
    "world international news today",
    "lifestyle travel food trends",
    "education learning news today",
    "environmental climate news",
  ];
  
  // Pick random category
  const query = categories[Math.floor(Math.random() * categories.length)];
  
  const result = await executeGoogleSearch({ 
    tool: "google_search", 
    query, 
    num: 5 
  });
  
  if (result.success && "data" in result && "results" in result.data) {
    const titles = (result.data as { results: { title: string }[] }).results.map(r => r.title).join(", ");
    return `Write about one of these topics: ${titles}`;
  }
  
  return "Latest trending news story";
}

export async function runGemmaPipeline() {
  const runId = uuidv4();

  try {
    // 1. Discover trending topic via Google Search
    await log(runId, "discovery", "started");
    const topic = await discoverTrendingTopic();
    await log(runId, "discovery", "success", undefined, { topic });

    // 2. Generate article with Gemma + tools
    await log(runId, "generation", "started", { topic });
    const result = await generateBlogWithTools(topic);
    await log(runId, "generation", "success", { 
      turns: result.metrics.turns,
      tools: result.metrics.toolCalls 
    }, {
      title: result.article.title,
      toolResults: result.toolResults.map(r => ({ tool: r.tool, success: r.success }))
    });

    // 3. Save to Convex
    const article = result.article;
    await convex.mutation(api.posts.createFromPipeline, {
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: article.content,
      sources: article.sources,
      tags: article.tags,
      category: article.category,
      status: "published",
      publishedAt: Date.now(),
      readingTime: article.readingTime || 5,
      featuredImage: article.featuredImage,
    });
    await log(runId, "save", "success", { slug: article.slug });

    return { 
      success: true, 
      runId, 
      topic, 
      status: "published",
      article: { title: article.title, slug: article.slug },
      metrics: result.metrics
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gemma pipeline failed:", error);
    await log(runId, "error", "failed", { error: message });
    return { success: false, error: message, runId };
  }
}

async function log(runId: string, stage: string, status: string, input?: unknown, output?: unknown) {
  try {
    await convex.mutation(api.audit.log, {
      runId,
      stage,
      status,
      input: input ? JSON.stringify(input) : undefined,
      output: output ? JSON.stringify(output) : undefined,
      durationMs: 0,
    });
  } catch (e) {
    console.error("Failed to log audit:", e);
  }
}
