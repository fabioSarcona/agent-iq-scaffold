import { describe, it, expect } from 'vitest';
import { severityFromDaily } from '../severity';

describe('MoneyLost severity', () => {
  it('maps daily values to severity bands', () => {
    expect(severityFromDaily(50)).toBe('LOW');
    expect(severityFromDaily(300)).toBe('MEDIUM');
    expect(severityFromDaily(700)).toBe('HIGH');
    expect(severityFromDaily(1500)).toBe('CRITICAL');
  });
});