import type { CorsOptions } from 'cors';
import { env } from './env.js';

export function createCorsOptions(): CorsOptions {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS policy.'));
    },
  };
}
