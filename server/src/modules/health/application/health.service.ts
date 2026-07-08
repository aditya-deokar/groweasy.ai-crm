import type {
  HealthDependencyCheck,
  HealthReport,
  LivenessReport,
  ReadinessReport,
} from '../domain/health-status.js';
import { resolveHealthState } from '../domain/health-status.js';

export interface HealthServiceConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
}

export interface HealthCheckProvider {
  getReadinessChecks: () => Promise<HealthDependencyCheck[]>;
}

export class HealthService {
  public constructor(
    private readonly config: HealthServiceConfig,
    private readonly healthCheckProvider: HealthCheckProvider
  ) {}

  public async getHealthReport(): Promise<HealthReport> {
    const checks = await this.healthCheckProvider.getReadinessChecks();
    const status = resolveHealthState(checks);

    return {
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      environment: this.config.environment,
      status,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  public getLivenessReport(): LivenessReport {
    return {
      status: 'alive',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  public async getReadinessReport(): Promise<ReadinessReport> {
    const checks = await this.healthCheckProvider.getReadinessChecks();
    const status = resolveHealthState(checks);

    return {
      status,
      ready: status !== 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
