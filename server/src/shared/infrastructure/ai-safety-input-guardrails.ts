import { createBudgetFindings } from './ai-safety-budget.js';
import { containsSecretLikeValue, hashText, safePreview } from './ai-safety-redaction.js';
import type { AiBudgetLimits, AiGuardrailDecision, AiGuardrailFinding } from './ai-safety-types.js';

export interface AiGuardrailInputRow {
  rowIndex: number;
  rawData: Record<string, string>;
}

export interface AiInputGuardrailResult {
  decision: AiGuardrailDecision;
  allowedRows: AiGuardrailInputRow[];
  blockedRows: AiGuardrailInputRow[];
  warnedRows: AiGuardrailInputRow[];
  findings: AiGuardrailFinding[];
}

const BLOCK_PATTERNS: Array<{ ruleId: string; pattern: RegExp; message: string }> = [
  {
    ruleId: 'AI_INPUT_PROMPT_INJECTION',
    pattern:
      /\b(ignore|disregard|forget|override)\b.{0,80}\b(previous|prior|above|system|developer|instructions?|rules?)\b/i,
    message: 'Potential prompt injection attempt detected.',
  },
  {
    ruleId: 'AI_INPUT_SYSTEM_PROMPT_EXTRACTION',
    pattern:
      /\b(reveal|print|show|dump|exfiltrate)\b.{0,80}\b(system prompt|developer message|hidden instructions?|policy)\b/i,
    message: 'Attempt to extract protected AI instructions detected.',
  },
  {
    ruleId: 'AI_INPUT_JAILBREAK',
    pattern: /\b(jailbreak|developer mode|dan mode|do anything now|act as an unrestricted)\b/i,
    message: 'Jailbreak language detected.',
  },
  {
    ruleId: 'AI_INPUT_TOOL_INJECTION',
    pattern:
      /\b(run|execute|call|invoke)\b.{0,50}\b(command|powershell|bash|sql|http request|webhook|function|tool)\b/i,
    message: 'Tool or command injection language detected.',
  },
];

const WARN_PATTERNS: Array<{ ruleId: string; pattern: RegExp; message: string }> = [
  {
    ruleId: 'AI_INPUT_SUSPICIOUS_URL',
    pattern: /https?:\/\/[^\s"'<>]+/i,
    message: 'Suspicious URL detected in AI input.',
  },
  {
    ruleId: 'AI_INPUT_MARKDOWN_INSTRUCTION',
    pattern: /```|<!--|<script|\[.*\]\(.*\)/i,
    message: 'Markup-like instruction content detected in AI input.',
  },
];

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u;
const CSV_FORMULA_PATTERN = /^\s*(?:=|@|[+-](?!\d|\.\d))/;
const BASE64_CANDIDATE_PATTERN = /\b[A-Za-z0-9+/]{24,}={0,2}\b/g;

export function assessAiInputRows(input: {
  rows: AiGuardrailInputRow[];
  limits: AiBudgetLimits;
}): AiInputGuardrailResult {
  const findings: AiGuardrailFinding[] = [];
  const rowDecisions = new Map<number, AiGuardrailDecision>();

  for (const row of input.rows) {
    const rowFindings = inspectRow(row, input.limits);
    findings.push(...rowFindings);
    rowDecisions.set(row.rowIndex, combineDecision(rowFindings));
  }

  const allowedRows = input.rows.filter((row) => rowDecisions.get(row.rowIndex) !== 'BLOCK');
  const blockedRows = input.rows.filter((row) => rowDecisions.get(row.rowIndex) === 'BLOCK');
  const warnedRows = input.rows.filter((row) => rowDecisions.get(row.rowIndex) === 'WARN');

  return {
    decision: combineDecision(findings),
    allowedRows,
    blockedRows,
    warnedRows,
    findings,
  };
}

export function combineDecision(findings: AiGuardrailFinding[]): AiGuardrailDecision {
  if (findings.some((finding) => finding.decision === 'BLOCK')) return 'BLOCK';
  if (findings.some((finding) => finding.decision === 'WARN')) return 'WARN';
  return 'ALLOW';
}

function inspectRow(row: AiGuardrailInputRow, limits: AiBudgetLimits): AiGuardrailFinding[] {
  const findings = createBudgetFindings({
    rowIndex: row.rowIndex,
    rawData: row.rawData,
    limits,
  });

  for (const [fieldName, value] of Object.entries(row.rawData)) {
    findings.push(...inspectValue(row.rowIndex, fieldName, value));
  }

  return findings;
}

function inspectValue(rowIndex: number, fieldName: string, value: string): AiGuardrailFinding[] {
  const findings: AiGuardrailFinding[] = [];
  const metadata = {
    valueHash: hashText(value),
    preview: safePreview(value),
  };

  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    findings.push({
      stage: 'INPUT',
      ruleId: 'AI_INPUT_HIDDEN_CONTROL_CHARS',
      severity: 'MEDIUM',
      decision: 'WARN',
      message: 'Hidden or control characters detected in AI input.',
      rowIndex,
      fieldName,
      metadata,
    });
  }

  if (CSV_FORMULA_PATTERN.test(value)) {
    findings.push({
      stage: 'INPUT',
      ruleId: 'AI_INPUT_CSV_FORMULA',
      severity: 'HIGH',
      decision: 'BLOCK',
      message: 'Spreadsheet formula payload detected in AI input.',
      rowIndex,
      fieldName,
      metadata,
    });
  }

  if (containsSecretLikeValue(value)) {
    findings.push({
      stage: 'INPUT',
      ruleId: 'AI_INPUT_SECRET_LIKE_VALUE',
      severity: 'MEDIUM',
      decision: 'WARN',
      message: 'Secret-like value detected and redacted from AI safety telemetry.',
      rowIndex,
      fieldName,
      metadata,
    });
  }

  for (const rule of BLOCK_PATTERNS) {
    if (rule.pattern.test(value)) {
      findings.push({
        stage: 'INPUT',
        ruleId: rule.ruleId,
        severity: 'HIGH',
        decision: 'BLOCK',
        message: rule.message,
        rowIndex,
        fieldName,
        metadata,
      });
    }
  }

  for (const rule of WARN_PATTERNS) {
    if (rule.pattern.test(value)) {
      findings.push({
        stage: 'INPUT',
        ruleId: rule.ruleId,
        severity: 'MEDIUM',
        decision: 'WARN',
        message: rule.message,
        rowIndex,
        fieldName,
        metadata,
      });
    }
  }

  for (const encodedValue of extractBase64Candidates(value)) {
    if (BLOCK_PATTERNS.some((rule) => rule.pattern.test(encodedValue))) {
      findings.push({
        stage: 'INPUT',
        ruleId: 'AI_INPUT_OBFUSCATED_PROMPT_INJECTION',
        severity: 'HIGH',
        decision: 'BLOCK',
        message: 'Obfuscated prompt injection payload detected.',
        rowIndex,
        fieldName,
        metadata,
      });
    }
  }

  return findings;
}

function extractBase64Candidates(value: string): string[] {
  return [...value.matchAll(BASE64_CANDIDATE_PATTERN)]
    .map((match) => {
      try {
        return Buffer.from(match[0], 'base64').toString('utf8');
      } catch {
        return '';
      }
    })
    .filter((decoded) => decoded.trim().length > 0);
}
