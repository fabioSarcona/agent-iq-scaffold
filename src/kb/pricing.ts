// Comprehensive pricing structure for NeedAgent.AI Voice AI solutions

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  setupFee: number;
  monthlyPrice: number;
  currency: string;
  stripePriceId?: string;
  features: {
    aiAgents: number | 'unlimited';
    voiceSkillsIncluded: number | 'all';
    monthlyMinutes: number;
    prioritySupport: boolean;
    successManager: boolean;
    performanceReview: boolean;
    multiLocation: boolean;
  };
  includes: string[];
  bestFor: string;
  roiExample: string;
  popular?: boolean;
}

export interface VoiceSkillPricing {
  id: string;
  name: string;
  monthlyPrice: number;
  industry: 'dental' | 'hvac' | 'both';
  includedInPlans: string[];
  description: string;
  roiImpact: string;
}

export interface ROICalculation {
  scenario: string;
  monthlyImpact: number;
  recoveryRate: number;
  cost: number;
  netROI: number;
  paybackPeriod: string;
}

export interface FeatureComparison {
  feature: string;
  starterVoice: boolean | string;
  growthPerformance: boolean | string;
  eliteImpact: boolean | string;
  multiLocation: boolean | string;
}

// Core Pricing Plans
export const pricingPlans: PricingPlan[] = [
  {
    id: 'starter-voice',
    name: 'Starter Voice',
    description: 'Perfect for solo practices and pilot programs',
    setupFee: 997,
    monthlyPrice: 597,
    currency: 'USD',
    features: {
      aiAgents: 1,
      voiceSkillsIncluded: 0,
      monthlyMinutes: 1000,
      prioritySupport: false,
      successManager: false,
      performanceReview: false,
      multiLocation: false,
    },
    includes: [
      '1 Voice AI Agent',
      '24/7 call handling',
      'Custom CRM/PMS integration',
      '1,000 monthly minutes',
      'Basic appointment booking',
      'Performance dashboard',
      'Standard support'
    ],
    bestFor: 'Solo offices, pilot programs, small practices',
    roiExample: 'Recovers 5 missed calls or 2 no-shows monthly'
  },
  {
    id: 'growth-performance',
    name: 'Growth Performance',
    description: 'Ideal for scaling practices ready to expand',
    setupFee: 1797,
    monthlyPrice: 997,
    currency: 'USD',
    popular: true,
    features: {
      aiAgents: 2,
      voiceSkillsIncluded: 2,
      monthlyMinutes: 1000,
      prioritySupport: true,
      successManager: false,
      performanceReview: true,
      multiLocation: false,
    },
    includes: [
      '2 Voice AI Agents',
      '24/7 call handling',
      'Custom CRM/PMS integration',
      '1,000 monthly minutes',
      'Any 2 Voice Skills included',
      'Smart booking & confirmations',
      'Priority support',
      'Monthly performance review',
      'Advanced analytics'
    ],
    bestFor: 'Scaling practices, multi-service operations',
    roiExample: 'Fills gaps, recovers quotes, boosts reviews'
  },
  {
    id: 'elite-impact',
    name: 'Elite Impact',
    description: 'Complete automation for maximum growth',
    setupFee: 2997,
    monthlyPrice: 1297,
    currency: 'USD',
    features: {
      aiAgents: 'unlimited',
      voiceSkillsIncluded: 'all',
      monthlyMinutes: 3000,
      prioritySupport: true,
      successManager: true,
      performanceReview: true,
      multiLocation: false,
    },
    includes: [
      'All Voice AI Agents',
      '24/7 call handling',
      'Custom CRM/PMS integration',
      '3,000 monthly minutes',
      'All Voice Skills included',
      'Smart booking & confirmations',
      'Priority support',
      'Dedicated success manager',
      'Monthly performance review',
      'Advanced analytics',
      'Custom integrations'
    ],
    bestFor: 'Full automation, high-volume practices',
    roiExample: 'Replaces entire front desk with 24/7 Voice AI'
  },
  {
    id: 'multi-location',
    name: 'Multi-Location',
    description: 'Enterprise solution for groups and chains',
    setupFee: 2997,
    monthlyPrice: 997, // per location
    currency: 'USD',
    features: {
      aiAgents: 'unlimited',
      voiceSkillsIncluded: 'all',
      monthlyMinutes: 3000,
      prioritySupport: true,
      successManager: true,
      performanceReview: true,
      multiLocation: true,
    },
    includes: [
      'All Voice AI Agents per location',
      '24/7 call handling',
      'Custom CRM/PMS integration',
      '3,000 monthly minutes per location',
      'All Voice Skills included',
      'Centralized management dashboard',
      'Priority support',
      'Dedicated success manager',
      'Monthly performance review',
      'Advanced analytics',
      'Multi-location reporting'
    ],
    bestFor: 'Groups, chains, franchise operations',
    roiExample: 'Centralized operations, reduced labor costs across locations'
  }
];

