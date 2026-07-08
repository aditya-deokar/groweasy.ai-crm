export const AI_GUARDRAIL_DECISIONS = ['ALLOW', 'WARN', 'BLOCK'] as const;
export type AiGuardrailDecision = (typeof AI_GUARDRAIL_DECISIONS)[number];

export const AI_GUARDRAIL_STAGES = ['INPUT', 'OUTPUT'] as const;
export type AiGuardrailStage = (typeof AI_GUARDRAIL_STAGES)[number];

export const AI_GUARDRAIL_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type AiGuardrailSeverity = (typeof AI_GUARDRAIL_SEVERITIES)[number];

export interface AiPromptVersion {
  promptId: string;
  version: string;
  feature: string;
  active: boolean;
  systemPrompt: string;
  sha256: string;
}

export interface AiPromptBundle {
  prompt: AiPromptVersion;
  systemPrompt: string;
  userPrompt: string;
}

export interface AiGuardrailFinding {
  stage: AiGuardrailStage;
  ruleId: string;
  severity: AiGuardrailSeverity;
  decision: AiGuardrailDecision;
  message: string;
  rowIndex?: number;
  fieldName?: string;
  metadata?: Record<string, unknown>;
}

export interface AiSafetySummary {
  promptVersion: string | null;
  provider: 'gemini' | 'openai' | null;
  model: string | null;
  blockedRows: number;
  warnedRows: number;
  outputRejectedBatches: number;
  safetyEvents: number;
}

export interface AiModelCallMetadata {
  feature: string;
  provider: 'gemini' | 'openai';
  model: string;
  promptId: string;
  promptVersion: string;
  promptSha256: string;
  inputHash: string;
  outputHash: string | null;
  inputTokens: number;
  outputTokens: number | null;
  latencyMs: number;
  outcome: 'SUCCEEDED' | 'FAILED' | 'OUTPUT_REJECTED';
  errorCode?: string;
  guardrailSummary?: Record<string, unknown>;
}

export interface AiBudgetLimits {
  maxCellChars: number;
  maxRowChars: number;
  maxBatchInputTokens: number;
}
