import type { AppLogger } from '../config/logger.js';
import type { GracefulShutdownHandler } from './graceful-shutdown.js';

export function registerProcessEvents(
  shutdown: GracefulShutdownHandler,
  logger: AppLogger
): void {
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    void shutdown('uncaughtException', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection', reason);
  });
}
