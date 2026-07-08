import type { Router } from 'express';
import type { Env } from '../../config/env.js';
import { HealthService } from './application/health.service.js';
import { HealthChecker } from './infrastructure/health-checker.js';
import { HealthController } from './presentation/health.controller.js';
import { createHealthRouter } from './presentation/health.routes.js';

export interface HealthContainerInput {
  config: Env;
  service: {
    name: string;
    version: string;
  };
  checkDatabaseConnection: () => Promise<boolean>;
}

export interface HealthModuleContainer {
  checker: HealthChecker;
  service: HealthService;
  controller: HealthController;
  router: Router;
}

export function createHealthContainer(input: HealthContainerInput): HealthModuleContainer {
  const checker = new HealthChecker(input.checkDatabaseConnection);
  const service = new HealthService(
    {
      serviceName: input.service.name,
      serviceVersion: input.service.version,
      environment: input.config.nodeEnv,
    },
    checker
  );
  const controller = new HealthController(service);
  const router = createHealthRouter(controller);

  return {
    checker,
    service,
    controller,
    router,
  };
}
