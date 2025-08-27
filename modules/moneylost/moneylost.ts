import type { MoneyLostSummary, LossArea, CalculatorOptions } from './moneylost.types';

export type { LossArea, MoneyLostSummary, CalculatorOptions } from './moneylost.types';

type Vertical = 'dental' | 'hvac';
type Answers = Record<string, unknown>;

const USD = (n: number) => Math.max(0, Number.isFinite(n) ? n : 0);

const defaultOpts: Required<CalculatorOptions> = {
  workdaysDental: 22,
  workdaysHvac: 26,
};

/** Public API */
export function computeMoneyLost(vertical: Vertical, answers: Answers, opts: CalculatorOptions = {}): MoneyLostSummary {
  const settings = { ...defaultOpts, ...opts };
  const workdays = vertical === 'dental' ? settings.workdaysDental : settings.workdaysHvac;

  const areas: LossArea[] =
    vertical === 'dental'
      ? computeDentalAreas(answers, workdays)
      : computeHvacAreas(answers, workdays);

  const dailyUsd = round2(areas.reduce((s, a) => s + a.dailyUsd, 0));
  const monthlyUsd = round0(dailyUsd * workdays);
  const annualUsd = round0(monthlyUsd * 12);

  return { dailyUsd, monthlyUsd, annualUsd, areas: areas.sort((a,b)=>b.dailyUsd-a.dailyUsd) };
}

/* -------------------- Dental -------------------- */

function computeDentalAreas(ans: Answers, workdays: number): LossArea[] {
  // Inputs with conservative fallbacks
  const avgAppt = num(ans['avg_fee_standard_treatment_usd'], 180);                         // $
  const missedCallsDaily = mapDentalMissedCalls(ans['daily_unanswered_calls_choice']);      // #
  const weeklyNoShows = mapDentalWeeklyNoShows(ans['weekly_no_shows_choice']);              // #
  const monthlyColdPlans = num(ans['monthly_cold_treatment_plans'], 10);                    // #
  const avgUnacceptedPlan = num(ans['avg_unaccepted_plan_value_usd'], 800);                 // $
  const convFrom10 = mapDentalNewPatientConv(ans['new_patient_conversion_rate_choice']);    // 0..1

  // Area 1 — Missed Calls Revenue Loss
  // Formula: missedCallsDaily * avgAppt * convRate  (daily)
  // Conservative convRate: derived from "out of 10" selector (see mapper), else 0.35
  const convRate = convFrom10 ?? 0.35;
  const mcDaily = USD(missedCallsDaily * avgAppt * convRate);
  const mcMonthly = mcDaily * workdays;
  const areaMissedCalls: LossArea = {
    id: 'missed_calls',
    title: 'Missed Calls Revenue Loss',
    dailyUsd: round0(mcDaily),
    monthlyUsd: round0(mcMonthly),
    annualUsd: round0(mcMonthly * 12),
    recoverablePctRange: [0.35, 0.60],
    confidence: conf([missedCallsDaily, avgAppt], [true, isProvided(ans['avg_fee_standard_treatment_usd'])]),
    notes: 'Estimated using your average appointment value and conversion rate.'
  };

  // Area 2 — No-Shows Revenue Loss
  // Weekly → daily: divide by 5 (clinic weekdays). Daily loss = (weeklyNoShows * avgAppt) / 5
  const nsDaily = USD((weeklyNoShows * avgAppt) / 5);
  const nsMonthly = nsDaily * workdays;
  const areaNoShows: LossArea = {
    id: 'no_shows',
    title: 'No-Shows Revenue Loss',
    dailyUsd: round0(nsDaily),
    monthlyUsd: round0(nsMonthly),
    annualUsd: round0(nsMonthly * 12),
    recoverablePctRange: [0.30, 0.50],
    confidence: conf([weeklyNoShows, avgAppt], [isProvided(ans['weekly_no_shows_choice']), isProvided(ans['avg_fee_standard_treatment_usd'])]),
    notes: 'Assumes weekdays operations; reminders & deposits typically mitigate 30–50%.'
  };

  // Area 3 — Treatment Plans Revenue Loss
  // Monthly lost ≈ monthlyColdPlans * avgUnacceptedPlan  (conservative = 100% opportunity considered "cold")
  // Daily ≈ monthly / workdays
  const tpMonthly = USD(monthlyColdPlans * avgUnacceptedPlan);
  const tpDaily = USD(tpMonthly / workdays);
  const areaPlans: LossArea = {
    id: 'treatment_plans',
    title: 'Treatment Plans Revenue Loss',
    dailyUsd: round0(tpDaily),
    monthlyUsd: round0(tpMonthly),
    annualUsd: round0(tpMonthly * 12),
    recoverablePctRange: [0.25, 0.45],
    confidence: conf([monthlyColdPlans, avgUnacceptedPlan], [isProvided(ans['monthly_cold_treatment_plans']), isProvided(ans['avg_unaccepted_plan_value_usd'])]),
    notes: 'Cold plans treated as leakage potential; follow-ups typically recover 25–45%.'
  };

  return [areaMissedCalls, areaNoShows, areaPlans];
}

function mapDentalMissedCalls(v: unknown): number {
  switch (str(v)) {
    case '0': return 0;
    case '1_3': return 2;
    case '4_10': return 7;
    case '11_20': return 15;
    case '21_plus': return 25;
    default: return 2; // conservative default if unknown
  }
}
function mapDentalWeeklyNoShows(v: unknown): number {
  switch (str(v)) {
    case '0': return 0;
    case '1_3': return 2;
    case '4_6': return 5;
    case '7_10': return 8;
    case '11_plus': return 12;
    default: return 2;
  }
}
function mapDentalNewPatientConv(v: unknown): number | undefined {
  // From "Out of 10 calls... book appointments?"
  // Conservative midpoints: 0–2 ⇒ 0.15, 3–5 ⇒ 0.35, 6–10 ⇒ 0.65
  switch (str(v)) {
    case '0_2': return 0.15;
    case '3_5': return 0.35;
    case '6_10': return 0.65;
    default: return undefined;
  }
}

