import { Router } from 'express';
import type { HealthController } from './health.controller.js';
import { asyncHandler } from '../../../shared/infrastructure/http/async-handler.js';

export function createHealthRouter(controller: HealthController): Router {
  const router = Router();

  router.get('/', asyncHandler((req, res) => controller.getHealth(req, res)));
  router.get('/live', (req, res) => controller.getLiveness(req, res));
  router.get('/ready', asyncHandler((req, res) => controller.getReadiness(req, res)));

  return router;
}
