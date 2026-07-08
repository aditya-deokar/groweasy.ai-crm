import { createApp } from './app.js';
import { createContainer } from './container.js';
import { createGracefulShutdownHandler } from './bootstrap/graceful-shutdown.js';
import { registerProcessEvents } from './bootstrap/process-events.js';
import { startServer } from './bootstrap/start-server.js';
import { logger } from './config/logger.js';

async function main(): Promise<void> {
  const container = createContainer();
  const app = createApp(container);
  const server = await startServer(app, container);

  const shutdown = createGracefulShutdownHandler({
    server,
    resources: container.resources,
    logger: container.logger,
    timeoutMs: container.config.shutdownTimeoutMs,
  });

  registerProcessEvents(shutdown, container.logger);
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
