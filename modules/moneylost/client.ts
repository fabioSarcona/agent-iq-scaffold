import type { Vertical, MoneyLostSummary } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function requestMoneyLost(vertical: Vertical, answers: Record<string, unknown>): Promise<MoneyLostSummary> {
  const res = await fetch('/functions/v1/moneylost_compute', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ vertical, answers })
  });

  if (!res.ok) {
    let errorMessage = 'MoneyLost compute failed';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Use default error message if response is not JSON
    }
    throw new Error(errorMessage);
  }

  return res.json();
}