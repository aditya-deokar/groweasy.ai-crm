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
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  API_PREFIX: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).default('/api/v1'),
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
  DATABASE_URL: z.string().url().default('postgres://groweasy:groweasy@localhost:5432/groweasy'),
  DB_SSL: booleanStringSchema,
  UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  IMPORT_MAX_ROWS: z.coerce.number().int().positive().default(5_000),
  CSV_PREVIEW_ROW_LIMIT: z.coerce.number().int().positive().default(20),
  CSV_MAX_RECORD_SIZE_BYTES: z.coerce.number().int().positive().default(1024 * 1024),
  DEFAULT_PHONE_REGION: z.string().length(2).default('IN').transform((value) => value.toUpperCase()),
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('gemini'),
  OPENAI_API_KEY: optionalApiKeySchema,
  AI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  GEMINI_API_KEY: optionalApiKeySchema,
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash'),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),
  AI_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  AI_BATCH_CONCURRENCY: z.coerce.number().int().positive().default(2),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  AI_RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(1_000),
  AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  AI_CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce.number().int().positive().default(30_000),
  LANGSMITH_TRACING: booleanStringSchema,
  LANGSMITH_API_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = JSON.stringify(parsedEnv.error.flatten().fieldErrors);
  throw new Error(`Invalid environment configuration: ${details}`);
}

const values = parsedEnv.data;

export const env = {
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  apiPrefix: values.API_PREFIX,
  corsOrigins: values.CORS_ORIGINS,
  logLevel:
    values.LOG_LEVEL ?? (values.NODE_ENV === 'production' ? ('info' as const) : ('debug' as const)),
  requestBodyLimit: values.REQUEST_BODY_LIMIT,
  rateLimitWindowMs: values.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: values.RATE_LIMIT_MAX_REQUESTS,
  shutdownTimeoutMs: values.SHUTDOWN_TIMEOUT_MS,
  databaseUrl: values.DATABASE_URL,
  dbSsl: values.DB_SSL,
  uploadMaxFileSizeBytes: values.UPLOAD_MAX_FILE_SIZE_BYTES,
  importMaxRows: values.IMPORT_MAX_ROWS,
  csvPreviewRowLimit: values.CSV_PREVIEW_ROW_LIMIT,
  csvMaxRecordSizeBytes: values.CSV_MAX_RECORD_SIZE_BYTES,
  defaultPhoneRegion: values.DEFAULT_PHONE_REGION,
  aiProvider: values.AI_PROVIDER,
  openAiApiKey: values.OPENAI_API_KEY,
  aiModel: values.AI_MODEL,
  geminiApiKey: values.GEMINI_API_KEY,
  geminiModel: values.GEMINI_MODEL,
  aiTemperature: values.AI_TEMPERATURE,
  aiBatchSize: clamp(values.AI_BATCH_SIZE, 20, 50),
  aiBatchConcurrency: values.AI_BATCH_CONCURRENCY,
  aiMaxRetries: clamp(values.AI_MAX_RETRIES, 0, 2),
  aiRetryBaseDelayMs: values.AI_RETRY_BASE_DELAY_MS,
  aiCircuitBreakerFailureThreshold: values.AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  aiCircuitBreakerCooldownMs: values.AI_CIRCUIT_BREAKER_COOLDOWN_MS,
  langSmithTracing: values.LANGSMITH_TRACING,
  langSmithApiKey: values.LANGSMITH_API_KEY,
} as const;

export type Env = typeof env;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
