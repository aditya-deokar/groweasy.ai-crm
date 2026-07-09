import type { AppLogger } from './config/logger.js';
import { logger } from './config/logger.js';
import type { Env } from './config/env.js';
import { env, getEnv } from './config/env.js';
import { checkDatabaseConnection, closeDatabaseConnection, db } from './db/index.js';
import type { ImportsModuleContainer } from './modules/imports/imports.container.js';
import { createImportsContainer } from './modules/imports/imports.container.js';
import type { HealthModuleContainer } from './modules/health/health.container.js';
import { createHealthContainer } from './modules/health/health.container.js';
import type { LeadsModuleContainer } from './modules/leads/leads.container.js';
import { createLeadsContainer } from './modules/leads/leads.container.js';

export interface DisposableResource {
  name: string;
  close: () => Promise<void> | void;
}

export interface ApplicationContainer {
  config: Env;
  logger: AppLogger;
  service: {
    name: string;
    version: string;
  };
  modules: {
    health: HealthModuleContainer;
    imports: ImportsModuleContainer;
    leads: LeadsModuleContainer;
  };
  resources: DisposableResource[];
}

export interface ContainerOverrides {
  checkDatabaseConnection?: () => Promise<boolean>;
}

export function createContainer(overrides: ContainerOverrides = {}): ApplicationContainer {
  const currentEnv = env ?? getEnv();
  const service = {
    name: 'groweasy-api',
    version: '1.0.0',
  };
  const health = createHealthContainer({
    config: currentEnv,
    service,
    checkDatabaseConnection: overrides.checkDatabaseConnection ?? checkDatabaseConnection,
  });
  const imports = createImportsContainer({
    config: currentEnv,
    database: db,
    logger,
  });
  const leads = createLeadsContainer({
    database: db,
  });

  return {
    config: currentEnv,

    logger,
    service,
    modules: {
      health,
      imports,
      leads,
    },
    resources: [
      {
        name: 'postgres',
        close: closeDatabaseConnection,
      },
    ],
  };
}
