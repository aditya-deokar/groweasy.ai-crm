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
import { buildCrmExtractionUserPrompt, CRM_EXTRACTION_SYSTEM_PROMPT } from './prompts/crm-extraction.prompt.js';
import { validateCrmExtractionOutput } from './validators/crm-extraction-output.validator.js';

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
    }).withStructuredOutput(crmExtractionBatchSchema, {
      name: 'extract_groweasy_crm_records',
      strict: true,
    });

    try {
      const output = await model.invoke([
        {
          role: 'system',
          content: CRM_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildCrmExtractionUserPrompt(input),
        },
      ]);

      return validateCrmExtractionOutput(output, input, {
        defaultPhoneRegion: this.config.defaultPhoneRegion,
      });
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
