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
import {
  buildCrmExtractionUserPrompt,
  CRM_EXTRACTION_SYSTEM_PROMPT,
} from './prompts/crm-extraction.prompt.js';
import { geminiCrmExtractionJsonSchema } from './schemas/gemini-crm-extraction.schema.js';
import { validateCrmExtractionOutput } from './validators/crm-extraction-output.validator.js';

const GEMINI_GENERATE_CONTENT_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';
const PROVIDER_ERROR_BODY_MAX_LENGTH = 500;

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

export class GeminiCrmExtractor implements AiCrmExtractor {
  public constructor(
    private readonly config: Env,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  public async extractBatch(input: AiCrmExtractionInput): Promise<AiCrmExtractionBatchResult> {
    if (!this.config.geminiApiKey) {
      throw new AiProviderUnavailableError('GEMINI_API_KEY is required for Gemini extraction.');
    }

    try {
      const response = await this.fetchImpl(getGeminiGenerateContentUrl(this.config.geminiModel), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.geminiApiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: CRM_EXTRACTION_SYSTEM_PROMPT,
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: buildCrmExtractionUserPrompt(input),
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
        throw new AiProviderUnavailableError('Gemini extraction request failed.', {
          provider: 'gemini',
          status: response.status,
          statusText: response.statusText,
          body: truncateProviderBody(await response.text()),
        });
      }

      const responseBody = (await response.json()) as GeminiGenerateContentResponse;
      const outputText = extractGeminiOutputText(responseBody);
      const output = parseGeminiJsonOutput(outputText);

      return validateCrmExtractionOutput(output, input, {
        defaultPhoneRegion: this.config.defaultPhoneRegion,
      });
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

function truncateProviderBody(value: string): string {
  return value.length > PROVIDER_ERROR_BODY_MAX_LENGTH
    ? `${value.slice(0, PROVIDER_ERROR_BODY_MAX_LENGTH)}...`
    : value;
}
