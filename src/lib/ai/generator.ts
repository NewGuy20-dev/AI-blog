import { generateObject } from "ai";
import { model } from "./config";
import { Article, ArticleSchema } from "../schemas/article";
import { SearchResult } from "./search";
import { CriticIssue } from "./issues";

export interface GeneratorFeedback {
  previousDraft: Article;
  issues: CriticIssue[];
  attemptNumber: number;
}

export async function generateArticle(
  topic: string,
  searchResults: SearchResult[],
  feedback?: GeneratorFeedback
) {
  const context = searchResults
    .map((r) => `Title: ${r.title}\nSource: ${r.url}\nDate: ${r.publishedDate}\nContent: ${r.content}`)
    .join("\n\n");

  let prompt = `You are an objective news reporter. Write a structured news article about "${topic}" based ONLY on the provided context.

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
${context}`;

  if (feedback) {
    const issuesList = feedback.issues
      .map(i => `- [${i.category}/${i.subcategory}] ${i.description}${i.suggestion ? `\n  Fix: ${i.suggestion}` : ''}`)
      .join('\n');

    prompt += `

═══════════════════════════════════════
REVISION REQUIRED (Attempt ${feedback.attemptNumber})
═══════════════════════════════════════

Your previous draft had these issues:
${issuesList}

Previous draft title: "${feedback.previousDraft.title}"

INSTRUCTIONS:
1. Fix ALL issues listed above
2. Keep what worked in the previous version
3. Only include verifiable facts from the context
4. Remove any problematic content
5. Improve weak areas`;
  }

  const result = await generateObject({
    model,
    schema: ArticleSchema,
    prompt,
  });

  return result.object;
}
