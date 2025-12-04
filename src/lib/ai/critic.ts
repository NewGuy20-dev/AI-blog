import { generateObject } from "ai";
import { z } from "zod";
import { criticModel } from "./config";
import { Article, ArticleSchema } from "../schemas/article";
import { SearchResult } from "./search";

const CriticResultSchema = z.object({
    issues_found: z.array(z.string()),
    improvements_made: z.array(z.string()),
    final_article: ArticleSchema,
    confidence_score: z.number().min(0).max(1),
});

export type CriticResult = z.infer<typeof CriticResultSchema> & { pass: boolean };

export async function critiqueArticle(
    draft: Article,
    topic: string,
    searchResults: SearchResult[]
): Promise<CriticResult> {
    const context = searchResults
        .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
        .join("\n\n");

    const prompt = `You are an expert editorial critic. Review this AI-generated article and improve it.

ORIGINAL TOPIC: "${topic}"

DRAFT ARTICLE:
Title: ${draft.title}
Summary: ${draft.summary}
Content: ${JSON.stringify(draft.content, null, 2)}
Sources: ${JSON.stringify(draft.sources)}
Tags: ${draft.tags.join(", ")}

SOURCE CONTEXT (use to verify facts):
${context}

PERFORM THESE CHECKS:

1. FACTUAL ACCURACY
- Cross-reference claims with the source context
- Flag unsupported, speculative, or hallucinated claims
- Fix any factual errors

2. TOPIC RELEVANCE
- Ensure article matches the topic "${topic}"
- Remove filler or irrelevant sections
- Title must match body content

3. WRITING QUALITY
- Fix grammar issues
- Remove redundancy and overly long paragraphs
- Improve clarity and flow
- Make it sound human and editorially clean

4. STYLE GUIDE
- Professional, neutral, AI-news tone
- Proper heading structure (H1 for title, H2 for sections)
- Consistent terminology for AI terms, company names, model names

5. SEO BEST PRACTICES
- Include relevant keywords naturally
- Good heading hierarchy
- First paragraph should contain the main topic
- Summary should work as meta description

6. SAFETY & COMPLIANCE
- Remove harmful or inappropriate content
- Avoid misinformation
- Prevent defamation

Return a JSON object with:
- issues_found: List of problems identified
- improvements_made: List of changes you made
- final_article: The corrected article (same schema as input)
- confidence_score: 0-1 score of article quality after improvements`;

    const result = await generateObject({
        model: criticModel,
        schema: CriticResultSchema,
        prompt,
    });

    return {
        ...result.object,
        pass: result.object.confidence_score >= 0.7,
    };
}
