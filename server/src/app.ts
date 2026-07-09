import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmetLib from 'helmet';

const helmet = (
  typeof helmetLib === 'function'
    ? helmetLib
    : (helmetLib as unknown as { default: (options?: unknown) => express.RequestHandler }).default
) as (options?: unknown) => express.RequestHandler;

import { createCorsOptions } from './config/cors.js';
import { createRateLimitMiddleware } from './config/rate-limit.js';
import { helmetOptions } from './config/security.js';
import type { ApplicationContainer } from './container.js';
import { createContainer } from './container.js';
import { createApiRouter } from './routes.js';
import { createErrorHandlerMiddleware } from './shared/presentation/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from './shared/presentation/middlewares/not-found.middleware.js';
import { requestIdMiddleware } from './shared/presentation/middlewares/request-id.middleware.js';
import { createRequestLoggerMiddleware } from './shared/presentation/middlewares/request-logger.middleware.js';
import { sendSuccess } from './shared/presentation/responses/response-sender.js';

export function createApp(container: ApplicationContainer = createContainer()): express.Express {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestIdMiddleware);
  app.use(createRequestLoggerMiddleware(container.logger));
  app.use(helmet(helmetOptions));
  app.use(cors(createCorsOptions()));
  app.use(compression());
  app.use(createRateLimitMiddleware());
  app.use(express.json({ limit: container.config.requestBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: container.config.requestBodyLimit }));

  app.get('/', (req, res) => {
    sendSuccess(
      req,
      res,
      {
        service: container.service.name,
        version: container.service.version,
        environment: container.config.nodeEnv,
        apiPrefix: container.config.apiPrefix,
      },
      'GrowEasy API foundation is running.'
    );
  });

  app.use('/health', container.modules.health.router);
  app.use(container.config.apiPrefix, createApiRouter(container));

  app.use(notFoundMiddleware);
  app.use(createErrorHandlerMiddleware(container.logger));

  return app;
}

export default createApp;