// Voice Skills Pricing
export const voiceSkillsPricing: VoiceSkillPricing[] = [
  // Dental Skills
  {
    id: 'dental-reception-247',
    name: 'Reception 24/7 Agent',
    monthlyPrice: 199,
    industry: 'dental',
    includedInPlans: ['elite-impact'],
    description: 'Handles after-hours calls, sends quotes, books visits',
    roiImpact: 'Captures 100% of after-hours opportunities'
  },
  {
    id: 'dental-review-booster',
    name: 'Review Booster Agent',
    monthlyPrice: 199,
    industry: 'dental',
    includedInPlans: ['elite-impact'],
    description: 'Requests 5★ reviews, filters negative feedback',
    roiImpact: 'Increases online reputation and new patient acquisition'
  },
  {
    id: 'dental-recall-reactivation',
    name: 'Recall & Reactivation Agent',
    monthlyPrice: 199,
    industry: 'dental',
    includedInPlans: ['elite-impact'],
    description: 'Brings back inactive patients (6+ months)',
    roiImpact: 'Reactivates 15-25% of dormant patient base'
  },
  {
    id: 'dental-follow-up',
    name: 'Follow-Up Agent',
    monthlyPrice: 199,
    industry: 'dental',
    includedInPlans: ['elite-impact'],
    description: 'Contacts patients with pending treatment plans',
    roiImpact: 'Converts 30% more treatment plan presentations'
  },
  {
    id: 'dental-no-show-prevention',
    name: 'Prevention & No-Show Agent',
    monthlyPrice: 199,
    industry: 'dental',
    includedInPlans: ['elite-impact'],
    description: 'Sends reminders, fills cancellations',
    roiImpact: 'Reduces no-shows by 60%, fills 80% of cancellations'
  },
  {
    id: 'dental-treatment-closer',
    name: 'Treatment Plan Closer Agent',
    monthlyPrice: 199,
    industry: 'dental',
    includedInPlans: ['elite-impact'],
    description: 'Calls undecided patients, explains benefits, closes plans',
    roiImpact: 'Increases treatment acceptance by 25-40%'
  },
  // HVAC Skills
  {
    id: 'hvac-reception-247',
    name: 'Reception 24/7 Agent',
    monthlyPrice: 199,
    industry: 'hvac',
    includedInPlans: ['elite-impact'],
    description: 'Answers after-hours calls, filters urgent leads',
    roiImpact: 'Captures emergency calls worth $500-2000 each'
  },
  {
    id: 'hvac-review-booster',
    name: 'Review Booster Agent',
    monthlyPrice: 199,
    industry: 'hvac',
    includedInPlans: ['elite-impact'],
    description: 'Requests Google reviews, blocks complaints',
    roiImpact: 'Improves local search ranking and lead quality'
  },
  {
    id: 'hvac-recall-reactivation',
    name: 'Recall & Reactivation Agent',
    monthlyPrice: 199,
    industry: 'hvac',
    includedInPlans: ['elite-impact'],
    description: 'Reconnects inactive clients (12+ months)',
    roiImpact: 'Reactivates 20% of dormant customer base'
  },
  {
    id: 'hvac-quote-follow-up',
    name: 'Quote Follow-Up Agent',
    monthlyPrice: 199,
    industry: 'hvac',
    includedInPlans: ['elite-impact'],
    description: 'Calls leads with unconfirmed quotes',
    roiImpact: 'Converts 35% more quotes to jobs'
  },
  {
    id: 'hvac-no-show-reminder',
    name: 'No-Show & Reminder Agent',
    monthlyPrice: 199,
    industry: 'hvac',
    includedInPlans: ['elite-impact'],
    description: 'Sends reminders, reschedules missed visits',
    roiImpact: 'Reduces no-shows by 50%, fills schedule gaps'
  },
  {
    id: 'hvac-contract-closer',
    name: 'Contract Closer Agent',
    monthlyPrice: 199,
    industry: 'hvac',
    includedInPlans: ['elite-impact'],
    description: 'Follows up post-service to close contracts',
    roiImpact: 'Increases maintenance contract sales by 40%'
  }
];

