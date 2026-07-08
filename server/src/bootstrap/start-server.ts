import type { Server } from 'node:http';
import type { Express } from 'express';
import type { ApplicationContainer } from '../container.js';

export function startServer(app: Express, container: ApplicationContainer): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(container.config.port, () => {
      container.logger.info(
        {
          port: container.config.port,
          env: container.config.nodeEnv,
          apiPrefix: container.config.apiPrefix,
        },
        'Server started'
      );

      resolve(server);
    });

    server.once('error', reject);
  });
}

export function closeHttpServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