/* -------------------- HVAC -------------------- */

function computeHvacAreas(ans: Answers, workdays: number): LossArea[] {
  const valuePerMissed = num(ans['missed_call_estimated_value_usd'], 250);                   // $
  const missedCallsDaily = mapHvacMissedCalls(ans['daily_unanswered_calls_choice']);         // #
  const weeklyCancels = mapHvacWeeklyCancels(ans['weekly_job_cancellations_choice']);        // #
  const avgCanceledJob = num(ans['avg_canceled_job_value_usd'], 350);                        // $
  const monthlyPendingQuotes = num(ans['monthly_pending_quotes'], 12);                       // #
  const avgPendingQuote = num(ans['average_pending_quote_value_usd'], 1500);                 // $
  const callbackSpeed = str(ans['missed_call_response_time_choice']);                        // affects close rate

  // Derive a conservative close rate modifier from response time (faster ⇒ better)
  const baseClose = 0.35;
  const closeMod = ((): number => {
    switch (callbackSpeed) {
      case 'immediate': return 1.0;
      case '2h': return 0.9;
      case 'same_day': return 0.8;
      case 'next_day': return 0.6;
      default: return 0.85;
    }
  })();
  const effectiveClose = clamp(baseClose * closeMod, 0.2, 0.6);

  // Area 1 — Missed Service Calls Loss
  // daily = missedCallsDaily * valuePerMissed * effectiveClose
  const mcDaily = USD(missedCallsDaily * valuePerMissed * effectiveClose);
  const mcMonthly = mcDaily * workdays;
  const areaMissedCalls: LossArea = {
    id: 'missed_calls',
    title: 'Missed Service Calls Loss',
    dailyUsd: round0(mcDaily),
    monthlyUsd: round0(mcMonthly),
    annualUsd: round0(mcMonthly * 12),
    recoverablePctRange: [0.35, 0.60],
    confidence: conf([missedCallsDaily, valuePerMissed], [isProvided(ans['daily_unanswered_calls_choice']), isProvided(ans['missed_call_estimated_value_usd'])]),
    notes: 'Close-rate adjusted using your callback speed.'
  };

  // Area 2 — Last-Minute Cancellations Loss
  // Weekly → daily via /5
  const cancDaily = USD((weeklyCancels * avgCanceledJob) / 5);
  const cancMonthly = cancDaily * workdays;
  const areaCancels: LossArea = {
    id: 'cancellations',
    title: 'Last-Minute Cancellations Loss',
    dailyUsd: round0(cancDaily),
    monthlyUsd: round0(cancMonthly),
    annualUsd: round0(cancMonthly * 12),
    recoverablePctRange: [0.30, 0.50],
    confidence: conf([weeklyCancels, avgCanceledJob], [isProvided(ans['weekly_job_cancellations_choice']), isProvided(ans['avg_canceled_job_value_usd'])]),
    notes: 'Deposits & reminder flows typically recover 30–50%.'
  };

  // Area 3 — Pending Quotes Revenue Loss
  // Conservative: treat 25% of monthly pending value as leakage (deals that stall out)
  const monthlyPendingValue = USD(monthlyPendingQuotes * avgPendingQuote);
  const pendMonthlyLeak = USD(monthlyPendingValue * 0.25);
  const pendDaily = USD(pendMonthlyLeak / workdays);
  const areaPending: LossArea = {
    id: 'pending_quotes',
    title: 'Pending Quotes Revenue Loss',
    dailyUsd: round0(pendDaily),
    monthlyUsd: round0(pendMonthlyLeak),
    annualUsd: round0(pendMonthlyLeak * 12),
    recoverablePctRange: [0.25, 0.45],
    confidence: conf([monthlyPendingQuotes, avgPendingQuote], [isProvided(ans['monthly_pending_quotes']), isProvided(ans['average_pending_quote_value_usd'])]),
    notes: 'Assumes 25% stall leakage; follow-ups typically recover 25–45%.'
  };

  return [areaMissedCalls, areaCancels, areaPending];
}

function mapHvacMissedCalls(v: unknown): number {
  switch (str(v)) {
    case 'none': return 0;
    case '1_3': return 2;
    case '4_6': return 5;
    case 'gt_6': return 8;
    default: return 2; // conservative default
  }
}

function mapHvacWeeklyCancels(v: unknown): number {
  switch (str(v)) {
    case 'none': return 0;
    case '1_2': return 2;
    case '3_5': return 4;
    case 'gt_5': return 7;
    default: return 2;
  }
}

/* -------------------- Utils -------------------- */

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
  return Number.isFinite(n) ? n : fallback;
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
function isProvided(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).length > 0;
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function round0(n: number) { return Math.round(n); }
function round2(n: number) { return Math.round(n * 100) / 100; }
function conf(values: Array<number>, providedFlags: Array<boolean>): 'low'|'medium'|'high' {
  // Heuristic: high if all provided AND non-zero; medium if at least one exact; low if all fallbacks.
  const provided = providedFlags.filter(Boolean).length;
  const nonZero = values.filter(x => x > 0).length;
  if (provided === providedFlags.length && nonZero > 0) return 'high';
  if (provided > 0) return 'medium';
  return 'low';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}