export interface RetryPolicyOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  random?: () => number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryAttempt {
  attempt: number;
  delayMs: number;
  error: unknown;
}

export class RetryPolicy {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly jitterRatio: number;
  private readonly random: () => number;
  private readonly retryPredicate: (error: unknown, attempt: number) => boolean;

  public constructor(options: RetryPolicyOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 200;
    this.maxDelayMs = options.maxDelayMs ?? 5_000;
    this.jitterRatio = options.jitterRatio ?? 0.2;
    this.random = options.random ?? Math.random;
    this.retryPredicate = options.shouldRetry ?? (() => true);
  }

  public canRetry(error: unknown, attempt: number): boolean {
    return attempt < this.maxRetries && this.retryPredicate(error, attempt);
  }

  public getDelayMs(attempt: number): number {
    const exponentialDelay = this.baseDelayMs * 2 ** attempt;
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);

    if (this.jitterRatio <= 0) {
      return cappedDelay;
    }

    const jitterRange = cappedDelay * this.jitterRatio;
    const jitter = (this.random() * 2 - 1) * jitterRange;

    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  public async wait(attempt: number): Promise<void> {
    const delayMs = this.getDelayMs(attempt);
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  public async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: RetryAttempt) => void
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        if (!this.canRetry(error, attempt)) {
          throw error;
        }

        const delayMs = this.getDelayMs(attempt);
        onRetry?.({ attempt, delayMs, error });
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
        attempt += 1;
      }
    }
  }
}
