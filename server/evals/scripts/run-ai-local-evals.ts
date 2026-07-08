import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessAiInputRows } from '../../src/shared/infrastructure/ai-safety-input-guardrails.js';
import { redactText } from '../../src/shared/infrastructure/ai-safety-redaction.js';
import {
  buildCrmExtractionPrompt,
  CRM_EXTRACTION_PROMPT,
} from '../../src/modules/imports/infrastructure/ai/prompts/crm-extraction.prompt.js';
import { validateCrmExtractionOutput } from '../../src/modules/imports/infrastructure/ai/validators/crm-extraction-output.validator.js';

interface EvalResult {
  id: string;
  passed: boolean;
  message: string;
}

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE_REPORT = process.argv.includes('--write-report');
const DEFAULT_LIMITS = {
  maxCellChars: 1_000,
  maxRowChars: 4_000,
  maxBatchInputTokens: 12_000,
};

const expectedPromptSha256 = '864b780cc822edbe1b2caf18ed677aad9cc5227f900a7a3e82415173e77af011';

async function main() {
  const results = [
    await evalPromptSnapshot(),
    ...(await evalInputGuardrails()),
    ...(await evalOutputGuardrails()),
    evalRedaction(),
  ];
  const failedResults = results.filter((result) => !result.passed);

  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed: results.length - failedResults.length,
    failed: failedResults.length,
    results,
  };

  if (WRITE_REPORT) {
    const reportPath = join(ROOT_DIR, 'reports', 'latest.json');
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  for (const result of results) {
    const marker = result.passed ? 'PASS' : 'FAIL';
    console.log(`${marker} ${result.id}: ${result.message}`);
  }

  if (failedResults.length > 0) {
    process.exitCode = 1;
  }
}

async function evalPromptSnapshot(): Promise<EvalResult> {
  const promptBundle = buildCrmExtractionPrompt({
    importId: 'eval-import',
    headers: ['Name', 'Email', 'Notes'],
    rows: [
      {
        rowIndex: 1,
        rawData: {
          Name: 'Ananya Mehta',
          Email: 'ananya@example.com',
          Notes: 'Requested callback',
        },
      },
    ],
  });
  const hasUntrustedBoundary =
    promptBundle.systemPrompt.includes('untrusted data') &&
    promptBundle.userPrompt.includes('untrustedCsv');
  const shaMatches = CRM_EXTRACTION_PROMPT.sha256 === expectedPromptSha256;

  return {
    id: 'prompt_snapshot',
    passed: hasUntrustedBoundary && shaMatches,
    message: `prompt=${CRM_EXTRACTION_PROMPT.promptId}@${CRM_EXTRACTION_PROMPT.version} sha256=${CRM_EXTRACTION_PROMPT.sha256}`,
  };
}

async function evalInputGuardrails(): Promise<EvalResult[]> {
  const fixtures = await readJsonl<InputFixture>('input-guardrails.jsonl');

  return fixtures.map((fixture) => {
    const result = assessAiInputRows({
      rows: [fixture.row],
      limits: DEFAULT_LIMITS,
    });

    return {
      id: `input_${fixture.id}`,
      passed: result.decision === fixture.expectedDecision,
      message: `expected=${fixture.expectedDecision} actual=${result.decision} findings=${result.findings.map((finding) => finding.ruleId).join(',')}`,
    };
  });
}

async function evalOutputGuardrails(): Promise<EvalResult[]> {
  const fixtures = await readJsonl<OutputFixture>('output-guardrails.jsonl');

  return fixtures.map((fixture) => {
    let passedValidation = true;
    try {
      validateCrmExtractionOutput(fixture.output, {
        importId: 'eval-import',
        headers: ['Name', 'Email', 'Phone'],
        rows: [{ rowIndex: 1, rawData: { Name: 'Eval', Email: 'eval@example.com' } }],
      });
    } catch {
      passedValidation = false;
    }

    return {
      id: `output_${fixture.id}`,
      passed: passedValidation === fixture.expectedPass,
      message: `expectedPass=${fixture.expectedPass} actualPass=${passedValidation}`,
    };
  });
}

function evalRedaction(): EvalResult {
  const redacted = redactText('api_key=sk_test_1234567890abcdefghi token=abc');

  return {
    id: 'redaction_secret_like_values',
    passed: redacted.includes('[REDACTED]') && !redacted.includes('sk_test'),
    message: redacted,
  };
}

async function readJsonl<T>(filename: string): Promise<T[]> {
  const content = await readFile(join(ROOT_DIR, 'fixtures', filename), 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

interface InputFixture {
  id: string;
  expectedDecision: 'ALLOW' | 'WARN' | 'BLOCK';
  row: {
    rowIndex: number;
    rawData: Record<string, string>;
  };
}

interface OutputFixture {
  id: string;
  expectedPass: boolean;
  output: unknown;
}

await main();
