import { describe, expect, it } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
} from '../../../src/shared/infrastructure/resilience/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and recovers after cooldown', async () => {
    let now = 0;
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 100,
      now: () => now,
    });

    await expect(circuitBreaker.execute(async () => Promise.reject(new Error('first')))).rejects.toThrow(
      'first'
    );
    expect(circuitBreaker.snapshot().state).toBe('CLOSED');

    await expect(
      circuitBreaker.execute(async () => Promise.reject(new Error('second')))
    ).rejects.toThrow('second');
    expect(circuitBreaker.snapshot().state).toBe('OPEN');

    await expect(circuitBreaker.execute(async () => 'blocked')).rejects.toBeInstanceOf(
      CircuitBreakerOpenError
    );

    now = 101;
    await expect(circuitBreaker.execute(async () => 'recovered')).resolves.toBe('recovered');
    expect(circuitBreaker.snapshot().state).toBe('CLOSED');
  });
});
