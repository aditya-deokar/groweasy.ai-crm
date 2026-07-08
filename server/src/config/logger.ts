import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.logLevel,
  base: {
    service: 'groweasy-api',
    env: env.nodeEnv,
  },
});

export type AppLogger = typeof logger;
