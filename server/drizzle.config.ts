import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config();
if (fs.existsSync('.env.prod')) {
  dotenv.config({ path: '.env.prod', override: true });
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: true,
  },
  verbose: true,
  strict: true,
});
