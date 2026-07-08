import { Router } from 'express';
import type { Env } from '../../../config/env.js';
import { asyncHandler } from '../../../shared/infrastructure/http/async-handler.js';
import { validateRequest } from '../../../shared/presentation/middlewares/validate-request.middleware.js';
import { createCsvUploadMiddleware } from '../infrastructure/upload/multer-upload.middleware.js';
import type { ImportsController } from './imports.controller.js';
import { importIdParamsSchema, importResultQuerySchema, importHistoryQuerySchema, importRowParamsSchema } from './imports.schemas.js';

export function createImportsRouter(controller: ImportsController, config: Env): Router {
  const router = Router();

  router.post(
    '/preview',
    createCsvUploadMiddleware(config),
    asyncHandler((req, res) => controller.preview(req, res))
  );
  router.get(
    '/history',
    validateRequest({ query: importHistoryQuerySchema }),
    asyncHandler((req, res) => controller.history(req, res))
  );
  router.post(
    '/:importId/confirm',
    validateRequest({ params: importIdParamsSchema }),
    asyncHandler((req, res) => controller.confirm(req, res))
  );
  router.get(
    '/:importId/status',
    validateRequest({ params: importIdParamsSchema }),
    asyncHandler((req, res) => controller.status(req, res))
  );
  router.get(
    '/:importId/result',
    validateRequest({ params: importIdParamsSchema, query: importResultQuerySchema }),
    asyncHandler((req, res) => controller.result(req, res))
  );
  router.post(
    '/:importId/retry-failed',
    validateRequest({ params: importIdParamsSchema }),
    asyncHandler((req, res) => controller.retryFailed(req, res))
  );
  router.post(
    '/:importId/cancel',
    validateRequest({ params: importIdParamsSchema }),
    asyncHandler((req, res) => controller.cancel(req, res))
  );
  router.patch(
    '/:importId/records/:rowIndex',
    validateRequest({ params: importRowParamsSchema }),
    asyncHandler((req, res) => controller.updateRecord(req, res))
  );
  router.post(
    '/:importId/skipped/:rowIndex/reimport',
    validateRequest({ params: importRowParamsSchema }),
    asyncHandler((req, res) => controller.reimportSkipped(req, res))
  );

  return router;
}
