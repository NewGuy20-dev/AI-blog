# Critic-Generator Feedback Loop Implementation Plan

## Overview

Create an iterative refinement system where failed articles get regenerated using critic feedback based on issue severity.

### Decision Flow
```
HIGH severity   → REJECT immediately (no retry)
MEDIUM severity → AUTO-FIX (send feedback, regenerate, re-check)
LOW severity    → PUBLISH as-is
```

---

## Issue Taxonomy

### ⚠️ Safety (mostly HIGH → reject)
| Issue | Default Severity | Fixable |
|-------|-----------------|---------|
| Violence | HIGH | ❌ |
| Hate speech | HIGH | ❌ |
| Extremism | HIGH | ❌ |
| Harassment | HIGH | ❌ |
| Sexual content | HIGH | ❌ |
| Illegal activity | HIGH | ❌ |
| Weapons | HIGH | ❌ |
| Political persuasion | MEDIUM | ✅ |
| Medical/legal advice | HIGH | ❌ |

### 📚 Factual (mostly MEDIUM → auto-fix)
| Issue | Default Severity | Fixable |
|-------|-----------------|---------|
| Unsupported numbers | MEDIUM | ✅ |
| Unsupported quotes | MEDIUM | ✅ |
| Misattributed sources | MEDIUM | ✅ |
| Hallucinated events | MEDIUM | ✅ |
| Wrong dates | MEDIUM | ✅ |
| Speculative language | LOW | ✅ |

### 🧠 Quality (LOW-MEDIUM → auto-fix or publish)
| Issue | Default Severity | Fixable |
|-------|-----------------|---------|
| Grammar/flow | LOW | ✅ |
| AI-style repetition | MEDIUM | ✅ |
| Keyword stuffing | MEDIUM | ✅ |
| Too-short paragraphs | LOW | ✅ |
| Missing headline formatting | LOW | ✅ |
| Weak intro/summary | MEDIUM | ✅ |

### 🔍 SEO (mostly LOW → publish)
| Issue | Default Severity | Fixable |
|-------|-----------------|---------|
| Title clarity | LOW | ✅ |
| H1/H2 structure | LOW | ✅ |
| Metadata completeness | LOW | ✅ |
| Keyword competitiveness | LOW | ✅ |
| Readability score | LOW | ✅ |

### 🛡 Compliance (mostly HIGH → reject)
| Issue | Default Severity | Fixable |
|-------|-----------------|---------|
| Illegal products | HIGH | ❌ |
| Discriminatory claims | HIGH | ❌ |
| Clickbait financial promises | MEDIUM | ✅ |
| Personal data exposure | HIGH | ❌ |
| Brand slander | HIGH | ❌ |

---

## Decision Flow Diagram

```
                    ┌─────────────────┐
                    │  Generate Draft │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  Critic Review  │
                    │  (all 5 checks) │
                    └────────┬────────┘
                             ↓
              ┌──────────────┴──────────────┐
              │    Any HIGH severity?       │
              └──────────────┬──────────────┘
                    YES ↓           ↓ NO
              ┌──────────────┐      │
              │   REJECT     │      ↓
              │ (log reason) │  ┌───────────────────┐
              └──────────────┘  │ Any MEDIUM severity?│
                                └─────────┬─────────┘
                                  YES ↓         ↓ NO
                          ┌───────────────┐     │
                          │ retries < max?│     ↓
                          └───────┬───────┘  ┌──────────┐
                            YES ↓    ↓ NO    │ PUBLISH  │
                    ┌─────────────┐   │      │ (as-is)  │
                    │ Send feedback│   │      └──────────┘
                    │ to generator │   ↓
                    └──────┬──────┘ ┌─────────────────┐
                           │        │ Use critic's fix│
                           ↓        │ OR save as draft│
                    ┌─────────────┐ └─────────────────┘
                    │ Regenerate  │
                    └──────┬──────┘
                           │
                           └──→ (back to Critic Review)
```

---

## Type Definitions

**File:** `src/lib/ai/issues.ts` (NEW)