// Feature Comparison Matrix
export const featureComparison: FeatureComparison[] = [
  {
    feature: '24/7 Call Handling',
    starterVoice: true,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Custom CRM/PMS Integration',
    starterVoice: true,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: '1-on-1 Setup',
    starterVoice: true,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Number of Active Voice AI Agents',
    starterVoice: '1',
    growthPerformance: '2',
    eliteImpact: 'All',
    multiLocation: 'All per location'
  },
  {
    feature: 'Monthly Minutes Included',
    starterVoice: '1,000',
    growthPerformance: '1,000',
    eliteImpact: '3,000',
    multiLocation: '3,000 per location'
  },
  {
    feature: 'Smart Booking & Confirmations',
    starterVoice: true,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Voice Skills Included',
    starterVoice: 'None',
    growthPerformance: '2',
    eliteImpact: 'All',
    multiLocation: 'All'
  },
  {
    feature: 'Real-Time Call Logs',
    starterVoice: true,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Access to Skills Library',
    starterVoice: 'Pay per skill',
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Priority Support',
    starterVoice: false,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Dedicated Success Manager',
    starterVoice: false,
    growthPerformance: false,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Monthly Performance Review',
    starterVoice: false,
    growthPerformance: true,
    eliteImpact: true,
    multiLocation: true
  },
  {
    feature: 'Multi-location Support',
    starterVoice: false,
    growthPerformance: false,
    eliteImpact: false,
    multiLocation: true
  }
];

// ROI Calculation Examples
export const roiExamples: ROICalculation[] = [
  {
    scenario: 'Dental Practice - 5 missed calls/month',
    monthlyImpact: 2500, // $500 avg per new patient
    recoveryRate: 0.6,
    cost: 597,
    netROI: 903,
    paybackPeriod: '21 days'
  },
  {
    scenario: 'HVAC Company - Emergency after-hours calls',
    monthlyImpact: 4000, // $1000 avg per emergency call
    recoveryRate: 0.8,
    cost: 597,
    netROI: 2603,
    paybackPeriod: '7 days'
  },
  {
    scenario: 'Dental Practice - Treatment plan follow-ups',
    monthlyImpact: 8000, // $2000 avg treatment x 4 cases
    recoveryRate: 0.35,
    cost: 1297,
    netROI: 1503,
    paybackPeriod: '15 days'
  },
  {
    scenario: 'HVAC Company - Quote conversions',
    monthlyImpact: 12000, // $3000 avg job x 4 quotes
    recoveryRate: 0.35,
    cost: 1297,
    netROI: 2903,
    paybackPeriod: '11 days'
  }
];

// Helper Functions
export function getPlanByName(planName: string): PricingPlan | undefined {
  return pricingPlans.find(plan => 
    plan.name.toLowerCase().replace(/\s+/g, '-') === planName.toLowerCase() ||
    plan.id === planName.toLowerCase()
  );
}

