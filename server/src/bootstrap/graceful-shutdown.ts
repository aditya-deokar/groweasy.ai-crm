import type { Server } from 'node:http';
import type { AppLogger } from '../config/logger.js';
import type { DisposableResource } from '../container.js';
import { closeHttpServer } from './start-server.js';

export type ShutdownReason =
  | 'SIGINT'
  | 'SIGTERM'
  | 'uncaughtException'
  | 'unhandledRejection'
  | 'startupFailure';

export interface GracefulShutdownOptions {
  server: Server;
  resources: DisposableResource[];
  logger: AppLogger;
  timeoutMs: number;
}

export type GracefulShutdownHandler = (reason: ShutdownReason, error?: unknown) => Promise<void>;

export function createGracefulShutdownHandler(
  options: GracefulShutdownOptions
): GracefulShutdownHandler {
  let isShuttingDown = false;

  return async (reason, error) => {
    if (isShuttingDown) {
      options.logger.warn({ reason }, 'Shutdown already in progress');
      return;
    }

    isShuttingDown = true;

    if (error) {
      options.logger.error({ err: error, reason }, 'Shutdown triggered by error');
    } else {
      options.logger.info({ reason }, 'Shutdown started');
    }

    const timeout = setTimeout(() => {
      options.logger.error({ timeoutMs: options.timeoutMs }, 'Forced shutdown timeout reached');
      process.exit(1);
    }, options.timeoutMs);

    try {
      await closeHttpServer(options.server);
      options.logger.info('HTTP server closed');

      for (const resource of options.resources) {
        await resource.close();
        options.logger.info({ resource: resource.name }, 'Resource closed');
      }

      clearTimeout(timeout);
      options.logger.info('Shutdown completed');
      process.exit(0);
    } catch (shutdownError) {
      clearTimeout(timeout);
      options.logger.error({ err: shutdownError }, 'Shutdown failed');
      process.exit(1);
    }
  };
}
