import { StatusCodes } from 'http-status-codes';
import type { Request, Response } from 'express';
import type { HealthService } from '../application/health.service.js';
import { sendSuccess } from '../../../shared/presentation/responses/response-sender.js';

export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  public async getHealth(req: Request, res: Response): Promise<void> {
    const report = await this.healthService.getHealthReport();
    const statusCode =
      report.status === 'unhealthy' ? StatusCodes.SERVICE_UNAVAILABLE : StatusCodes.OK;

    sendSuccess(req, res, report, 'Health report generated.', statusCode);
  }

  public getLiveness(req: Request, res: Response): void {
    const report = this.healthService.getLivenessReport();
    sendSuccess(req, res, report, 'Service is alive.');
  }

  public async getReadiness(req: Request, res: Response): Promise<void> {
    const report = await this.healthService.getReadinessReport();
    const statusCode = report.ready ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;

    sendSuccess(req, res, report, 'Readiness report generated.', statusCode);
  }
}
