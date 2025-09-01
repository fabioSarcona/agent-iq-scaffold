import type { Vertical, MoneyLostSummary } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function requestMoneyLost(vertical: Vertical, answers: Record<string, unknown>): Promise<MoneyLostSummary> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const res = await fetch('/functions/v1/moneylost_compute', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
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