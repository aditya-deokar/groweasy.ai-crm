import { estimateTokenCount } from './ai-safety-redaction.js';
import type { AiBudgetLimits, AiGuardrailFinding } from './ai-safety-types.js';

export function createBudgetFindings(input: {
  rowIndex: number;
  rawData: Record<string, string>;
  limits: AiBudgetLimits;
}): AiGuardrailFinding[] {
  const findings: AiGuardrailFinding[] = [];
  let rowChars = 0;

  for (const [fieldName, value] of Object.entries(input.rawData)) {
    rowChars += value.length;
    if (value.length > input.limits.maxCellChars) {
      findings.push({
        stage: 'INPUT',
        ruleId: 'AI_INPUT_CELL_TOO_LONG',
        severity: 'HIGH',
        decision: 'BLOCK',
        message: 'CSV cell exceeds the maximum AI input length.',
        rowIndex: input.rowIndex,
        fieldName,
        metadata: {
          length: value.length,
          maxLength: input.limits.maxCellChars,
        },
      });
    }
  }

  if (rowChars > input.limits.maxRowChars) {
    findings.push({
      stage: 'INPUT',
      ruleId: 'AI_INPUT_ROW_TOO_LONG',
      severity: 'HIGH',
      decision: 'BLOCK',
      message: 'CSV row exceeds the maximum AI input length.',
      rowIndex: input.rowIndex,
      metadata: {
        length: rowChars,
        maxLength: input.limits.maxRowChars,
      },
    });
  }

  return findings;
}

export function exceedsBatchTokenBudget(input: {
  promptText: string;
  limits: AiBudgetLimits;
}): boolean {
  return estimateTokenCount(input.promptText) > input.limits.maxBatchInputTokens;
}
