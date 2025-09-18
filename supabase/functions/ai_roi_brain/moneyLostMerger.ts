// Money Lost Data Merger Module
// Normalizes and merges money lost data from different sources

export interface MoneyLostSummary {
  total: {
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
  };
  areas: Array<{
    key: string;
    title: string;
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
    recoverablePctRange: { min: number; max: number };
    rationale: string[];
  }>;
}

/**
 * Merges and normalizes money lost data from various input formats
 * @param rawInput - Raw input data that may contain moneyLostSummary or legacy moneylost
 * @param vertical - Business vertical (dental/hvac) for defaults
 * @returns Normalized MoneyLostSummary object
 */
export function mergeMoneyLostData(rawInput: any, vertical: 'dental' | 'hvac'): MoneyLostSummary {
  // Normalize moneyLostSummary - handle both formats
  let moneyLostSummary: MoneyLostSummary;
  
  if (rawInput.moneyLostSummary) {
    // Already in correct format
    moneyLostSummary = rawInput.moneyLostSummary;
  } else if (rawInput.moneylost) {
    // Convert from legacy moneylost format
    const moneylost = rawInput.moneylost;
    moneyLostSummary = {
      total: {
        dailyUsd: moneylost.monthlyUsd ? moneylost.monthlyUsd / 30 : 1000,
        monthlyUsd: moneylost.monthlyUsd || 30000,
        annualUsd: moneylost.monthlyUsd ? moneylost.monthlyUsd * 12 : 360000
      },
      areas: moneylost.areas || [
        {
          key: 'missed_calls',
          title: 'Missed Calls',
          dailyUsd: 100,
          monthlyUsd: 3000,
          annualUsd: 36000,
          recoverablePctRange: { min: 70, max: 90 },
          rationale: ['Automated call handling can capture most missed calls']
        }
      ]
    };
  } else {
    // Create default moneyLostSummary based on vertical
    const defaultAreas = vertical === 'dental' 
      ? [
          {
            key: 'missed_calls',
            title: 'Missed Patient Calls',
            dailyUsd: 500,
            monthlyUsd: 15000,
            annualUsd: 180000,
            recoverablePctRange: { min: 70, max: 90 },
            rationale: ['AI reception can answer calls 24/7, capturing missed appointments']
          },
          {
            key: 'appointment_no_shows',
            title: 'No-Show Appointments',
            dailyUsd: 300,
            monthlyUsd: 9000,
            annualUsd: 108000,
            recoverablePctRange: { min: 60, max: 80 },
            rationale: ['Automated reminders and rescheduling reduce no-shows significantly']
          },
          {
            key: 'follow_up_delays',
            title: 'Follow-up Communication Delays',
            dailyUsd: 200,
            monthlyUsd: 6000,
            annualUsd: 72000,
            recoverablePctRange: { min: 50, max: 70 },
            rationale: ['AI-driven follow-up systems ensure timely patient communication']
          }
        ]
      : [
          {
            key: 'missed_calls',
            title: 'Missed Service Calls',
            dailyUsd: 600,
            monthlyUsd: 18000,
            annualUsd: 216000,
            recoverablePctRange: { min: 75, max: 95 },
            rationale: ['24/7 AI reception captures emergency calls and service requests']
          },
          {
            key: 'scheduling_inefficiency',
            title: 'Scheduling Inefficiencies',
            dailyUsd: 250,
            monthlyUsd: 7500,
            annualUsd: 90000,
            recoverablePctRange: { min: 60, max: 80 },
            rationale: ['AI scheduling optimizes technician routes and appointment slots']
          },
          {
            key: 'quote_follow_up',
            title: 'Quote Follow-up Delays',
            dailyUsd: 150,
            monthlyUsd: 4500,
            annualUsd: 54000,
            recoverablePctRange: { min: 50, max: 70 },
            rationale: ['Automated quote follow-up increases conversion rates']
          }
        ];

    moneyLostSummary = {
      total: {
        dailyUsd: 1000,
        monthlyUsd: 30000,
        annualUsd: 360000
      },
      areas: defaultAreas
    };
  }
  
  return moneyLostSummary;
}

/**
 * Calculates recovery ranges for each loss area
 * @param moneyLostSummary - Normalized money lost summary
 * @returns Object with total recovery potential and per-area breakdowns
 */
export function calculateRecoveryRanges(moneyLostSummary: MoneyLostSummary): {
  totalRecoveryRange: { min: number; max: number };
  areaRecoveries: Array<{
    key: string;
    title: string;
    monthlyRecoveryRange: { min: number; max: number };
  }>;
} {
  const areaRecoveries = moneyLostSummary.areas.map(area => ({
    key: area.key,
    title: area.title,
    monthlyRecoveryRange: {
      min: Math.round(area.monthlyUsd * (area.recoverablePctRange.min / 100)),
      max: Math.round(area.monthlyUsd * (area.recoverablePctRange.max / 100))
    }
  }));

  const totalRecoveryRange = {
    min: areaRecoveries.reduce((sum, area) => sum + area.monthlyRecoveryRange.min, 0),
    max: areaRecoveries.reduce((sum, area) => sum + area.monthlyRecoveryRange.max, 0)
  };

  return {
    totalRecoveryRange,
    areaRecoveries
  };
}