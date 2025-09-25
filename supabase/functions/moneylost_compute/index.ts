import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { normalizeError } from '../_shared/errorUtils.ts';
import { z } from '../_shared/zod.ts';
import { MoneyLostInputSchema, MoneyLostOutputSchema } from '../_shared/validation.ts';
import type { MoneyLostInput, MoneyLostOutput, ErrorResponse } from '../_shared/types.ts';

// Core computation logic ported from modules/moneylost/moneylost.ts
type Vertical = 'dental' | 'hvac';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type BizSize = 'small' | 'medium' | 'large';

interface RecoverableRange { 
  min: number; 
  max: number; 
}

interface LossArea {
  key: string; 
  title: string;
  dailyUsd: number; 
  monthlyUsd: number; 
  annualUsd: number;
  severity: Severity; 
  recoverablePctRange: RecoverableRange; 
  rationale: string[];
}

interface MoneyLostSummary {
  vertical: Vertical;
  dailyTotalUsd: number;
  monthlyTotalUsd: number;
  annualTotalUsd: number;
  areas: LossArea[];
  assumptions: string[];
  version: string;
}

interface Benchmarks {
  workDaysPerMonth: number;
  busyMonthsFraction: number;
  dental: {
    appointmentBlend: { stdWeight: number; complexWeight: number };
    newPatientCallToAppointment: { small: number; medium: number; large: number };
    defaultWeeklyNoShowsBySize: { small: number; medium: number; large: number };
    defaultRecallSuccess: number;
    reviewImpactMaxPct: number;
  };
  hvac: {
    ticketBlend: { basicWeight: number; largeWeight: number };
    callToJobBySize: { small: number; medium: number; large: number };
    pendingQuoteCloseRateBaseline: number;
    maintenanceAnnualFactorFromBasic: number;
    reviewImpactMaxPct: number;
  };
}

const DEFAULT_BENCHMARKS: Benchmarks = {
  workDaysPerMonth: 22,
  busyMonthsFraction: 0.33,
  dental: {
    appointmentBlend: { stdWeight: 0.75, complexWeight: 0.25 },
    newPatientCallToAppointment: { small: 0.25, medium: 0.35, large: 0.45 },
    defaultWeeklyNoShowsBySize: { small: 2, medium: 4, large: 6 },
    defaultRecallSuccess: 0.40,
    reviewImpactMaxPct: 0.08
  },
  hvac: {
    ticketBlend: { basicWeight: 0.70, largeWeight: 0.30 },
    callToJobBySize: { small: 0.60, medium: 0.70, large: 0.75 },
    pendingQuoteCloseRateBaseline: 0.35,
    maintenanceAnnualFactorFromBasic: 2.5,
    reviewImpactMaxPct: 0.06
  }
};

// Helper functions
const mcPick = (val: unknown, map: Record<string, number>, fallback = 0) =>
  map[String(val) as keyof typeof map] ?? fallback;

const safeNum = (v: unknown, def = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : def;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const usd = (n: number) => Math.max(0, Math.round(n));

function severityFromDaily(dailyUsd: number): Severity {
  if (dailyUsd > 1000) return 'CRITICAL';
  if (dailyUsd >= 500) return 'HIGH';
  if (dailyUsd >= 200) return 'MEDIUM';
  return 'LOW';
}

function pickBizSize(vertical: Vertical, answers: Record<string, unknown>): BizSize {
  if (vertical === 'dental') {
    const chairs = String(answers['dental_chairs_active_choice'] ?? '3_4');
    return chairs === '1_2' ? 'small' : chairs === '5_8' ? 'large' : 'medium';
  } else {
    const techs = String(answers['field_technicians_count_choice'] ?? '3_5');
    return techs === '1_2' ? 'small' : techs === '6_10' ? 'large' : 'medium';
  }
}

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

function computeMoneyLost({ vertical, answers, benchmarks = DEFAULT_BENCHMARKS }: { vertical: Vertical; answers: Record<string, unknown>; benchmarks?: Benchmarks }): MoneyLostSummary {
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
    version: 'ml-edge-v2.0'
  };
}

