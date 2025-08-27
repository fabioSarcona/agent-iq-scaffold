import type { Vertical, MoneyLostSummary } from './types';

export async function requestMoneyLost(payload: { vertical: Vertical; answers: Record<string, unknown> }): Promise<MoneyLostSummary> {
  const res = await fetch('/functions/v1/moneylost_compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('MoneyLost compute failed');
  return res.json();
}