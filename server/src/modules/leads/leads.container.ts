import type { Router } from 'express';
import type { Database } from '../../db/index.js';
import { LeadsRepository } from './infrastructure/database/leads.repository.js';
import { LeadsController } from './presentation/leads.controller.js';
import { createLeadsRouter } from './presentation/leads.routes.js';

export interface LeadsContainerInput {
  database: Database;
}

export interface LeadsModuleContainer {
  repository: LeadsRepository;
  controller: LeadsController;
  router: Router;
}

export function createLeadsContainer(input: LeadsContainerInput): LeadsModuleContainer {
  const repository = new LeadsRepository(input.database);
  const controller = new LeadsController(repository);
  const router = createLeadsRouter(controller);

  return {
    repository,
    controller,
    router,
  };
}
