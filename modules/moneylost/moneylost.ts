import type { MoneyLostSummary, LossArea, Vertical } from './types';
import type { Benchmarks } from './benchmarks';
import { DEFAULT_BENCHMARKS, pickBizSize } from './benchmarks';
import { severityFromDaily } from './severity';

const VERSION = 'ml-v2.0';

// Helpers to interpret categorical answers conservatively
const mcPick = (val: unknown, map: Record<string, number>, fallback = 0) =>
  map[String(val) as keyof typeof map] ?? fallback;

const safeNum = (v: unknown, def = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : def;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function usd(n: number) { return Math.max(0, Math.round(n)); }

export interface ComputeArgs {
  vertical: Vertical;
  answers: Record<string, unknown>;
  benchmarks?: Benchmarks;
}

export function computeMoneyLost({ vertical, answers, benchmarks = DEFAULT_BENCHMARKS }: ComputeArgs): MoneyLostSummary {
  const b = benchmarks;
  const size = pickBizSize(vertical, answers);
  const assumptions: string[] = [];

  const workDays = b.workDaysPerMonth;

  const areas: LossArea[] =
    vertical === 'dental'
      ? dentalAreas(answers, b, size, workDays, assumptions)
      : hvacAreas(answers, b, size, workDays, assumptions);

  const dailyTotal = areas.reduce((s, a) => s + a.dailyUsd, 0);
  const monthlyTotal = areas.reduce((s, a) => s + a.monthlyUsd, 0);
  const annualTotal = areas.reduce((s, a) => s + a.annualUsd, 0);

  return {
    vertical,
    dailyTotalUsd: usd(dailyTotal),
    monthlyTotalUsd: usd(monthlyTotal),
    annualTotalUsd: usd(annualTotal),
    areas: areas.sort((a, z) => z.dailyUsd - a.dailyUsd),
    assumptions,
    version: VERSION
  };
}

/* ----------------- DENTAL ----------------- */
function dentalAreas(
  ans: Record<string, unknown>,
  b: Benchmarks,
  size: 'small' | 'medium' | 'large',
  workDays: number,
  assumptions: string[]
): LossArea[] {

  // Appointment value (conservative blend)
  const std = safeNum(ans['avg_fee_standard_treatment_usd'], 0);
  const complex = safeNum(ans['avg_fee_complex_treatment_usd'], 0);
  let apptValue = 0;
  if (std && complex) {
    apptValue = std * b.dental.appointmentBlend.stdWeight + complex * b.dental.appointmentBlend.complexWeight;
  } else if (std) {
    apptValue = std * 0.9; // conservative haircut
    assumptions.push('Complex treatment fee missing; used standard fee ×0.9 for appointment value.');
  } else if (complex) {
    apptValue = complex * 0.4; // complex is rarer; conservative
    assumptions.push('Standard fee missing; used 40% of complex fee for appointment value.');
  } else {
    apptValue = 180; // conservative fallback
    assumptions.push('No fee data; used $180 conservative appointment value.');
  }

  // Call→appointment conversion (from size, modulated by explicit answer if present)
  const sizeConv = b.dental.newPatientCallToAppointment[size];
  const userConv = mcPick(ans['new_patient_conversion_rate_choice'], { '0_2': 0.2, '3_5': 0.4, '6_10': 0.8 }, sizeConv);
  const callToAppt = clamp(userConv, 0.1, 0.85);

  // Daily missed calls
  const missedDaily = mcPick(ans['daily_unanswered_calls_choice'], { '0': 0, '1_3': 2, '4_10': 7, '11_20': 15, '21_plus': 25 }, 0);

  const missedCallsLossDaily = missedDaily * apptValue * callToAppt;
  const missedCalls: LossArea = asArea('missed_calls', 'Missed Calls Revenue Loss', missedCallsLossDaily, workDays, { min: 0.35, max: 0.60 }, [
    `Missed calls per day ≈ ${missedDaily}`,
    `Call→appointment ≈ ${(callToAppt*100).toFixed(0)}%`,
    `Avg appointment ≈ $${usd(apptValue)}`
  ]);

  // Weekly no-shows
  const noShowsWeekly = mcPick(ans['weekly_no_shows_choice'], { '0': 0, '1_3': 2, '4_6': 5, '7_10': 9, '11_plus': 12 }, b.dental.defaultWeeklyNoShowsBySize[size]);
  const noShowsLossDaily = (noShowsWeekly * apptValue) / 7;
  const noShows = asArea('no_shows', 'No-Shows Revenue Loss', noShowsLossDaily, workDays, { min: 0.30, max: 0.60 }, [
    `No-shows per week ≈ ${noShowsWeekly}`,
    `Avg appointment ≈ $${usd(apptValue)}`
  ]);

  // Treatment plans
  const coldPlansMonthly = safeNum(ans['monthly_cold_treatment_plans'], 0);
  const avgUnacceptedValue = safeNum(ans['avg_unaccepted_plan_value_usd'], Math.max(250, apptValue * 2));
  if (!ans['avg_unaccepted_plan_value_usd']) assumptions.push('Unaccepted plan value missing; used max($250, 2×appointment value).');

  const plansLossDaily = (coldPlansMonthly * avgUnacceptedValue) / workDays;
  const plans = asArea('treatment_plans', 'Treatment Plans Revenue Loss', plansLossDaily, workDays, { min: 0.25, max: 0.50 }, [
    `Cold plans per month ≈ ${coldPlansMonthly}`,
    `Avg unaccepted plan ≈ $${usd(avgUnacceptedValue)}`
  ]);

  // Inactive patients
  const inactiveCount = safeNum(ans['inactive_patients_count'], 0);
  const reactivationValue = safeNum(ans['reactivated_patient_first_year_value_usd'], Math.max(150, apptValue * 1.2));
  const recallResp = mcPick(ans['recall_response_rate_choice'], { '0_2': 0.20, '3_5': 0.40, '6_8': 0.70, '9_10': 0.90 }, b.dental.defaultRecallSuccess);
  const inactiveMonthlyPotential = inactiveCount * reactivationValue * recallResp / 12;
  const inactiveLossDaily = inactiveMonthlyPotential / workDays;
  const inactive = asArea('inactive_patients', 'Patient Reactivation Loss', inactiveLossDaily, workDays, { min: 0.15, max: 0.35 }, [
    `Inactive patients ≈ ${inactiveCount}`,
    `Recall success ≈ ${(recallResp*100).toFixed(0)}%`,
    `Reactivation value (year 1) ≈ $${usd(reactivationValue)}`
  ]);

  // Reviews reputation (velocity proxy)
  const reviewVelocity = mcPick(ans['monthly_google_reviews_choice'], { '0': 0, '1_3': 2, '4_10': 6, '11_20': 14, 'gt_20': 22 }, 2);
  const newPatientsMonthly = safeNum(ans['monthly_new_patients'], 0);
  const newLTV = safeNum(ans['new_patient_first_year_ltv_usd'], apptValue * 3);
  // very conservative: at low velocity (<=3/mo), assume ≤reviewImpactMaxPct loss on new LTV; scale linearly until 10/mo
  const lackPct = reviewVelocity <= 3 ? b.dental.reviewImpactMaxPct
                    : reviewVelocity <= 10 ? b.dental.reviewImpactMaxPct * ( (10 - reviewVelocity) / 7 )
                    : 0;
  const reviewsLossMonthly = newPatientsMonthly * newLTV * clamp(lackPct, 0, b.dental.reviewImpactMaxPct);
  const reviewsLossDaily = reviewsLossMonthly / workDays;
  const reviews = asArea('reviews', 'Review & Reputation Loss', reviewsLossDaily, workDays, { min: 0.05, max: 0.15 }, [
    `Review velocity ≈ ${reviewVelocity}/mo`,
    `New patients/mo ≈ ${newPatientsMonthly}, LTV(year1) ≈ $${usd(newLTV)}`
  ]);

  // Appointment fill rate loss
  const chairsActive = safeNum(ans['dental_chairs_active_choice'] === '1_2' ? 1.5 : ans['dental_chairs_active_choice'] === '3_4' ? 3.5 : ans['dental_chairs_active_choice'] === '5_8' ? 6.5 : 10, 3);
  const fillRate = mcPick(ans['appointment_fill_rate_choice'], { '90_100': 0.95, '80_89': 0.85, '70_79': 0.75, 'lt_70': 0.65 }, 0.85);
  const targetFill = 0.90; // conservative target
  const fillGap = Math.max(0, targetFill - fillRate);
  const chairCapacityDaily = chairsActive * 8; // 8 appointments per chair per day
  const fillLossDaily = chairCapacityDaily * fillGap * apptValue;
  const fill = asArea('fill_rate', 'Appointment Fill Rate Loss', fillLossDaily, workDays, { min: 0.20, max: 0.40 }, [
    `Fill rate gap ≈ ${(fillGap*100).toFixed(0)}%`,
    `Chair capacity ≈ ${chairCapacityDaily} appts/day`,
    `Avg appointment ≈ $${usd(apptValue)}`
  ]);

  return [missedCalls, noShows, plans, inactive, reviews, fill];
}

/* ----------------- HVAC ----------------- */
function hvacAreas(
  ans: Record<string, unknown>,
  b: Benchmarks,
  size: 'small' | 'medium' | 'large',
  workDays: number,
  assumptions: string[]
): LossArea[] {

  const basicTicket = safeNum(ans['basic_service_call_fee_usd'], 0);
  const largeTicket = safeNum(ans['large_job_install_value_usd'], 0);
  let avgTicket = 0;
  if (basicTicket && largeTicket) {
    avgTicket = basicTicket * b.hvac.ticketBlend.basicWeight + largeTicket * b.hvac.ticketBlend.largeWeight;
  } else if (basicTicket) {
    avgTicket = basicTicket;
  } else if (largeTicket) {
    avgTicket = largeTicket * 0.25; // conservative share of large jobs
    assumptions.push('Basic ticket missing; used 25% of large job value as avg ticket.');
  } else {
    avgTicket = 250; // fallback
    assumptions.push('No ticket data; used $250 conservative average ticket.');
  }

  // Missed service calls
  const missedCalls = mcPick(ans['hvac_daily_unanswered_calls_choice'], { 'none': 0, '1_3': 2, '4_6': 5, 'gt_6': 8 }, 0);
  const callToJob = b.hvac.callToJobBySize[size];
  const missedValuePerCall = safeNum(ans['missed_call_estimated_value_usd'], avgTicket);
  if (!ans['missed_call_estimated_value_usd']) assumptions.push('Missed call value missing; used average ticket.');

  const missedLossDaily = missedCalls * missedValuePerCall * callToJob;
  const missed = asArea('missed_service_calls', 'Missed Service Calls Loss', missedLossDaily, workDays, { min: 0.35, max: 0.60 }, [
    `Missed calls per day ≈ ${missedCalls}`,
    `Call→job ≈ ${(callToJob*100).toFixed(0)}%`,
    `Value per call ≈ $${usd(missedValuePerCall)}`
  ]);

  // Last-minute cancellations
  const cancelsWeekly = mcPick(ans['weekly_job_cancellations_choice'], { 'none': 0, '1_2': 1.5, '3_5': 4, 'gt_5': 7 }, 0);
  const avgCanceledValue = safeNum(ans['avg_canceled_job_value_usd'], avgTicket);
  const cancelsLossDaily = (cancelsWeekly * avgCanceledValue) / 7;
  const cancels = asArea('last_minute_cancellations', 'Last-Minute Cancellations Loss', cancelsLossDaily, workDays, { min: 0.30, max: 0.55 }, [
    `Cancellations per week ≈ ${cancelsWeekly}`,
    `Avg canceled job ≈ $${usd(avgCanceledValue)}`
  ]);

  // Pending quotes
  const pendingQuotes = safeNum(ans['monthly_pending_quotes'], 0);
  const pendingValue = safeNum(ans['average_pending_quote_value_usd'], Math.max(avgTicket, 500));
  const followup = String(ans['quote_followup_timeline_choice'] ?? '2_3_days');
  const followupFactor = ({ same_day: 1.15, '2_3_days': 1.0, '1_week': 0.8, no_consistent: 0.6 } as Record<string, number>)[followup] ?? 1.0;
  const closeBaseline = b.hvac.pendingQuoteCloseRateBaseline;
  const expectedCloseRate = clamp(closeBaseline * followupFactor, 0.1, 0.6); // conservative bounds
  const pendingLossDaily = (pendingQuotes * pendingValue * expectedCloseRate) / workDays;
  const pending = asArea('pending_quotes', 'Pending Quotes Revenue Loss', pendingLossDaily, workDays, { min: 0.25, max: 0.50 }, [
    `Pending quotes/mo ≈ ${pendingQuotes}`,
    `Avg pending ≈ $${usd(pendingValue)}`,
    `Expected close rate ≈ ${(expectedCloseRate*100).toFixed(0)}%`
  ]);

  // Capacity overflow (busy season)
  const turnawayPct = mcPick(ans['busy_season_turnaway_rate_choice'], { 'lt_5': 0.03, '5_10': 0.075, '10_20': 0.15, 'gt_20': 0.25 }, 0.05);
  const jobsMonthly = safeNum(ans['monthly_jobs_completed'], 0);
  const overflowYearly = jobsMonthly * avgTicket * turnawayPct * (b.busyMonthsFraction * 12);
  const overflowLossDaily = (overflowYearly / 12) / workDays;
  const overflow = asArea('capacity_overflow', 'Capacity Overflow Loss', overflowLossDaily, workDays, { min: 0.20, max: 0.45 }, [
    `Turnaway ≈ ${(turnawayPct*100).toFixed(1)}% during busy months`,
    `Avg ticket ≈ $${usd(avgTicket)}`
  ]);

  // Maintenance plans gap
  const plansPct = mcPick(ans['customers_with_maintenance_plans_choice'], { 'gt_70': 0.75, '40_70': 0.55, '20_40': 0.30, 'lt_20': 0.15 }, 0.30);
  const gapPct = clamp(0.7 - plansPct, 0, 0.7); // target 70% coverage as conservative
  const monthlyCustomers = safeNum(ans['monthly_new_customers'], 0) || jobsMonthly; // proxy
  const planAnnual = (basicTicket || avgTicket) * b.hvac.maintenanceAnnualFactorFromBasic;
  const maintenanceLossDaily = ((monthlyCustomers * gapPct * (planAnnual / 12))) / workDays;
  const maintenance = asArea('maintenance_gap', 'Maintenance Plans Gap Loss', maintenanceLossDaily, workDays, { min: 0.20, max: 0.40 }, [
    `Coverage gap ≈ ${(gapPct*100).toFixed(0)}%`,
    `Plan annual value ≈ $${usd(planAnnual)}`
  ]);

  // Reviews & referrals
  const reviewVel = mcPick(ans['monthly_online_reviews_choice'], { 'gt_10': 12, '4_10': 7, '1_3': 2, '0': 0 }, 2);
  const newCustomersMonthly = safeNum(ans['monthly_new_customers'], 0);
  const newLTV = safeNum(ans['new_customer_first_year_ltv_usd'], avgTicket * 4);
  const lackPct = reviewVel <= 3 ? b.hvac.reviewImpactMaxPct
                  : reviewVel <= 10 ? b.hvac.reviewImpactMaxPct * ((10 - reviewVel) / 7)
                  : 0;
  const reviewLossMonthly = newCustomersMonthly * newLTV * clamp(lackPct, 0, b.hvac.reviewImpactMaxPct);
  const reviewLossDaily = reviewLossMonthly / workDays;
  const reviews = asArea('reviews_referrals', 'Reviews & Referrals Loss', reviewLossDaily, workDays, { min: 0.05, max: 0.12 }, [
    `Review velocity ≈ ${reviewVel}/mo`,
    `New customers/mo ≈ ${newCustomersMonthly}, LTV(year1) ≈ $${usd(newLTV)}`
  ]);

  return [missed, cancels, pending, overflow, maintenance, reviews];
}

/* ------------- shared area helper ------------- */
function asArea(
  key: string,
  title: string,
  daily: number,
  workDays: number,
  recoverable: { min: number; max: number },
  rationale: string[]
): LossArea {
  const dailyUsd = usd(daily);
  const monthlyUsd = usd(daily * workDays);
  const annualUsd = usd(monthlyUsd * 12);
  return {
    key,
    title,
    dailyUsd,
    monthlyUsd,
    annualUsd,
    severity: severityFromDaily(dailyUsd),
    recoverablePctRange: { min: recoverable.min, max: recoverable.max },
    rationale
  };
}