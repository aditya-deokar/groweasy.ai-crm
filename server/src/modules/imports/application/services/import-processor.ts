import type { AppLogger } from '../../../../config/logger.js';
import type { Env } from '../../../../config/env.js';
import type { LangGraphImportWorkflow } from '../../infrastructure/ai/langgraph-import-workflow.js';

export class ImportProcessor {
  private readonly runningImports = new Set<string>();
  private readonly queuedImports: Array<{ importId: string; includeFailed: boolean }> = [];

  public constructor(
    private readonly workflow: LangGraphImportWorkflow,
    private readonly logger: AppLogger,
    private readonly config: Env
  ) {}

  public start(importId: string, includeFailed = false): void {
    if (this.runningImports.has(importId)) {
      this.logger.info({ importId }, 'Import processing already running');
      return;
    }

    if (this.runningImports.size >= this.config.aiMaxConcurrentImports) {
      if (!this.queuedImports.some((queuedImport) => queuedImport.importId === importId)) {
        this.queuedImports.push({ importId, includeFailed });
      }
      this.logger.warn(
        {
          importId,
          runningImports: this.runningImports.size,
          queuedImports: this.queuedImports.length,
          maxConcurrentImports: this.config.aiMaxConcurrentImports,
        },
        'AI import queued because concurrency limit was reached'
      );
      return;
    }

    this.run(importId, includeFailed);
  }

  private run(importId: string, includeFailed: boolean): void {
    this.runningImports.add(importId);
    void this.workflow
      .invoke({
        importId,
        includeFailed,
      })
      .catch((error: unknown) => {
        this.logger.error({ err: error, importId }, 'Import workflow failed');
      })
      .finally(() => {
        this.runningImports.delete(importId);
        this.drainQueue();
      });
  }

  private drainQueue(): void {
    if (this.runningImports.size >= this.config.aiMaxConcurrentImports) {
      return;
    }

    const nextImport = this.queuedImports.shift();
    if (!nextImport) {
      return;
    }

    this.run(nextImport.importId, nextImport.includeFailed);
  }
}
