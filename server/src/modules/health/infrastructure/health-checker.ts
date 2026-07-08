import type { HealthCheckProvider } from '../application/health.service.js';
import type { HealthDependencyCheck } from '../domain/health-status.js';

export class HealthChecker implements HealthCheckProvider {
  public constructor(private readonly checkDatabaseConnection: () => Promise<boolean>) {}

  public async getReadinessChecks(): Promise<HealthDependencyCheck[]> {
    const databaseHealthy = await this.safeCheckDatabaseConnection();

    return [
      {
        name: 'http-server',
        status: 'healthy',
        optional: false,
      },
      {
        name: 'postgres',
        status: databaseHealthy ? 'healthy' : 'unhealthy',
        optional: false,
      },
    ];
  }

  private async safeCheckDatabaseConnection(): Promise<boolean> {
    try {
      return await this.checkDatabaseConnection();
    } catch {
      return false;
    }
  }
}
