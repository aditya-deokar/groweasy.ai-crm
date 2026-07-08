import type { Env } from '../../../../config/env.js';
import {
  AiInvalidStructuredOutputError,
  AiProviderUnavailableError,
} from '../../domain/errors/import-errors.js';
import type {
  AiCrmExtractionBatchResult,
  AiCrmExtractionInput,
  AiCrmExtractor,
} from '../../domain/ports/ai-extractor.port.js';
import { buildCrmExtractionPrompt } from './prompts/crm-extraction.prompt.js';
import { geminiCrmExtractionJsonSchema } from './schemas/gemini-crm-extraction.schema.js';
import { validateCrmExtractionOutput } from './validators/crm-extraction-output.validator.js';
import {
  estimateTokenCount,
  hashText,
} from '../../../../shared/infrastructure/ai-safety-redaction.js';

const GEMINI_GENERATE_CONTENT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type FetchLike = typeof fetch;

interface GeminiGenerateContentResponse {
  output_text?: unknown;
  outputText?: unknown;
  text?: unknown;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: unknown;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message?: unknown;
    status?: unknown;
  };
}

export class GeminiCrmExtractor implements AiCrmExtractor {
  public constructor(
    private readonly config: Env,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  public async extractBatch(input: AiCrmExtractionInput): Promise<AiCrmExtractionBatchResult> {
    if (!this.config.geminiApiKey) {
      throw new AiProviderUnavailableError('GEMINI_API_KEY is required for Gemini extraction.');
    }

    const startedAt = Date.now();
    const promptBundle = buildCrmExtractionPrompt(input);

    try {
      const response = await this.fetchImpl(getGeminiGenerateContentUrl(this.config.geminiModel), {
        method: 'POST',
        signal: AbortSignal.timeout(this.config.aiProviderTimeoutMs),
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.geminiApiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: promptBundle.systemPrompt,
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: promptBundle.userPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: this.config.aiTemperature,
            responseMimeType: 'application/json',
            responseSchema: geminiCrmExtractionJsonSchema,
          },
        }),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        const providerMessage = extractProviderErrorMessage(responseBody);

        throw new AiProviderUnavailableError(buildProviderFailureMessage(providerMessage), {
          provider: 'gemini',
          status: response.status,
          statusText: response.statusText,
          bodyHash: hashText(responseBody),
          providerMessage,
        });
      }

      const responseBody = (await response.json()) as GeminiGenerateContentResponse;
      const outputText = extractGeminiOutputText(responseBody);
      const output = parseGeminiJsonOutput(outputText);
      const result = validateCrmExtractionOutput(output, input, {
        defaultPhoneRegion: this.config.defaultPhoneRegion,
      });

      return {
        ...result,
        metadata: {
          feature: promptBundle.prompt.feature,
          provider: 'gemini',
          model: this.config.geminiModel,
          promptId: promptBundle.prompt.promptId,
          promptVersion: promptBundle.prompt.version,
          promptSha256: promptBundle.prompt.sha256,
          inputHash: hashText(`${promptBundle.systemPrompt}\n${promptBundle.userPrompt}`),
          outputHash: hashText(outputText),
          inputTokens: estimateTokenCount(promptBundle.userPrompt),
          outputTokens: estimateTokenCount(outputText),
          latencyMs: Date.now() - startedAt,
          outcome: 'SUCCEEDED',
        },
      };
    } catch (error) {
      if (
        error instanceof AiInvalidStructuredOutputError ||
        error instanceof AiProviderUnavailableError
      ) {
        throw error;
      }

      throw new AiProviderUnavailableError('Gemini extraction request failed.', {
        provider: 'gemini',
        message: error instanceof Error ? error.message : 'Unknown Gemini provider error.',
      });
    }
  }
}

function extractGeminiOutputText(response: GeminiGenerateContentResponse): string {
  const directText = firstString(response.output_text, response.outputText, response.text);
  if (directText) {
    return directText;
  }

  const candidateText = response.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('');

  if (candidateText) {
    return candidateText;
  }

  throw new AiInvalidStructuredOutputError({
    code: 'GEMINI_OUTPUT_TEXT_MISSING',
    responseKeys: Object.keys(response),
  });
}

function getGeminiGenerateContentUrl(model: string): string {
  const normalizedModel = model.startsWith('models/') ? model.slice('models/'.length) : model;
  return `${GEMINI_GENERATE_CONTENT_BASE_URL}/${encodeURIComponent(normalizedModel)}:generateContent`;
}

function parseGeminiJsonOutput(outputText: string): unknown {
  try {
    return JSON.parse(stripJsonFence(outputText));
  } catch (error) {
    throw new AiInvalidStructuredOutputError({
      code: 'GEMINI_OUTPUT_JSON_PARSE_FAILED',
      message: error instanceof Error ? error.message : 'Unknown JSON parse error.',
    });
  }
}

function stripJsonFence(value: string): string {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedMatch?.[1]?.trim() ?? trimmed;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function buildProviderFailureMessage(providerMessage: string | null): string {
  return providerMessage
    ? `Gemini extraction request failed: ${providerMessage}`
    : 'Gemini extraction request failed.';
}

function extractProviderErrorMessage(responseBody: string): string | null {
  try {
    const parsed = JSON.parse(responseBody) as GeminiErrorResponse;
    return firstString(parsed.error?.message, parsed.error?.status);
  } catch {
    return null;
  }
}
