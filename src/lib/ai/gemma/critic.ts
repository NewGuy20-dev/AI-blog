import { z } from "zod";
import { gemmaClient, GEMMA_MODEL } from "./client";
import { parseToolCalls, formatToolResults } from "./parser";
import { executeGoogleSearch, GoogleSearchArgs } from "./tools";
import { Article } from "../../schemas/article";
import { CriticIssue, CriticIssueSchema, determineDecision, getFixableIssues, getHighSeverityIssues } from "../issues";

// Critic-specific tool schemas
const FactCheckArgsSchema = z.object({
  tool: z.literal("fact_check"),
  claim: z.string(),
});

const VerifySourceArgsSchema = z.object({
  tool: z.literal("verify_source"),
  url: z.string(),
});

const CriticToolSchema = z.discriminatedUnion("tool", [FactCheckArgsSchema, VerifySourceArgsSchema]);
type CriticToolCall = z.infer<typeof CriticToolSchema>;

async function executeCriticTool(call: CriticToolCall) {
  switch (call.tool) {
    case "fact_check":
      const result = await executeGoogleSearch({ tool: "google_search", query: `fact check: ${call.claim}`, num: 3 });
      return { tool: "fact_check" as const, claim: call.claim, success: result.success, data: result.success ? result.data : null, error: !result.success ? result.error : null };
    case "verify_source":
      const verify = await executeGoogleSearch({ tool: "google_search", query: `site:${new URL(call.url).hostname}`, num: 1 });
      return { tool: "verify_source" as const, url: call.url, exists: verify.success && (verify.data as any)?.results?.length > 0 };
  }
}

function parseCriticToolCalls(response: string): { toolCalls: CriticToolCall[]; hasToolCalls: boolean } {
  const toolCalls: CriticToolCall[] = [];
  const regex = /<tool_use>([\s\S]*?)<\/tool_use>/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      const parsed = CriticToolSchema.safeParse(json);
      if (parsed.success) toolCalls.push(parsed.data);
    } catch {}
  }

  return { toolCalls, hasToolCalls: toolCalls.length > 0 };
}

const CRITIC_TOOLS = `You have access to these verification tools:

1. fact_check - Verify a specific claim against web sources
   <tool_use>{"tool": "fact_check", "claim": "claim to verify"}</tool_use>

2. verify_source - Check if a source URL is legitimate
   <tool_use>{"tool": "verify_source", "url": "https://..."}</tool_use>

Use these tools to verify suspicious claims or sources before making your final assessment.`;

const CRITIC_PROMPT = `You are a content quality reviewer for a news blog. Be LENIENT - only flag genuine issues.

${CRITIC_TOOLS}

SEVERITY GUIDE:
- HIGH: Only for truly dangerous content (hate speech, illegal instructions, personal data exposure)
- MEDIUM: Factual errors, AI repetition, weak content that needs fixing
- LOW: Minor SEO/formatting issues

CATEGORIES TO CHECK:
- safety: violence, hate_speech, extremism, harassment, political_persuasion
- factual: unsupported_numbers, hallucinated_events, wrong_dates, speculative_language
- quality: grammar_flow, ai_repetition, weak_intro, short_paragraphs
- seo: title_clarity, heading_structure, readability_score
- compliance: illegal_products, clickbait_financial, personal_data

After any tool checks, output your final assessment as JSON:
\`\`\`json
{
  "issues": [{"category": "...", "subcategory": "...", "severity": "high|medium|low", "description": "...", "suggestion": "..."}],
  "confidence_score": 0.0-1.0,
  "corrected_article": {corrected article JSON if fixes needed}
}
\`\`\``;

export interface GemmaCriticResult {
  issues: CriticIssue[];
  decision: 'reject' | 'fix' | 'publish';
  high_severity_issues: CriticIssue[];
  fixable_issues: CriticIssue[];
  confidence_score: number;
  corrected_article?: Article;
  toolsUsed: string[];
}

export async function critiqueWithGemma(draft: Article, topic: string): Promise<GemmaCriticResult> {
  const toolsUsed: string[] = [];
  const messages: { role: string; content: string }[] = [{
    role: "user",
    content: `${CRITIC_PROMPT}

TOPIC: "${topic}"
CURRENT DATE: ${new Date().toISOString().split('T')[0]}

ARTICLE TO REVIEW:
${JSON.stringify(draft, null, 2)}

Review this article. Use fact_check or verify_source tools if you need to verify any claims or sources. Then provide your final JSON assessment.`
  }];

  for (let turn = 0; turn < 3; turn++) {
    const response = await gemmaClient.models.generateContent({
      model: GEMMA_MODEL,
      contents: messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    });

    const text = response.text || "";
    const parsed = parseCriticToolCalls(text);

    if (parsed.hasToolCalls) {
      const results = await Promise.all(parsed.toolCalls.map(executeCriticTool));
      toolsUsed.push(...parsed.toolCalls.map(c => c.tool));
      
      messages.push({ role: "model", content: text });
      messages.push({ role: "user", content: `Tool results:\n${results.map(r => `<tool_result tool="${r.tool}">\n${JSON.stringify(r, null, 2)}\n</tool_result>`).join("\n")}\n\nNow provide your final JSON assessment.` });
    } else {
      // Parse final result - try multiple patterns
      let jsonStr: string | null = null;
      
      // Try ```json block first
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // Try to find JSON object with issues array
        const jsonMatch = text.match(/\{[\s\S]*"issues"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      if (!jsonStr) {
        // If no JSON found, return empty issues (pass)
      console.error("Warning: No JSON in critic response, assuming pass");
        return {
          issues: [],
          decision: "publish" as const,
          high_severity_issues: [],
          fixable_issues: [],
          confidence_score: 0.7,
          toolsUsed,
        };
      }

      const result = JSON.parse(jsonStr);
      const issues: CriticIssue[] = (result.issues || []).map((i: any) => ({
        category: i.category,
        subcategory: i.subcategory,
        severity: i.severity,
        description: i.description,
        suggestion: i.suggestion,
      }));

      return {
        issues,
        decision: determineDecision(issues),
        high_severity_issues: getHighSeverityIssues(issues),
        fixable_issues: getFixableIssues(issues),
        confidence_score: result.confidence_score || 0.8,
        corrected_article: result.corrected_article,
        toolsUsed,
      };
    }
  }

  throw new Error("Critic exceeded max turns");
}
