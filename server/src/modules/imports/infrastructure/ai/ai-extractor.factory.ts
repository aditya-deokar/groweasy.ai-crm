import type { Env } from '../../../../config/env.js';
import type { AiCrmExtractor } from '../../domain/ports/ai-extractor.port.js';
import { GeminiCrmExtractor } from './gemini-crm-extractor.js';
import { LangChainCrmExtractor } from './langchain-crm-extractor.js';

export function createAiCrmExtractor(config: Env): AiCrmExtractor {
  if (config.aiProvider === 'gemini') {
    return new GeminiCrmExtractor(config);
  }

  return new LangChainCrmExtractor(config);
}
