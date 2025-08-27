/** @server-only: Do not import this module in client code */

import type { Vertical, MoneyLostSummary } from '../../modules/moneylost/types';
import { computeMoneyLost } from '../../modules/moneylost/moneylost';
import { DEFAULT_BENCHMARKS } from '../../modules/moneylost/benchmarks';

export async function computeMoneyLostServer(vertical: Vertical, answers: Record<string, unknown>): Promise<MoneyLostSummary> {
  // No I/O; deterministic pure compute
  return computeMoneyLost({ vertical, answers, benchmarks: DEFAULT_BENCHMARKS });
}