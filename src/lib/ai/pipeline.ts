import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { searchNews } from "./search";
import { refineArticle } from "./refinement";
import { extractTopicFromTavily } from "../extractTopicFromTavily";
import { searchImage } from "./images";
import { v4 as uuidv4 } from "uuid";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function runPipeline() {
  const runId = uuidv4();

  try {
    // 0. Discover topic
    await log(runId, "discovery", "started");
    const { topic: actualTopic, results: tavilyResults } = await extractTopicFromTavily();
    await log(runId, "discovery", "success", undefined, { topic: actualTopic });

    // 1. Search for context
    await log(runId, "search", "started", { topic: actualTopic });
    const searchResults = tavilyResults.length > 0 
      ? tavilyResults.map(r => ({ ...r, publishedDate: undefined }))
      : await searchNews(actualTopic);
    await log(runId, "search", "success", { topic: actualTopic }, { count: searchResults.length });

    // 2. Refine article (generate + critique loop)
    await log(runId, "refinement", "started", { contextSize: searchResults.length });
    
    const result = await refineArticle(actualTopic, searchResults, async (attempt, critique) => {
      await log(runId, `critique_${attempt}`, critique.decision, {
        attempt,
        decision: critique.decision,
        confidence: critique.confidence_score,
        issueCount: critique.issues.length,
        highSeverity: critique.high_severity_issues.length,
        fixable: critique.fixable_issues.length,
      }, {
        issues: critique.issues,
        checkResults: critique.checkResults,
      });
    });

    await log(runId, "refinement", result.status, {
      iterations: result.iterations,
      history: result.history,
    });

    // 3. Handle result
    if (result.status === 'published' && result.article) {
      const category = result.article.tags[0];
      
      await log(runId, "image", "started", { topic: actualTopic, category });
      const imageResult = await searchImage(actualTopic, category, result.article.tags);
      await log(runId, "image", imageResult.image ? "success" : "fallback", {
        source: imageResult.source,
        error: imageResult.error,
        hasImage: !!imageResult.image,
      });

      await convex.mutation(api.posts.create, {
        slug: result.article.slug,
        title: result.article.title,
        summary: result.article.summary,
        content: result.article.content,
        sources: result.article.sources,
        tags: result.article.tags,
        status: "published",
        publishedAt: Date.now(),
        readingTime: result.article.readingTime || 5,
        featuredImage: imageResult.image || undefined,
      });
      await log(runId, "save", "success", { slug: result.article.slug, status: "published" });
    } else if (result.status === 'draft' && result.article) {
      await convex.mutation(api.posts.create, {
        slug: result.article.slug,
        title: result.article.title,
        summary: result.article.summary,
        content: result.article.content,
        sources: result.article.sources,
        tags: result.article.tags,
        status: "draft",
        publishedAt: Date.now(),
        readingTime: result.article.readingTime || 5,
      });
      await log(runId, "save", "success", { slug: result.article.slug, status: "draft" });
    } else {
      await log(runId, "save", "rejected", {
        reason: result.reason?.map(r => `${r.category}/${r.subcategory}: ${r.description}`),
        iterations: result.iterations,
      });
    }

    return { success: result.status !== 'rejected', runId, topic: actualTopic, status: result.status };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Pipeline failed:", error);
    await log(runId, "error", "failed", { error: message });
    return { success: false, error: message, runId, topic: undefined };
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
