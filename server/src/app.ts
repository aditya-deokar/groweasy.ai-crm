import compressionLib from 'compression';
import corsLib from 'cors';
import express from 'express';
import helmetLib from 'helmet';

const helmet = (
  typeof helmetLib === 'function'
    ? helmetLib
    : (helmetLib as unknown as { default: (options?: unknown) => express.RequestHandler }).default
) as (options?: unknown) => express.RequestHandler;

const cors = (
  typeof corsLib === 'function'
    ? corsLib
    : (corsLib as unknown as { default: (options?: unknown) => express.RequestHandler }).default || corsLib
) as (options?: unknown) => express.RequestHandler;

const compression = (
  typeof compressionLib === 'function'
    ? compressionLib
    : (compressionLib as unknown as { default: (options?: unknown) => express.RequestHandler }).default || compressionLib
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

import { getEnv } from './config/env.js';
export function createApp(container: ApplicationContainer = createContainer()): express.Express {
  const app = express();
  const config = container?.config ?? getEnv();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');


  app.use(requestIdMiddleware);
  app.use(createRequestLoggerMiddleware(container.logger));
  app.use(helmet(helmetOptions));
  app.use(cors(createCorsOptions()));
  app.use(compression());
  app.use(createRateLimitMiddleware());
  app.use(express.json({ limit: config.requestBodyLimit ?? '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: config.requestBodyLimit ?? '1mb' }));

  app.get('/', (req, res) => {
    sendSuccess(
      req,
      res,
      {
        service: container.service.name,
        version: container.service.version,
        environment: config.nodeEnv,
        apiPrefix: config.apiPrefix,
      },
      'GrowEasy API foundation is running.'
    );
  });

  app.use('/health', container.modules.health.router);
  app.use(config.apiPrefix ?? '/api/v1', createApiRouter(container));


  app.use(notFoundMiddleware);
  app.use(createErrorHandlerMiddleware(container.logger));

  return app;
}

export default createApp;
