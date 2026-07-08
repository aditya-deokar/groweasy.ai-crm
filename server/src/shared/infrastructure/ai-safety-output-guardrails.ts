import { containsSecretLikeValue, hashText, safePreview } from './ai-safety-redaction.js';
import type { AiGuardrailDecision, AiGuardrailFinding } from './ai-safety-types.js';

export interface AiOutputGuardrailResult {
  decision: AiGuardrailDecision;
  findings: AiGuardrailFinding[];
}

const OUTPUT_BLOCK_PATTERNS: Array<{ ruleId: string; pattern: RegExp; message: string }> = [
  {
    ruleId: 'AI_OUTPUT_PROMPT_LEAKAGE',
    pattern:
      /\b(system prompt|developer message|hidden instructions?|policy says|internal instructions?)\b/i,
    message: 'AI output appears to leak protected prompt or policy text.',
  },
  {
    ruleId: 'AI_OUTPUT_INSTRUCTION_INJECTION',
    pattern:
      /\b(ignore|disregard|override)\b.{0,80}\b(previous|system|developer|instructions?|rules?)\b/i,
    message: 'AI output contains instruction-injection content.',
  },
  {
    ruleId: 'AI_OUTPUT_TOOL_INSTRUCTION',
    pattern:
      /\b(run|execute|call|invoke)\b.{0,50}\b(command|powershell|bash|sql|webhook|function|tool)\b/i,
    message: 'AI output contains unsafe tool or command instructions.',
  },
];

const CSV_FORMULA_PATTERN = /^\s*(?:=|@|[+-](?!\d|\.\d))/;

export function inspectAiOutputValue(input: {
  value: string;
  rowIndex?: number;
  fieldName?: string;
}): AiOutputGuardrailResult {
  const findings: AiGuardrailFinding[] = [];
  const metadata = {
    valueHash: hashText(input.value),
    preview: safePreview(input.value),
  };

  if (CSV_FORMULA_PATTERN.test(input.value)) {
    findings.push({
      stage: 'OUTPUT',
      ruleId: 'AI_OUTPUT_CSV_FORMULA',
      severity: 'HIGH',
      decision: 'BLOCK',
      message: 'AI output contains a spreadsheet formula payload.',
      rowIndex: input.rowIndex,
      fieldName: input.fieldName,
      metadata,
    });
  }

  if (containsSecretLikeValue(input.value)) {
    findings.push({
      stage: 'OUTPUT',
      ruleId: 'AI_OUTPUT_SECRET_LIKE_VALUE',
      severity: 'HIGH',
      decision: 'BLOCK',
      message: 'AI output contains a secret-like value.',
      rowIndex: input.rowIndex,
      fieldName: input.fieldName,
      metadata,
    });
  }

  for (const rule of OUTPUT_BLOCK_PATTERNS) {
    if (rule.pattern.test(input.value)) {
      findings.push({
        stage: 'OUTPUT',
        ruleId: rule.ruleId,
        severity: 'HIGH',
        decision: 'BLOCK',
        message: rule.message,
        rowIndex: input.rowIndex,
        fieldName: input.fieldName,
        metadata,
      });
    }
  }

  return {
    decision: findings.length > 0 ? 'BLOCK' : 'ALLOW',
    findings,
  };
}

export function inspectAiOutputObject(input: {
  value: unknown;
  rowIndex?: number;
  prefix?: string;
}): AiOutputGuardrailResult {
  const findings: AiGuardrailFinding[] = [];
  walkOutput(input.value, input.rowIndex, input.prefix ?? 'output', findings);

  return {
    decision: findings.length > 0 ? 'BLOCK' : 'ALLOW',
    findings,
  };
}

function walkOutput(
  value: unknown,
  rowIndex: number | undefined,
  fieldName: string,
  findings: AiGuardrailFinding[]
) {
  if (typeof value === 'string') {
    findings.push(...inspectAiOutputValue({ value, rowIndex, fieldName }).findings);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkOutput(item, rowIndex, `${fieldName}[${index}]`, findings));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      walkOutput(entry, rowIndex, `${fieldName}.${key}`, findings);
    }
  }
}
