import { ChatOpenAI } from '@langchain/openai';
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
import { crmExtractionBatchSchema } from './schemas/crm-extraction.schema.js';
import { buildCrmExtractionPrompt } from './prompts/crm-extraction.prompt.js';
import { validateCrmExtractionOutput } from './validators/crm-extraction-output.validator.js';
import {
  estimateTokenCount,
  hashText,
} from '../../../../shared/infrastructure/ai-safety-redaction.js';

export class LangChainCrmExtractor implements AiCrmExtractor {
  public constructor(private readonly config: Env) {}

  public async extractBatch(input: AiCrmExtractionInput): Promise<AiCrmExtractionBatchResult> {
    if (!this.config.openAiApiKey) {
      throw new AiProviderUnavailableError('OPENAI_API_KEY is required for AI extraction.');
    }

    const model = new ChatOpenAI({
      apiKey: this.config.openAiApiKey,
      model: this.config.aiModel,
      temperature: this.config.aiTemperature,
      timeout: this.config.aiProviderTimeoutMs,
    }).withStructuredOutput(crmExtractionBatchSchema, {
      name: 'extract_groweasy_crm_records',
      strict: true,
    });
    const startedAt = Date.now();
    const promptBundle = buildCrmExtractionPrompt(input);

    try {
      const output = await model.invoke([
        {
          role: 'system',
          content: promptBundle.systemPrompt,
        },
        {
          role: 'user',
          content: promptBundle.userPrompt,
        },
      ]);
      const outputText = JSON.stringify(output);
      const result = validateCrmExtractionOutput(output, input, {
        defaultPhoneRegion: this.config.defaultPhoneRegion,
      });

      return {
        ...result,
        metadata: {
          feature: promptBundle.prompt.feature,
          provider: 'openai',
          model: this.config.aiModel,
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
      if (error instanceof AiInvalidStructuredOutputError) {
        throw error;
      }

      throw new AiProviderUnavailableError('AI extraction request failed.', {
        message: error instanceof Error ? error.message : 'Unknown AI provider error.',
      });
    }
  }
}