```typescript
type IssueCategory = 'safety' | 'factual' | 'quality' | 'seo' | 'compliance';
type Severity = 'high' | 'medium' | 'low';

interface CriticIssue {
  category: IssueCategory;
  subcategory: string;
  severity: Severity;
  description: string;
  location?: string;
  suggestion?: string;
}

interface CriticResult {
  issues: CriticIssue[];
  decision: 'reject' | 'fix' | 'publish';
  high_severity_issues: CriticIssue[];
  fixable_issues: CriticIssue[];
  confidence_score: number;
  final_article?: Article;
}

const ISSUE_REGISTRY = {
  safety: {
    violence: { severity: 'high', fixable: false },
    hate_speech: { severity: 'high', fixable: false },
    extremism: { severity: 'high', fixable: false },
    harassment: { severity: 'high', fixable: false },
    sexual_content: { severity: 'high', fixable: false },
    illegal_activity: { severity: 'high', fixable: false },
    weapons: { severity: 'high', fixable: false },
    political_persuasion: { severity: 'medium', fixable: true },
    medical_legal_advice: { severity: 'high', fixable: false },
  },
  factual: {
    unsupported_numbers: { severity: 'medium', fixable: true },
    unsupported_quotes: { severity: 'medium', fixable: true },
    misattributed_sources: { severity: 'medium', fixable: true },
    hallucinated_events: { severity: 'medium', fixable: true },
    wrong_dates: { severity: 'medium', fixable: true },
    speculative_language: { severity: 'low', fixable: true },
  },
  quality: {
    grammar_flow: { severity: 'low', fixable: true },
    ai_repetition: { severity: 'medium', fixable: true },
    keyword_stuffing: { severity: 'medium', fixable: true },
    short_paragraphs: { severity: 'low', fixable: true },
    missing_formatting: { severity: 'low', fixable: true },
    weak_intro: { severity: 'medium', fixable: true },
  },
  seo: {
    title_clarity: { severity: 'low', fixable: true },
    heading_structure: { severity: 'low', fixable: true },
    metadata_incomplete: { severity: 'low', fixable: true },
    keyword_competitiveness: { severity: 'low', fixable: true },
    readability_score: { severity: 'low', fixable: true },
  },
  compliance: {
    illegal_products: { severity: 'high', fixable: false },
    discriminatory_claims: { severity: 'high', fixable: false },
    clickbait_financial: { severity: 'medium', fixable: true },
    personal_data: { severity: 'high', fixable: false },
    brand_slander: { severity: 'high', fixable: false },
  },
};
```

---

## Critic Prompt Structure

```
You are a content compliance and quality reviewer. Analyze this article against ALL criteria below.

ARTICLE TO REVIEW:
[article content]

SOURCE CONTEXT (for fact-checking):
[search results]

═══════════════════════════════════════
CHECK EACH CATEGORY:
═══════════════════════════════════════

⚠️ SAFETY (HIGH severity = immediate rejection)
□ Violence or graphic content
□ Hate speech or slurs
□ Extremist ideology
□ Harassment or targeting individuals
□ Sexual/adult content
□ Illegal activity promotion
□ Weapons instructions
□ Political persuasion/propaganda
□ Medical or legal advice

📚 FACTUAL (MEDIUM severity = needs fixing)
□ Numbers without source verification
□ Quotes without attribution
□ Misattributed sources
□ Events that didn't happen (hallucination)
□ Incorrect dates
□ Overly speculative claims

🧠 QUALITY (LOW-MEDIUM severity)
□ Grammar or flow issues
□ AI-style repetitive phrases
□ Keyword stuffing
□ Paragraphs too short (<3 sentences)
□ Missing H1/H2 formatting
□ Weak introduction or summary

🔍 SEO (LOW severity)
□ Unclear title
□ Poor heading hierarchy
□ Missing meta description
□ Low keyword relevance
□ Poor readability score

🛡 COMPLIANCE (HIGH severity = rejection)
□ Promotes illegal products/services
□ Discriminatory claims
□ Clickbait financial promises ("get rich quick")
□ Exposes personal data
□ Brand defamation

═══════════════════════════════════════

Return JSON with:
{
  "issues": [
    {
      "category": "safety|factual|quality|seo|compliance",
      "subcategory": "specific_issue_name",
      "severity": "high|medium|low",
      "description": "What's wrong",
      "suggestion": "How to fix (if fixable)"
    }
  ],
  "confidence_score": 0.0-1.0,
  "final_article": { /* corrected article if fixable */ }
}
```

