import type { Request, Response } from 'express';
import { createApp } from '../src/app.js';
import { createContainer } from '../src/container.js';

const container = createContainer();
const app = createApp(container);

export default (req: Request, res: Response) => {
  return app(req, res);
};
