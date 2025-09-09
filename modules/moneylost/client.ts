import type { Vertical, MoneyLostSummary } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function requestMoneyLost(vertical: Vertical, answers: Record<string, unknown>): Promise<MoneyLostSummary> {
  const { data, error } = await supabase.functions.invoke('moneylost_compute', {
    body: { vertical, answers }
  });

  if (error) {
    throw new Error(error.message || 'MoneyLost compute failed');
  }

  return data;
}