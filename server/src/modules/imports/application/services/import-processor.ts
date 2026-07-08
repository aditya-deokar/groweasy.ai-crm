import type { AppLogger } from '../../../../config/logger.js';
import type { LangGraphImportWorkflow } from '../../infrastructure/ai/langgraph-import-workflow.js';

export class ImportProcessor {
  private readonly runningImports = new Set<string>();

  public constructor(
    private readonly workflow: LangGraphImportWorkflow,
    private readonly logger: AppLogger
  ) {}

  public start(importId: string, includeFailed = false): void {
    if (this.runningImports.has(importId)) {
      this.logger.info({ importId }, 'Import processing already running');
      return;
    }

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
      });
  }
}
