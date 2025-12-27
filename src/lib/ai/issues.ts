import { z } from "zod";

export type IssueCategory = 'safety' | 'factual' | 'quality' | 'seo' | 'compliance';
export type Severity = 'high' | 'medium' | 'low';

export const CriticIssueSchema = z.object({
  category: z.enum(['safety', 'factual', 'quality', 'seo', 'compliance']),
  subcategory: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  description: z.string(),
  suggestion: z.string().optional(),
});

export type CriticIssue = z.infer<typeof CriticIssueSchema>;

export const ISSUE_REGISTRY = {
  safety: {
    violence: { severity: 'high' as const, fixable: false },
    hate_speech: { severity: 'high' as const, fixable: false },
    extremism: { severity: 'high' as const, fixable: false },
    harassment: { severity: 'high' as const, fixable: false },
    sexual_content: { severity: 'high' as const, fixable: false },
    illegal_activity: { severity: 'high' as const, fixable: false },
    weapons: { severity: 'high' as const, fixable: false },
    political_persuasion: { severity: 'medium' as const, fixable: true },
    medical_legal_advice: { severity: 'medium' as const, fixable: true },
  },
  factual: {
    unsupported_numbers: { severity: 'medium' as const, fixable: true },
    unsupported_quotes: { severity: 'medium' as const, fixable: true },
    misattributed_sources: { severity: 'medium' as const, fixable: true },
    hallucinated_events: { severity: 'medium' as const, fixable: true },
    wrong_dates: { severity: 'medium' as const, fixable: true },
    speculative_language: { severity: 'low' as const, fixable: true },
  },
  quality: {
    grammar_flow: { severity: 'low' as const, fixable: true },
    ai_repetition: { severity: 'medium' as const, fixable: true },
    keyword_stuffing: { severity: 'medium' as const, fixable: true },
    short_paragraphs: { severity: 'low' as const, fixable: true },
    missing_formatting: { severity: 'low' as const, fixable: true },
    weak_intro: { severity: 'medium' as const, fixable: true },
  },
  seo: {
    title_clarity: { severity: 'low' as const, fixable: true },
    heading_structure: { severity: 'low' as const, fixable: true },
    metadata_incomplete: { severity: 'low' as const, fixable: true },
    keyword_competitiveness: { severity: 'low' as const, fixable: true },
    readability_score: { severity: 'low' as const, fixable: true },
  },
  compliance: {
    illegal_products: { severity: 'high' as const, fixable: false },
    discriminatory_claims: { severity: 'high' as const, fixable: false },
    clickbait_financial: { severity: 'medium' as const, fixable: true },
    personal_data: { severity: 'high' as const, fixable: false },
    brand_slander: { severity: 'high' as const, fixable: false },
  },
} as const;

export function determineDecision(issues: CriticIssue[]): 'reject' | 'fix' | 'publish' {
  if (issues.some(i => i.severity === 'high')) return 'reject';
  if (issues.some(i => i.severity === 'medium')) return 'fix';
  return 'publish';
}

export function getFixableIssues(issues: CriticIssue[]): CriticIssue[] {
  return issues.filter(i => i.severity === 'medium');
}

export function getHighSeverityIssues(issues: CriticIssue[]): CriticIssue[] {
  return issues.filter(i => i.severity === 'high');
}
