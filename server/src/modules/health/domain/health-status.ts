export type HealthState = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthDependencyCheck {
  name: string;
  status: HealthState;
  optional: boolean;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  service: string;
  version: string;
  environment: string;
  status: HealthState;
  uptimeSeconds: number;
  timestamp: string;
  checks: HealthDependencyCheck[];
}

export interface LivenessReport {
  status: 'alive';
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessReport {
  status: HealthState;
  ready: boolean;
  timestamp: string;
  checks: HealthDependencyCheck[];
}

export function resolveHealthState(checks: HealthDependencyCheck[]): HealthState {
  if (checks.some((check) => check.status === 'unhealthy' && !check.optional)) {
    return 'unhealthy';
  }

  if (checks.some((check) => check.status !== 'healthy')) {
    return 'degraded';
  }

  return 'healthy';
}
