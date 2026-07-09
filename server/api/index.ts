import type { Request, Response } from 'express';
import { createApp } from '../src/app.js';
import { createContainer } from '../src/container.js';

let appHandler: ((req: Request, res: Response) => void) | undefined;
let initError: Error | undefined;

function getApp() {
  if (appHandler) return appHandler;
  if (initError) throw initError;

  try {
    const container = createContainer();
    appHandler = createApp(container);
    return appHandler;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error('GrowEasy API Initialization Error:', initError);
    throw initError;
  }
}

export default (req: Request, res: Response) => {
  try {
    const handler = getApp();
    return handler(req, res);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Vercel Function Invocation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server initialization failed on Vercel',
      error: {
        code: 'INIT_ERROR',
        message: error.message,
        stack: error.stack,
      },
    });
  }
};
