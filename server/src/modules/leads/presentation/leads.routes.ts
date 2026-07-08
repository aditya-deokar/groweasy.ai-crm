import { Router } from 'express';
import { asyncHandler } from '../../../shared/infrastructure/http/async-handler.js';
import { validateRequest } from '../../../shared/presentation/middlewares/validate-request.middleware.js';
import type { LeadsController } from './leads.controller.js';
import {
  leadIdParamsSchema,
  listLeadsQuerySchema,
  updateLeadBodySchema,
} from './leads.schemas.js';

export function createLeadsRouter(controller: LeadsController): Router {
  const router = Router();

  router.get(
    '/',
    validateRequest({ query: listLeadsQuerySchema }),
    asyncHandler((req, res) => controller.list(req, res))
  );

  router.patch(
    '/:id',
    validateRequest({ params: leadIdParamsSchema, body: updateLeadBodySchema }),
    asyncHandler((req, res) => controller.update(req, res))
  );

  router.delete(
    '/:id',
    validateRequest({ params: leadIdParamsSchema }),
    asyncHandler((req, res) => controller.delete(req, res))
  );

  return router;
}
