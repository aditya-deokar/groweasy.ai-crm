import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closeDatabaseConnection } from './index.js';
import { logger } from '../config/logger.js';

async function runMigrations(): Promise<void> {
  logger.info('Running database migrations');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  logger.info('Database migrations completed');
}

runMigrations()
  .catch((error: unknown) => {
    logger.fatal({ err: error }, 'Database migration failed');
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDatabaseConnection();
  });
