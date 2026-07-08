import { Router } from 'express';
import type { ApplicationContainer } from './container.js';
import { sendSuccess } from './shared/presentation/responses/response-sender.js';

export function createApiRouter(container: ApplicationContainer): Router {
  const router = Router();

  router.get('/', (req, res) => {
    sendSuccess(
      req,
      res,
      {
        service: container.service.name,
        version: container.service.version,
        environment: container.config.nodeEnv,
      },
      'GrowEasy API is ready.'
    );
  });

  router.use('/health', container.modules.health.router);
  router.use('/imports', container.modules.imports.router);
  router.use('/leads', container.modules.leads.router);

  return router;
}
