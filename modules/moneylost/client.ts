import type { Vertical, MoneyLostSummary } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function requestMoneyLost(vertical: Vertical, answers: Record<string, unknown>): Promise<MoneyLostSummary> {
  const { data, error } = await supabase.functions.invoke('moneylost_compute', {
    body: { vertical, answers }
  });

  if (error) {
    throw new Error(error.message || 'MoneyLost compute failed');
  }

  // Transform the response to match the expected schema
  // Edge function returns: {dailyTotalUsd, monthlyTotalUsd, annualTotalUsd, areas, assumptions, version}
  // Client expects: {total: {dailyUsd, monthlyUsd, annualUsd}, areas, assumptions, version}
  const transformed: MoneyLostSummary = {
    total: {
      dailyUsd: data.dailyTotalUsd,
      monthlyUsd: data.monthlyTotalUsd,
      annualUsd: data.annualTotalUsd
    },
    areas: data.areas,
    assumptions: data.assumptions,
    version: data.version
  };

  return transformed;
}