function dentalAreas(
  ans: Record<string, unknown>,
  b: Benchmarks,
  size: BizSize,
  workDays: number,
  assumptions: string[]
): LossArea[] {
  const std = safeNum(ans['avg_fee_standard_treatment_usd'], 0);
  const complex = safeNum(ans['avg_fee_complex_treatment_usd'], 0);
  let apptValue = 0;
  if (std && complex) {
    apptValue = std * b.dental.appointmentBlend.stdWeight + complex * b.dental.appointmentBlend.complexWeight;
  } else if (std) {
    apptValue = std * 0.9;
    assumptions.push('Complex treatment fee missing; used standard fee ×0.9 for appointment value.');
  } else if (complex) {
    apptValue = complex * 0.4;
    assumptions.push('Standard fee missing; used 40% of complex fee for appointment value.');
  } else {
    apptValue = 180;
    assumptions.push('No fee data; used $180 conservative appointment value.');
  }

  const sizeConv = b.dental.newPatientCallToAppointment[size];
  const userConv = mcPick(ans['new_patient_conversion_rate_choice'], { '0_2': 0.2, '3_5': 0.4, '6_10': 0.8 }, sizeConv);
  const callToAppt = clamp(userConv, 0.1, 0.85);

  const missedDaily = mcPick(ans['daily_unanswered_calls_choice'], { '0': 0, '1_3': 2, '4_10': 7, '11_20': 15, '21_plus': 25 }, 0);
  const missedCallsLossDaily = missedDaily * apptValue * callToAppt;
  const missedCalls = asArea('missed_calls', 'Missed Calls Revenue Loss', missedCallsLossDaily, workDays, { min: 0.35, max: 0.60 }, [
    `Missed calls per day ≈ ${missedDaily}`,
    `Call→appointment ≈ ${(callToAppt*100).toFixed(0)}%`,
    `Avg appointment ≈ $${usd(apptValue)}`
  ]);

  const noShowsWeekly = mcPick(ans['weekly_no_shows_choice'], { '0': 0, '1_3': 2, '4_6': 5, '7_10': 9, '11_plus': 12 }, b.dental.defaultWeeklyNoShowsBySize[size]);
  const noShowsLossDaily = (noShowsWeekly * apptValue) / 7;
  const noShows = asArea('no_shows', 'No-Shows Revenue Loss', noShowsLossDaily, workDays, { min: 0.30, max: 0.60 }, [
    `No-shows per week ≈ ${noShowsWeekly}`,
    `Avg appointment ≈ $${usd(apptValue)}`
  ]);

  const coldPlansMonthly = safeNum(ans['monthly_cold_treatment_plans'], 0);
  const avgUnacceptedValue = safeNum(ans['avg_unaccepted_plan_value_usd'], Math.max(250, apptValue * 2));
  if (!ans['avg_unaccepted_plan_value_usd']) assumptions.push('Unaccepted plan value missing; used max($250, 2×appointment value).');

  const plansLossDaily = (coldPlansMonthly * avgUnacceptedValue) / workDays;
  const plans = asArea('treatment_plans', 'Treatment Plans Revenue Loss', plansLossDaily, workDays, { min: 0.25, max: 0.50 }, [
    `Cold plans per month ≈ ${coldPlansMonthly}`,
    `Avg unaccepted plan ≈ $${usd(avgUnacceptedValue)}`
  ]);

  return [missedCalls, noShows, plans];
}

function hvacAreas(
  ans: Record<string, unknown>,
  b: Benchmarks,
  size: BizSize,
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
    avgTicket = largeTicket * 0.25;
    assumptions.push('Basic ticket missing; used 25% of large job value as avg ticket.');
  } else {
    avgTicket = 250;
    assumptions.push('No ticket data; used $250 conservative average ticket.');
  }

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

  const cancelsWeekly = mcPick(ans['weekly_job_cancellations_choice'], { 'none': 0, '1_2': 1.5, '3_5': 4, 'gt_5': 7 }, 0);
  const avgCanceledValue = safeNum(ans['avg_canceled_job_value_usd'], avgTicket);
  const cancelsLossDaily = (cancelsWeekly * avgCanceledValue) / 7;
  const cancels = asArea('last_minute_cancellations', 'Last-Minute Cancellations Loss', cancelsLossDaily, workDays, { min: 0.30, max: 0.55 }, [
    `Cancellations per week ≈ ${cancelsWeekly}`,
    `Avg canceled job ≈ $${usd(avgCanceledValue)}`
  ]);

  return [missed, cancels];
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Anonymous access allowed for public audits
  logger.info('Processing anonymous MoneyLost request');

  if (req.method !== 'POST') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: { message: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' },
      metadata: { processing_time_ms: Date.now() - startTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const input = MoneyLostInputSchema.parse(body);
    const { vertical, answers } = input;

    logger.info('Processing MoneyLost computation', { vertical });

    // Real computation logic
    const summary = computeMoneyLost({ vertical, answers });
    
    // Transform to match expected output format (modules/moneylost/types.ts)
    const output: MoneyLostOutput = {
      total: {
        dailyUsd: summary.dailyTotalUsd,
        monthlyUsd: summary.monthlyTotalUsd,
        annualUsd: summary.annualTotalUsd
      },
      areas: summary.areas.map(area => ({
        key: area.key,
        title: area.title,
        dailyUsd: area.dailyUsd,
        monthlyUsd: area.monthlyUsd,
        annualUsd: area.annualUsd,
        severity: area.severity,
        recoverablePctRange: area.recoverablePctRange,
        rationale: area.rationale
      })),
      assumptions: summary.assumptions,
      version: summary.version
    };

    const processingTime = Date.now() - startTime;
    
    // Validate output
    const validatedOutput = MoneyLostOutputSchema.parse(output);

    logger.info('MoneyLost computation completed', { 
      vertical, 
      processingTime,
      totalMonthly: validatedOutput.total.monthlyUsd 
    });

    return new Response(JSON.stringify(validatedOutput), { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime}ms`
      }
    });

  } catch (error) {
    logger.error('MoneyLost computation error', error);
    
    const processingTime = Date.now() - startTime;
    const err = normalizeError(error);

    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: { 
          message: 'Invalid input format', 
          code: 'VALIDATION_ERROR',
          details: err.zodIssues 
        },
        metadata: { processing_time_ms: processingTime }
      };

      return new Response(JSON.stringify(errorResponse), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: { 
        message: err.message || 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      metadata: { processing_time_ms: processingTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});