import type { Vertical } from './types';

export type BizSize = 'small' | 'medium' | 'large';

export interface Benchmarks {
  // general
  workDaysPerMonth: number;
  busyMonthsFraction: number; // share of months considered "busy" for overflow calc

  // Dental
  dental: {
    // conversion of an answered call → booked appointment
    newPatientCallToAppointment: { small: number; medium: number; large: number };
    // average appointment value blending, if complex missing
    appointmentBlend: { stdWeight: number; complexWeight: number };
    // no-show base (used if weekly_no_shows not given)
    defaultWeeklyNoShowsBySize: { small: number; medium: number; large: number };
    // recall success if selection unclear
    defaultRecallSuccess: number; // 0..1
    // review impact max percent of new patients' LTV at low velocity
    reviewImpactMaxPct: number; // 0..1
  };

  // HVAC
  hvac: {
    // call → booked job (if not explicit)
    callToJobBySize: { small: number; medium: number; large: number };
    // weighted average ticket (basic vs large)
    ticketBlend: { basicWeight: number; largeWeight: number };
    // quote close rate baseline for pending quotes
    pendingQuoteCloseRateBaseline: number; // 0..1
    // review/referral impact max percent of new customer LTV
    reviewImpactMaxPct: number; // 0..1
    // assumed annual maintenance plan value = basicTicket * factor
    maintenanceAnnualFactorFromBasic: number; // e.g., 2 visits/year
  };
}

export const DEFAULT_BENCHMARKS: Benchmarks = {
  workDaysPerMonth: 22,
  busyMonthsFraction: 0.25, // ~3 months peak

  dental: {
    newPatientCallToAppointment: { small: 0.30, medium: 0.35, large: 0.40 },
    appointmentBlend: { stdWeight: 0.7, complexWeight: 0.3 },
    defaultWeeklyNoShowsBySize: { small: 2, medium: 3, large: 4 },
    defaultRecallSuccess: 0.30, // conservative
    reviewImpactMaxPct: 0.06    // ≤6% of new-patient LTV at low review velocity
  },

  hvac: {
    callToJobBySize: { small: 0.35, medium: 0.40, large: 0.45 },
    ticketBlend: { basicWeight: 0.8, largeWeight: 0.2 },
    pendingQuoteCloseRateBaseline: 0.25,
    reviewImpactMaxPct: 0.05,   // ≤5% of new-customer LTV at low review velocity
    maintenanceAnnualFactorFromBasic: 2.0
  }
};

export function pickBizSize(vertical: Vertical, answers: Record<string, unknown>): BizSize {
  if (vertical === 'dental') {
    const chairsVal = String(answers['dental_chairs_active_choice'] ?? '');
    if (chairsVal === '9_plus') return 'large';
    if (chairsVal === '5_8') return 'medium';
    return 'small';
  } else {
    const techVal = String(answers['field_technicians_count_choice'] ?? '');
    if (techVal === '6_plus') return 'large';
    if (techVal === '3_5') return 'medium';
    return 'small';
  }
}