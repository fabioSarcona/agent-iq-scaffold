import type { LossArea } from './types';

type Confidence = 'low' | 'medium' | 'high';

const DENTAL_WORKDAYS = 22;
const HVAC_WORKDAYS = 26;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getConfidence(hasQuantity: boolean, hasValue: boolean): Confidence {
  if (hasQuantity && hasValue) return 'high';
  if (hasQuantity || hasValue) return 'medium';
  return 'low';
}

function mapChoiceToNumber(choice: string, mapping: Record<string, number>): number {
  return mapping[choice] || 0;
}

export function buildMockMoneyLost(
  vertical: 'dental' | 'hvac', 
  answers: Record<string, unknown>
): MoneyLostSummary {
  const workdays = vertical === 'dental' ? DENTAL_WORKDAYS : HVAC_WORKDAYS;
  const areas: LossArea[] = [];

  if (vertical === 'dental') {
    // Dental field extraction with conservative fallbacks
    const avgAppointmentValue = (answers.avg_fee_standard_treatment_usd as number) || 180;
    
    const dailyMissedCallsChoice = (answers.daily_unanswered_calls_choice as string) || '0';
    const dailyMissedCalls = mapChoiceToNumber(dailyMissedCallsChoice, {
      '0': 0,
      '1_3': 2,
      '4_10': 7,
      '11_20': 15,
      '21_plus': 25
    });

    const weeklyNoShowsChoice = (answers.weekly_no_shows_choice as string) || '0';
    const weeklyNoShows = mapChoiceToNumber(weeklyNoShowsChoice, {
      '0': 0,
      '1_3': 2,
      '4_6': 5,
      '7_10': 8,
      '11_plus': 12
    });

    const monthlyColdPlans = (answers.monthly_cold_treatment_plans as number) || 10;
    const avgUnacceptedPlanValue = (answers.avg_unaccepted_plan_value_usd as number) || 800;

    // Missed Calls Loss Area
    if (dailyMissedCalls > 0) {
      const daily = dailyMissedCalls * avgAppointmentValue * 0.35;
      const monthly = daily * workdays;
      const annual = monthly * 12;
      
        areas.push({
          key: 'missed_calls',
          title: 'Missed Calls Revenue Loss',
          dailyUsd: daily,
          monthlyUsd: monthly,
          annualUsd: annual,
          recoverablePctRange: { min: 0.35, max: 0.60 },
          rationale: ['Based on average appointment value and conversion rates']
        });
    }

    // No-Shows Loss Area
    if (weeklyNoShows > 0) {
      const daily = (weeklyNoShows * avgAppointmentValue) / 5;
      const monthly = daily * workdays;
      const annual = monthly * 12;
      
      areas.push({
        key: 'no_shows',
        title: 'No-Show Revenue Loss',
        dailyUsd: daily,
        monthlyUsd: monthly,
        annualUsd: annual,
        recoverablePctRange: { min: 0.30, max: 0.50 },
        rationale: ['Estimated lost revenue from missed appointments']
      });
    }

    // Treatment Plans Loss Area
    if (monthlyColdPlans > 0) {
      const daily = (monthlyColdPlans * avgUnacceptedPlanValue) / workdays;
      const monthly = daily * workdays;
      const annual = monthly * 12;
      
      areas.push({
        key: 'treatment_plans',
        title: 'Unaccepted Treatment Plans Loss',
        dailyUsd: daily,
        monthlyUsd: monthly,
        annualUsd: annual,
        recoverablePctRange: { min: 0.25, max: 0.45 },
        rationale: ['Revenue lost from treatment plans going cold']
      });
    }

  } else if (vertical === 'hvac') {
    // HVAC field extraction with conservative fallbacks
    const valuePerMissedCall = (answers.missed_call_estimated_value_usd as number) || 250;
    
    const dailyMissedCallsChoice = (answers.daily_unanswered_calls_choice as string) || 'none';
    const dailyMissedCalls = mapChoiceToNumber(dailyMissedCallsChoice, {
      'none': 0,
      '1_3': 2,
      '4_6': 5,
      'gt_6': 8
    });

    const weeklyCancellationsChoice = (answers.weekly_job_cancellations_choice as string) || 'none';
    const weeklyCancellations = mapChoiceToNumber(weeklyCancellationsChoice, {
      'none': 0,
      '1_2': 2,
      '3_5': 4,
      'gt_5': 7
    });

    const avgCanceledJobValue = (answers.avg_canceled_job_value_usd as number) || 350;
    const monthlyPendingQuotes = (answers.monthly_pending_quotes as number) || 12;
    const avgPendingQuoteValue = (answers.average_pending_quote_value_usd as number) || 1500;

    // Missed Service Calls Loss Area
    if (dailyMissedCalls > 0) {
      const daily = dailyMissedCalls * valuePerMissedCall * 0.35;
      const monthly = daily * workdays;
      const annual = monthly * 12;
      
      areas.push({
        key: 'missed_service_calls',
        title: 'Missed Service Calls Loss',
        dailyUsd: daily,
        monthlyUsd: monthly,
        annualUsd: annual,
        recoverablePctRange: { min: 0.35, max: 0.60 },
        rationale: ['Potential revenue from unanswered service calls']
      });
    }

    // Last-Minute Cancellations Loss Area
    if (weeklyCancellations > 0) {
      const daily = (weeklyCancellations * avgCanceledJobValue) / 5;
      const monthly = daily * workdays;
      const annual = monthly * 12;
      
      areas.push({
        key: 'last_minute_cancellations',
        title: 'Last-Minute Cancellations Loss',
        dailyUsd: daily,
        monthlyUsd: monthly,
        annualUsd: annual,
        recoverablePctRange: { min: 0.30, max: 0.50 },
        rationale: ['Revenue lost from job cancellations']
      });
    }

    // Pending Quotes Revenue Loss Area
    if (monthlyPendingQuotes > 0) {
      const monthlyPendingValue = monthlyPendingQuotes * avgPendingQuoteValue;
      const daily = (monthlyPendingValue / workdays) * 0.25;
      const monthly = daily * workdays;
      const annual = monthly * 12;
      
      areas.push({
        key: 'pending_quotes',
        title: 'Pending Quotes Revenue Loss',
        dailyUsd: daily,
        monthlyUsd: monthly,
        annualUsd: annual,
        recoverablePctRange: { min: 0.25, max: 0.45 },
        rationale: ['Potential revenue from stagnant quotes']
      });
    }
  }

  // Calculate totals
  const dailyUsd = areas.reduce((sum, area) => sum + area.dailyUsd, 0);
  const monthlyUsd = dailyUsd * workdays;
  const annualUsd = monthlyUsd * 12;

  // Sort areas by daily loss descending
  areas.sort((a, b) => b.dailyUsd - a.dailyUsd);

  return {
    dailyUsd,
    monthlyUsd,
    annualUsd,
    areas
  };
}

export { formatCurrency };