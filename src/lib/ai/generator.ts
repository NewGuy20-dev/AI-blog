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
Do not hallucinate. Use the provided sources.
Structure the content with paragraphs and headings.
Include a summary and tags.
Ensure the tone is neutral and journalistic.

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
