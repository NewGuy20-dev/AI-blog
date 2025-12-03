import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { searchNews, discoverTopic } from "./search";
import { generateArticle } from "./generator";
import { verifyArticle } from "./verifier";
import { v4 as uuidv4 } from "uuid";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function runPipeline(topic?: string) {
    const runId = uuidv4();
    const start = Date.now();

    try {
        // 0. Discover topic if not provided
        let actualTopic = topic;
        if (!actualTopic) {
            await log(runId, "discovery", "started");
            actualTopic = await discoverTopic();
            await log(runId, "discovery", "success", undefined, { topic: actualTopic });
        }
        // 1. Search
        await log(runId, "search", "started", { topic: actualTopic });
        const searchResults = await searchNews(actualTopic);
        await log(runId, "search", "success", { topic: actualTopic }, searchResults);

        // 2. Generate
        await log(runId, "generate", "started", { contextSize: searchResults.length });
        const draft = await generateArticle(actualTopic, searchResults);
        await log(runId, "generate", "success", { topic: actualTopic }, draft);

        // 3. Verify
        await log(runId, "verify", "started", { draftTitle: draft.title });
        const verification = await verifyArticle(draft, searchResults);
        await log(runId, "verify", "success", { issues: verification.issues }, verification.correctedArticle);

        // 4. Save
        if (verification.pass || verification.correctedArticle) {
            const finalArticle = verification.correctedArticle || draft;
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
            await log(runId, "save", "skipped", { reason: "Verification failed" });
        }

        return { success: true, runId };
    } catch (error: any) {
        console.error("Pipeline failed:", error);
        await log(runId, "error", "failed", { error: error.message });
        return { success: false, error: error.message, runId };
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
            durationMs: 0, // TODO: Track duration
        });
    } catch (e) {
        console.error("Failed to log audit:", e);
    }
}
