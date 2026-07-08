import { describe, expect, it } from 'vitest';
import { RetryPolicy } from '../../../src/shared/infrastructure/resilience/retry-policy.js';

describe('RetryPolicy', () => {
  it('retries failed operations until they succeed', async () => {
    const policy = new RetryPolicy({
      maxRetries: 2,
      baseDelayMs: 0,
      maxDelayMs: 0,
      jitterRatio: 0,
    });
    let calls = 0;
    const retryAttempts: number[] = [];

    const result = await policy.execute(
      async () => {
        calls += 1;

        if (calls < 3) {
          throw new Error('temporary failure');
        }

        return 'ok';
      },
      ({ attempt }) => {
        retryAttempts.push(attempt);
      }
    );

    expect(result).toBe('ok');
    expect(calls).toBe(3);
    expect(retryAttempts).toEqual([0, 1]);
  });

  it('stops retrying when the retry predicate rejects the error', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      baseDelayMs: 0,
      maxDelayMs: 0,
      shouldRetry: () => false,
    });
    let calls = 0;

    await expect(
      policy.execute(async () => {
        calls += 1;
        throw new Error('permanent failure');
      })
    ).rejects.toThrow('permanent failure');

    expect(calls).toBe(1);
  });
});
