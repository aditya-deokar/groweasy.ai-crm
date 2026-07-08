export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  halfOpenMaxAttempts?: number;
  successThreshold?: number;
  now?: () => number;
}

export interface CircuitBreakerSnapshot {
  state: CircuitBreakerState;
  failures: number;
  lastFailureAt: number | null;
  halfOpenAttempts: number;
  halfOpenSuccesses: number;
  failureThreshold: number;
  cooldownMs: number;
}

export class CircuitBreakerOpenError extends Error {
  public constructor() {
    super('Circuit breaker is open.');
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly halfOpenMaxAttempts: number;
  private readonly successThreshold: number;
  private readonly now: () => number;

  private stateValue: CircuitBreakerState = 'CLOSED';
  private failures = 0;
  private lastFailureAt: number | null = null;
  private halfOpenAttempts = 0;
  private halfOpenSuccesses = 0;

  public constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 1;
    this.successThreshold = options.successThreshold ?? 1;
    this.now = options.now ?? Date.now;
  }

  public get state(): CircuitBreakerState {
    if (this.stateValue === 'OPEN' && this.hasCooldownElapsed()) {
      this.transitionToHalfOpen();
    }

    return this.stateValue;
  }

  public allowRequest(): boolean {
    const state = this.state;

    if (state === 'CLOSED') {
      return true;
    }

    if (state === 'OPEN') {
      return false;
    }

    if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
      return false;
    }

    this.halfOpenAttempts += 1;
    return true;
  }

  public onSuccess(): void {
    if (this.stateValue === 'HALF_OPEN') {
      this.halfOpenSuccesses += 1;

      if (this.halfOpenSuccesses >= this.successThreshold) {
        this.reset();
      }

      return;
    }

    this.failures = 0;
  }

  public onFailure(): void {
    this.lastFailureAt = this.now();

    if (this.stateValue === 'HALF_OPEN') {
      this.open();
      return;
    }

    this.failures += 1;

    if (this.failures >= this.failureThreshold) {
      this.open();
    }
  }

  public reset(): void {
    this.stateValue = 'CLOSED';
    this.failures = 0;
    this.lastFailureAt = null;
    this.halfOpenAttempts = 0;
    this.halfOpenSuccesses = 0;
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.allowRequest()) {
      throw new CircuitBreakerOpenError();
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  public snapshot(): CircuitBreakerSnapshot {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureAt: this.lastFailureAt,
      halfOpenAttempts: this.halfOpenAttempts,
      halfOpenSuccesses: this.halfOpenSuccesses,
      failureThreshold: this.failureThreshold,
      cooldownMs: this.cooldownMs,
    };
  }

  private hasCooldownElapsed(): boolean {
    return this.lastFailureAt !== null && this.now() - this.lastFailureAt >= this.cooldownMs;
  }

  private transitionToHalfOpen(): void {
    this.stateValue = 'HALF_OPEN';
    this.halfOpenAttempts = 0;
    this.halfOpenSuccesses = 0;
  }

  private open(): void {
    this.stateValue = 'OPEN';
    this.halfOpenAttempts = 0;
    this.halfOpenSuccesses = 0;
  }
}
