import type { Severity } from './types';

export function severityFromDaily(dailyUsd: number): Severity {
  if (dailyUsd > 1000) return 'CRITICAL';
  if (dailyUsd >= 500) return 'HIGH';
  if (dailyUsd >= 200) return 'MEDIUM';
  return 'LOW';
}