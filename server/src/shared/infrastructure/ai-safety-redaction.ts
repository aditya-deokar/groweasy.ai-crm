import { createHash } from 'node:crypto';

const REDACTED = '[REDACTED]';
const MAX_PREVIEW_LENGTH = 80;

const SECRET_PATTERNS: RegExp[] = [
  /\b(?:sk|rk|pk|AIza)[A-Za-z0-9_-]{16,}\b/g,
  /\b[A-Za-z0-9._%+-]+_secret_[A-Za-z0-9._%+-]+\b/gi,
  /\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*["']?[^"',\s]+/gi,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi,
  /\b\d{13,19}\b/g,
];

export function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function redactText(value: string): string {
  return SECRET_PATTERNS.reduce(
    (currentValue, pattern) => currentValue.replace(pattern, REDACTED),
    value
  );
}

export function safePreview(value: string, maxLength = MAX_PREVIEW_LENGTH): string {
  const normalized = redactText(value).replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized;
}

export function containsSecretLikeValue(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

export function sanitizeMetadata(value: unknown): unknown {
  if (typeof value === 'string') {
    return safePreview(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeMetadata(entry),
      ])
    );
  }

  return value;
}

export function estimateTokenCount(value: string): number {
  return Math.ceil(value.length / 4);
}