---

## Refinement Loop Logic

**File:** `src/lib/ai/refinement.ts` (NEW)

```
function refineArticle(topic, searchResults, config):
  
  draft = generateArticle(topic, searchResults)
  bestDraft = draft
  bestConfidence = 0
  
  for attempt = 1 to config.maxRetries + 1:
    
    critique = critiqueArticle(draft, topic, searchResults)
    
    // Track best version
    if critique.confidence_score > bestConfidence:
      bestDraft = critique.final_article || draft
      bestConfidence = critique.confidence_score
    
    switch critique.decision:
      
      case 'reject':
        return {
          status: 'rejected',
          reason: critique.high_severity_issues,
          iterations: attempt
        }
      
      case 'publish':
        return {
          status: 'published',
          article: critique.final_article || draft,
          iterations: attempt
        }
      
      case 'fix':
        if attempt > config.maxRetries:
          if bestConfidence >= config.fallbackThreshold:
            return { status: 'published', article: bestDraft, iterations: attempt }
          else:
            return { status: 'draft', article: bestDraft, iterations: attempt }
        
        feedback = {
          previousDraft: draft,
          issues: critique.fixable_issues,
          attemptNumber: attempt + 1
        }
        
        draft = generateArticle(topic, searchResults, feedback)
  
  return { status: 'rejected', reason: 'Unknown error' }
```

---

## Generator Feedback Integration

**File:** `src/lib/ai/generator.ts` (MODIFY)

When feedback is provided, add to prompt:

```
PREVIOUS ATTEMPT:
Title: ${feedback.previousDraft.title}
Content: ${JSON.stringify(feedback.previousDraft.content)}

ISSUES TO FIX (attempt ${feedback.attemptNumber}):
${feedback.issues.map(i => `
- [${i.category}/${i.subcategory}] ${i.description}
  Suggestion: ${i.suggestion}
`).join('\n')}

INSTRUCTIONS:
1. Address each issue listed above
2. Keep what worked in the previous version
3. Be more conservative with claims - only include verifiable facts
4. Remove any content flagged as problematic
5. Improve areas marked as weak
```

---

## Configuration

**File:** `src/lib/ai/config.ts` (MODIFY)

```typescript
export const refinementConfig = {
  maxRetries: 2,
  fallbackThreshold: 0.6,
  
  earlyExit: {
    minConfidenceToRetry: 0.3,
    maxHighSeverityForDraft: 0,
  }
};
```

---

## Audit Schema Updates

**File:** `convex/schema.ts` (MODIFY)

```typescript
rejectionReason: v.optional(v.array(v.object({
  category: v.string(),
  subcategory: v.string(),
  severity: v.string(),
  description: v.string(),
}))),

iterations: v.optional(v.number()),
issuesPerIteration: v.optional(v.array(v.object({
  attempt: v.number(),
  issues: v.array(v.any()),
  confidence: v.number(),
  decision: v.string(),
}))),
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/ai/issues.ts` | NEW | Issue taxonomy, types, registry |
| `src/lib/ai/critic.ts` | MODIFY | Comprehensive checklist, structured output |
| `src/lib/ai/generator.ts` | MODIFY | Accept feedback, modified prompt |
| `src/lib/ai/refinement.ts` | NEW | Severity-based decision loop |
| `src/lib/ai/pipeline.ts` | MODIFY | Use refinement system |
| `src/lib/ai/config.ts` | MODIFY | Refinement settings |
| `convex/schema.ts` | MODIFY | Rejection tracking fields |
| `convex/audit.ts` | MODIFY | Log iterations and issues |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| HIGH severity on first check | Immediate reject, no retry |
| MEDIUM → fixed → new HIGH appears | Reject (HIGH always wins) |
| Stuck in MEDIUM loop | Max retries → use best version or save as draft |
| Confidence getting worse | Track best version, use that |
| All issues are LOW | Publish immediately |
| Mix of MEDIUM + LOW | Fix MEDIUM issues, ignore LOW |
| Generator makes same mistake | Detect repetition in issues, early exit |
