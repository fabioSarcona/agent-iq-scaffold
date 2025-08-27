import type { Vertical, MoneyLostSummary } from './types';

export async function requestMoneyLost(summaryInput: { vertical: Vertical; answers: Record<string, unknown> }): Promise<MoneyLostSummary> {
  // For development, we'll compute directly on client side to avoid server setup
  // In production, this would call the actual API endpoint
  const { computeMoneyLost } = await import('./moneylost');
  return computeMoneyLost(summaryInput);
}