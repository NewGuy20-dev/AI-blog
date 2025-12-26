import { Article } from "../schemas/article";
import { SearchResult } from "./search";
import { generateArticle } from "./generator";
import { critiqueArticle, CriticResult } from "./critic";
import { CriticIssue } from "./issues";
import { refinementConfig } from "./config";

export interface RefinementResult {
  status: 'published' | 'rejected' | 'draft';
  article?: Article;
  reason?: CriticIssue[];
  iterations: number;
  history: Array<{
    attempt: number;
    decision: string;
    confidence: number;
    issueCount: number;
  }>;
}

export async function refineArticle(
  topic: string,
  searchResults: SearchResult[],
  onIteration?: (attempt: number, critique: CriticResult) => Promise<void>
): Promise<RefinementResult> {
  const { maxRetries, fallbackThreshold } = refinementConfig;
  
  let draft = await generateArticle(topic, searchResults);
  let bestDraft = draft;
  let bestConfidence = 0;
  const history: RefinementResult['history'] = [];

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const critique = await critiqueArticle(draft, topic, searchResults);
    
    history.push({
      attempt,
      decision: critique.decision,
      confidence: critique.confidence_score,
      issueCount: critique.issues.length,
    });

    if (onIteration) {
      await onIteration(attempt, critique);
    }

    // Track best version
    if (critique.confidence_score > bestConfidence) {
      bestDraft = critique.final_article;
      bestConfidence = critique.confidence_score;
    }

    // Decision based on severity
    if (critique.decision === 'reject') {
      return {
        status: 'rejected',
        reason: critique.high_severity_issues,
        iterations: attempt,
        history,
      };
    }

    if (critique.decision === 'publish') {
      return {
        status: 'published',
        article: critique.final_article,
        iterations: attempt,
        history,
      };
    }

    // decision === 'fix'
    if (attempt > maxRetries) {
      // Out of retries - use best version or save as draft
      if (bestConfidence >= fallbackThreshold) {
        return {
          status: 'published',
          article: bestDraft,
          iterations: attempt,
          history,
        };
      }
      return {
        status: 'draft',
        article: bestDraft,
        reason: critique.fixable_issues,
        iterations: attempt,
        history,
      };
    }

    // Regenerate with feedback
    draft = await generateArticle(topic, searchResults, {
      previousDraft: draft,
      issues: critique.fixable_issues,
      attemptNumber: attempt + 1,
    });
  }

  return {
    status: 'rejected',
    reason: [],
    iterations: maxRetries + 1,
    history,
  };
}