export function getVoiceSkillsByType(type: 'dental' | 'hvac' | 'both'): VoiceSkillPricing[] {
  if (type === 'both') {
    return voiceSkillsPricing;
  }
  return voiceSkillsPricing.filter(skill => skill.industry === type || skill.industry === 'both');
}

export function getFeatureAvailability(feature: string, planId: string): boolean | string {
  const comparison = featureComparison.find(f => f.feature === feature);
  if (!comparison) return false;
  
  switch (planId) {
    case 'starter-voice':
      return comparison.starterVoice;
    case 'growth-performance':
      return comparison.growthPerformance;
    case 'elite-impact':
      return comparison.eliteImpact;
    case 'multi-location':
      return comparison.multiLocation;
    default:
      return false;
  }
}

export function calculateROI(params: {
  missedCalls: number;
  noShows: number;
  avgTransactionValue: number;
  plan: string;
}): {
  monthlyRecoverable: number;
  planCost: number;
  netROI: number;
  roiPercentage: number;
  paybackDays: number;
} {
  const { missedCalls, noShows, avgTransactionValue, plan } = params;
  const selectedPlan = getPlanByName(plan);
  
  if (!selectedPlan) {
    throw new Error('Plan not found');
  }
  
  // Conservative recovery rates
  const missedCallRecovery = 0.6; // 60% of missed calls can be recovered
  const noShowRecovery = 0.8; // 80% of no-shows can be prevented
  
  const monthlyRecoverable = (missedCalls * missedCallRecovery + noShows * noShowRecovery) * avgTransactionValue;
  const planCost = selectedPlan.monthlyPrice;
  const netROI = monthlyRecoverable - planCost;
  const roiPercentage = planCost > 0 ? (netROI / planCost) * 100 : 0;
  const paybackDays = monthlyRecoverable > 0 ? Math.ceil((planCost / monthlyRecoverable) * 30) : 0;
  
  return {
    monthlyRecoverable,
    planCost,
    netROI,
    roiPercentage,
    paybackDays
  };
}

export function getUpgradeOptions(currentPlanId: string): PricingPlan[] {
  const currentPlanIndex = pricingPlans.findIndex(plan => plan.id === currentPlanId);
  if (currentPlanIndex === -1) return [];
  
  return pricingPlans.slice(currentPlanIndex + 1);
}

export function calculateMonthlyTotal(planId: string, addOnSkills: string[] = []): number {
  const plan = getPlanByName(planId);
  if (!plan) return 0;
  
  const planCost = plan.monthlyPrice;
  const skillsCost = addOnSkills.reduce((total, skillId) => {
    const skill = voiceSkillsPricing.find(s => s.id === skillId);
    if (skill && !skill.includedInPlans.includes(planId)) {
      return total + skill.monthlyPrice;
    }
    return total;
  }, 0);
  
  return planCost + skillsCost;
}

// Main pricing module export
export const pricing = {
  plans: pricingPlans,
  voiceSkills: voiceSkillsPricing,
  features: featureComparison,
  roiExamples,
  
  // Legacy compatibility
  auditPackages: {
    starter: pricingPlans[0],
    growth: pricingPlans[1],
    elite: pricingPlans[2]
  },
  
  industryRates: {
    dental: {
      avgTransactionValue: 500,
      typicalMissedCalls: 8,
      typicalNoShows: 12
    },
    hvac: {
      avgTransactionValue: 1200,
      typicalMissedCalls: 6,
      typicalNoShows: 8
    }
  },
  
  valueProposition: {
    dental: "Transform missed calls into booked appointments and dormant patients into active revenue",
    hvac: "Capture every emergency call and convert more quotes while your competition sleeps"
  },
  
  costBenefit: {
    vsHiring: "70% cheaper than hiring a full-time CSR, available 24/7 with zero sick days",
    vsCompetitors: "Complete Voice AI solution, not just chatbots or basic routing"
  }
};

export default pricing;