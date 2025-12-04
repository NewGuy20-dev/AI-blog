import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { searchNews } from "./search";
import { generateArticle } from "./generator";
import { critiqueArticle } from "./critic";
import { extractTopicFromTavily } from "../extractTopicFromTavily";
import { v4 as uuidv4 } from "uuid";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function runPipeline() {
    const runId = uuidv4();

    try {
        // 0. Discover topic dynamically via Tavily
        await log(runId, "discovery", "started");
        const { topic: actualTopic, results: tavilyResults } = await extractTopicFromTavily();
        await log(runId, "discovery", "success", undefined, { topic: actualTopic });

        // 1. Search for more context if needed
        await log(runId, "search", "started", { topic: actualTopic });
        const searchResults = tavilyResults.length > 0 
            ? tavilyResults.map(r => ({ ...r, publishedDate: undefined }))
            : await searchNews(actualTopic);
        await log(runId, "search", "success", { topic: actualTopic }, searchResults);

        // 2. Generate
        await log(runId, "generate", "started", { contextSize: searchResults.length });
        const draft = await generateArticle(actualTopic, searchResults);
        await log(runId, "generate", "success", { topic: actualTopic }, draft);

        // 3. Critique (replaces verify)
        await log(runId, "critique", "started", { draftTitle: draft.title });
        const critique = await critiqueArticle(draft, actualTopic, searchResults);
        await log(runId, "critique", "success", {
            issues: critique.issues_found,
            improvements: critique.improvements_made,
            confidence: critique.confidence_score,
            pass: critique.pass,
        });

        // 4. Save if passes
        if (critique.pass) {
            const finalArticle = critique.final_article;
            await convex.mutation(api.posts.create, {
                slug: finalArticle.slug,
                title: finalArticle.title,
                summary: finalArticle.summary,
                content: finalArticle.content,
                sources: finalArticle.sources,
                tags: finalArticle.tags,
                status: "published",
                publishedAt: Date.now(),
                readingTime: finalArticle.readingTime || 5,
            });
            await log(runId, "save", "success", { slug: finalArticle.slug });
        } else {
            await log(runId, "save", "skipped", { reason: "Critique failed", confidence: critique.confidence_score });
        }

        return { success: true, runId, topic: actualTopic };
    } catch (error: any) {
        console.error("Pipeline failed:", error);
        await log(runId, "error", "failed", { error: error.message });
        return { success: false, error: error.message, runId, topic: undefined };
    }
}

async function log(runId: string, stage: string, status: string, input?: any, output?: any) {
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
