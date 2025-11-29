import { generateObject } from "ai";
import { z } from "zod";
import { model } from "./config";
import { ArticleSchema, Article } from "../schemas/article";
import { SearchResult } from "./search";

const VerificationResultSchema = z.object({
    pass: z.boolean(),
    issues: z.array(z.string()),
    correctedArticle: ArticleSchema,
});

export async function verifyArticle(article: Article, searchResults: SearchResult[]) {
    const context = searchResults
        .map((r) => `Title: ${r.title}\nSource: ${r.url}\nDate: ${r.publishedDate}\nContent: ${r.content}`)
        .join("\n\n");

    const prompt = `
You are a strict news editor and fact-checker.
Verify the following article against the provided source context.
1. Check for factual errors or hallucinations.
2. Ensure all claims are supported by the context.
3. If a claim is unsupported, remove it or rewrite it to be ambiguous.
4. Return the corrected article and a list of issues found.
If the article is mostly correct, set pass to true.

Original Article:
${JSON.stringify(article, null, 2)}

Context:
${context}
`;

    const result = await generateObject({
        model,
        schema: VerificationResultSchema,
        prompt,
    });

    return result.object;
}
