import type { VoiceFitReportData } from './report.types';
import { buildMockMoneyLost } from '@modules/moneylost/moneylost.mock';

// Loss Area to Voice Skill mapping
export const LOSS_AREA_TO_SKILL = {
  "Missed Calls Revenue Loss": {
    primary: "24/7 AI Receptionist",
    alternatives: ["After-Hours Call Capture", "Smart Call Routing"]
  },
  "No-Show Revenue Loss": {
    primary: "Automated Appointment Reminders",
    alternatives: ["Smart Rescheduling", "Confirmation Follow-ups"]
  },
  "Unaccepted Treatment Plans Loss": {
    primary: "Treatment Plan Follow-up Agent",
    alternatives: ["Insurance Verification", "Payment Plan Assistant"]
  },
  "Missed Service Calls Loss": {
    primary: "24/7 Service Call Agent",
    alternatives: ["Emergency Dispatch", "Lead Qualification"]
  },
  "Last-Minute Cancellations Loss": {
    primary: "Smart Scheduling Assistant",
    alternatives: ["Cancellation Recovery", "Automated Reminders"]
  },
  "Pending Quotes Revenue Loss": {
    primary: "Quote Follow-up Agent",
    alternatives: ["Proposal Automation", "Price Negotiation Assistant"]
  },
  "Capacity Overflow Loss": {
    primary: "Overflow Management Agent",
    alternatives: ["Waitlist Management", "Referral Coordination"]
  }
} as const;

export function buildMockVoiceFitReport(
  vertical: 'dental'|'hvac',
  answers: Record<string, unknown>
): VoiceFitReportData {
  const ml = buildMockMoneyLost(vertical, answers); // conservative mock

  // Score heuristic (mock): lower daily loss ⇒ higher score
  const denom = vertical === 'dental' ? 1200 : 1600; // conservative scaling
  const score = Math.max(1, Math.min(100, Math.round(100 - (ml.dailyUsd / denom))));
  const band =
    score <= 25 ? 'Crisis' :
    score <= 50 ? 'Optimization Needed' :
    score <= 75 ? 'Growth Ready' :
                  'AI-Optimized';

  // Top 3 areas by daily loss → diagnosis
  const topAreas = [...ml.areas].sort((a,b) => b.dailyUsd - a.dailyUsd).slice(0,3);
  const diagnosis = topAreas.map(a => `${a.title}: elevated impact observed.`);

  // Consequences (quantified)
  const consequences = [
    `Estimated daily loss: ${usd(ml.dailyUsd)}`,
    `Monthly impact: ${usd(ml.monthlyUsd)} (conservative)`,
    `Annualized leakage: ${usd(ml.annualUsd)}`
  ];

  // Solutions mapped from areas → primary Voice Skill
  const solutions = topAreas.map(a => {
    const map = (LOSS_AREA_TO_SKILL as any)[a.title] || { primary: 'Voice Agent', alternatives: [] };
    const [minR, maxR] = a.recoverablePctRange;
    return {
      skillId: map.primary,
      title: map.primary,
      rationale: `Addresses ${a.title.toLowerCase()} via automation (response, reminders, scheduling).`,
      estimatedRecoveryPct: [Math.round(minR*100), Math.round(maxR*100)] as [number, number]
    };
  });

  // FAQ (mock placeholders)
  const faq = [
    { q: 'How accurate are these estimates?', a: 'They are conservative and based on your inputs plus industry patterns. More data improves accuracy.' },
    { q: 'Do we need new software to start?', a: 'Usually no. We integrate with common tools or run in parallel first.' },
    { q: 'How fast can we see results?', a: 'Typically within 2–4 weeks once automations are live (missed calls, reminders, follow-ups).' }
  ];

  // Plan (mock; align to pricing KB later)
  const plan = {
    name: 'Command',
    priceMonthlyUsd: 199,
    inclusions: [
      '24/7 Voice AI Agent (core use cases)',
      'Automated reminders & follow-ups',
      'Basic analytics dashboard'
    ],
    addons: ['Advanced reporting','Multi-location support']
  };

  const benchmarks = [
    vertical === 'dental'
      ? 'Dental: missed-call recovery of 35–60% is common with AI receptionist.'
      : 'HVAC: after-hours capture notably lifts booked jobs in peak seasons.'
  ];

  return { score, band, diagnosis, consequences, solutions, faq, plan, benchmarks };
}

function usd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}