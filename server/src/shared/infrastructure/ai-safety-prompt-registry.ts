import { hashText } from './ai-safety-redaction.js';
import type { AiPromptVersion } from './ai-safety-types.js';

export function definePromptVersion(input: Omit<AiPromptVersion, 'sha256'>): AiPromptVersion {
  return {
    ...input,
    sha256: hashText(input.systemPrompt),
  };
}

export function assertActivePrompt(prompt: AiPromptVersion): AiPromptVersion {
  if (!prompt.active) {
    throw new Error(`AI prompt ${prompt.promptId}@${prompt.version} is not active.`);
  }

  return prompt;
}
