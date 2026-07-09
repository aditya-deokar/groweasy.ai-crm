import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);
const booleanStringSchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .default(false)
  .transform((value) => value === true || value === 'true');
const optionalApiKeySchema = z
  .string()
  .optional()
  .transform((value) => {
    const normalized = value?.trim();
    if (!normalized || normalized.startsWith('your_')) {
      return undefined;
    }

    return normalized;
  });

const envSchema = z.object({
  NODE_ENV: z
    .string()
    .toLowerCase()
    .pipe(z.enum(['development', 'test', 'production']))
    .default('development')
    .catch('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000).catch(5000),
  API_PREFIX: z.string().default('/api/v1').catch('/api/v1'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  LOG_LEVEL: logLevelSchema.optional(),
  REQUEST_BODY_LIMIT: z.string().min(1).default('1mb'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://groweasy:groweasy@localhost:5432/groweasy'),
  DB_SSL: booleanStringSchema,
  UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
  IMPORT_MAX_ROWS: z.coerce.number().int().positive().default(5_000),
  CSV_PREVIEW_ROW_LIMIT: z.coerce.number().int().positive().default(20),
  CSV_MAX_RECORD_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(1024 * 1024),
  DEFAULT_PHONE_REGION: z
    .string()
    .length(2)
    .default('IN')
    .transform((value) => value.toUpperCase()),
  AI_PROVIDER: z
    .string()
    .toLowerCase()
    .pipe(z.enum(['openai', 'gemini']))
    .default('gemini')
    .catch('gemini'),

  OPENAI_API_KEY: optionalApiKeySchema,
  AI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  GEMINI_API_KEY: optionalApiKeySchema,
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash'),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),
  AI_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  AI_BATCH_CONCURRENCY: z.coerce.number().int().positive().default(2),
  AI_MAX_CONCURRENT_IMPORTS: z.coerce.number().int().positive().default(3),
  AI_MAX_CELL_CHARS: z.coerce.number().int().positive().default(1_000),
  AI_MAX_ROW_CHARS: z.coerce.number().int().positive().default(4_000),
  AI_MAX_BATCH_INPUT_TOKENS: z.coerce.number().int().positive().default(12_000),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  AI_DEBUG_STORE_RAW_PROMPTS: booleanStringSchema,
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  AI_RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(1_000),
  AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  AI_CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce.number().int().positive().default(30_000),
  LANGSMITH_TRACING: booleanStringSchema,
  LANGSMITH_API_KEY: z.string().optional(),
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  const vals = parsed.success ? parsed.data : envSchema.parse({});
  return {
    nodeEnv: vals.NODE_ENV,
    port: vals.PORT,
    apiPrefix: vals.API_PREFIX,
    corsOrigins: vals.CORS_ORIGINS,
    logLevel:
      vals.LOG_LEVEL ?? (vals.NODE_ENV === 'production' ? ('info' as const) : ('debug' as const)),
    requestBodyLimit: vals.REQUEST_BODY_LIMIT,
    rateLimitWindowMs: vals.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: vals.RATE_LIMIT_MAX_REQUESTS,
    shutdownTimeoutMs: vals.SHUTDOWN_TIMEOUT_MS,
    databaseUrl: vals.DATABASE_URL,
    dbSsl: vals.DB_SSL,
    uploadMaxFileSizeBytes: vals.UPLOAD_MAX_FILE_SIZE_BYTES,
    importMaxRows: vals.IMPORT_MAX_ROWS,
    csvPreviewRowLimit: vals.CSV_PREVIEW_ROW_LIMIT,
    csvMaxRecordSizeBytes: vals.CSV_MAX_RECORD_SIZE_BYTES,
    defaultPhoneRegion: vals.DEFAULT_PHONE_REGION,
    aiProvider: vals.AI_PROVIDER,
    openAiApiKey: vals.OPENAI_API_KEY,
    aiModel: vals.AI_MODEL,
    geminiApiKey: vals.GEMINI_API_KEY,
    geminiModel: vals.GEMINI_MODEL,
    aiTemperature: vals.AI_TEMPERATURE,
    aiBatchSize: clamp(vals.AI_BATCH_SIZE, 20, 50),
    aiBatchConcurrency: vals.AI_BATCH_CONCURRENCY,
    aiMaxConcurrentImports: vals.AI_MAX_CONCURRENT_IMPORTS,
    aiMaxCellChars: vals.AI_MAX_CELL_CHARS,
    aiMaxRowChars: vals.AI_MAX_ROW_CHARS,
    aiMaxBatchInputTokens: vals.AI_MAX_BATCH_INPUT_TOKENS,
    aiProviderTimeoutMs: vals.AI_PROVIDER_TIMEOUT_MS,
    aiDebugStoreRawPrompts:
      vals.NODE_ENV === 'production' ? false : vals.AI_DEBUG_STORE_RAW_PROMPTS,
    aiMaxRetries: clamp(vals.AI_MAX_RETRIES, 0, 5),
    aiRetryBaseDelayMs: vals.AI_RETRY_BASE_DELAY_MS,
    aiCircuitBreakerFailureThreshold: vals.AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
    aiCircuitBreakerCooldownMs: vals.AI_CIRCUIT_BREAKER_COOLDOWN_MS,
    langSmithTracing: vals.LANGSMITH_TRACING,
    langSmithApiKey: vals.LANGSMITH_API_KEY,
  } as const;
}

export const env = getEnv();



export type Env = typeof env;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
