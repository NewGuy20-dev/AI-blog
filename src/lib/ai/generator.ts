import { generateObject } from "ai";
import { model } from "./config";
import { ArticleSchema } from "../schemas/article";
import { SearchResult } from "./search";

export async function generateArticle(topic: string, searchResults: SearchResult[]) {
    const context = searchResults
        .map((r) => `Title: ${r.title}\nSource: ${r.url}\nDate: ${r.publishedDate}\nContent: ${r.content}`)
        .join("\n\n");

    const prompt = `
You are an objective news reporter. Write a structured news article about "${topic}" based ONLY on the provided context.

Requirements:
- title: A compelling headline
- slug: URL-friendly version of title (lowercase, hyphens, no special chars)
- summary: 1-2 sentence summary
- content: Array of content blocks, each must have "type" field:
  - {"type": "heading", "level": 1 or 2, "text": "..."}
  - {"type": "paragraph", "text": "..."}
- sources: Array of {"title": "...", "url": "..."} from the context
- tags: Array of relevant topic tags
- readingTime: Estimated minutes to read

Context:
${context}
`;

    const result = await generateObject({
        model,
        schema: ArticleSchema,
        prompt,
    });

    return result.object;
}
