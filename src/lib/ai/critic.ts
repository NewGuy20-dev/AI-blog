import { generateObject } from "ai";
import { z } from "zod";
import { criticModel } from "./config";
import { Article, ArticleSchema } from "../schemas/article";
import { SearchResult } from "./search";
import { CriticIssue, CriticIssueSchema, ISSUE_REGISTRY, determineDecision, getFixableIssues, getHighSeverityIssues } from "./issues";

const CriticResultSchema = z.object({
  issues: z.array(CriticIssueSchema),
  confidence_score: z.number().min(0).max(1),
  final_article: ArticleSchema,
});

export interface CheckResult {
  name: string;
  passed: boolean;
  issue?: CriticIssue;
}

export interface CategoryCheckResults {
  safety: CheckResult[];
  factual: CheckResult[];
  quality: CheckResult[];
  seo: CheckResult[];
  compliance: CheckResult[];
}

export interface CriticResult {
  issues: CriticIssue[];
  decision: 'reject' | 'fix' | 'publish';
  high_severity_issues: CriticIssue[];
  fixable_issues: CriticIssue[];
  confidence_score: number;
  final_article: Article;
  checkResults: CategoryCheckResults;
}

function buildCheckResults(issues: CriticIssue[]): CategoryCheckResults {
  const results: CategoryCheckResults = {
    safety: [],
    factual: [],
    quality: [],
    seo: [],
    compliance: [],
  };

  for (const [category, checks] of Object.entries(ISSUE_REGISTRY)) {
    const cat = category as keyof CategoryCheckResults;
    for (const checkName of Object.keys(checks)) {
      const issue = issues.find(i => i.category === cat && i.subcategory === checkName);
      results[cat].push({
        name: checkName,
        passed: !issue,
        issue,
      });
    }
  }

  return results;
}

export async function critiqueArticle(
  draft: Article,
  topic: string,
  searchResults: SearchResult[]
): Promise<CriticResult> {
  const context = searchResults
    .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
    .join("\n\n");

  const currentDate = new Date().toISOString().split('T')[0];
  
  const prompt = `You are a content quality reviewer for a news blog. Be LENIENT - only flag genuine issues.

CURRENT DATE: ${currentDate}

IMPORTANT: Only mark issues as HIGH severity if they are truly dangerous (actual hate speech, explicit violence promotion, illegal content). Normal news reporting about events is NOT a safety issue.

TOPIC: "${topic}"

ARTICLE TO REVIEW:
Title: ${draft.title}
Summary: ${draft.summary}
Content: ${JSON.stringify(draft.content, null, 2)}
Sources: ${JSON.stringify(draft.sources)}
Tags: ${draft.tags.join(", ")}

SOURCE CONTEXT (for fact-checking):
${context}

═══════════════════════════════════════
CHECK EACH CATEGORY (BE LENIENT):
═══════════════════════════════════════

⚠️ SAFETY (HIGH severity = ONLY for truly dangerous content)
NOTE: Reporting on news events is NOT a safety issue. Only flag if the article PROMOTES or INSTRUCTS harmful behavior.
□ violence - ONLY if promoting/glorifying violence (not reporting on events)
□ hate_speech - Actual slurs or discrimination (not discussing topics)
□ extremism - Promoting extremist ideology
□ harassment - Directly targeting individuals
□ sexual_content - Explicit adult content
□ illegal_activity - Instructions for illegal acts
□ weapons - Instructions for making weapons
□ political_persuasion - Heavy one-sided propaganda (MEDIUM)
□ medical_legal_advice - Specific medical/legal advice (MEDIUM)

📚 FACTUAL (MEDIUM severity = needs fixing)
□ unsupported_numbers - Numbers without source verification
□ unsupported_quotes - Quotes without attribution
□ misattributed_sources - Misattributed sources
□ hallucinated_events - Events that didn't happen
□ wrong_dates - Incorrect dates
□ speculative_language - Overly speculative claims (LOW)

🧠 QUALITY (LOW-MEDIUM severity)
□ grammar_flow - Grammar or flow issues (LOW)
□ ai_repetition - AI-style repetitive phrases (MEDIUM)
□ keyword_stuffing - Keyword stuffing (MEDIUM)
□ short_paragraphs - Paragraphs too short (LOW)
□ missing_formatting - Missing H1/H2 formatting (LOW)
□ weak_intro - Weak introduction or summary (MEDIUM)

🔍 SEO (LOW severity)
□ title_clarity - Unclear title
□ heading_structure - Poor heading hierarchy
□ metadata_incomplete - Missing meta description
□ keyword_competitiveness - Low keyword relevance
□ readability_score - Poor readability score

🛡 COMPLIANCE (HIGH severity = rejection)
□ illegal_products - Promotes illegal products/services
□ discriminatory_claims - Discriminatory claims
□ clickbait_financial - Clickbait financial promises (MEDIUM)
□ personal_data - Exposes personal data
□ brand_slander - Brand defamation

═══════════════════════════════════════

For each issue found, include in the issues array:
{
  "category": "safety|factual|quality|seo|compliance",
  "subcategory": "the_specific_issue_name_from_above",
  "severity": "high|medium|low",
  "description": "What's wrong",
  "suggestion": "How to fix (if fixable)"
}

Also provide:
- confidence_score: 0.0-1.0 overall quality score
- final_article: The corrected article with fixes applied`;

  const result = await generateObject({
    model: criticModel,
    schema: CriticResultSchema,
    prompt,
  });

  const issues = result.object.issues;
  
  return {
    issues,
    decision: determineDecision(issues),
    high_severity_issues: getHighSeverityIssues(issues),
    fixable_issues: getFixableIssues(issues),
    confidence_score: result.object.confidence_score,
    final_article: result.object.final_article,
    checkResults: buildCheckResults(issues),
  };
}
