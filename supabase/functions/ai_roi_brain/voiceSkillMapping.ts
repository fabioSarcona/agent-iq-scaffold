// Voice Skill Mapping Module - Phase 4.1
// Deterministic mapping between signals, pain points and voice skills
// Provides ROI calculations, priority scoring, and NeedAgentIQ insight generation

export const VOICE_SKILL_MAPPING_VERSION = 'v1.0';

// Normalized skill details with numerical ROI ranges
export const SKILL_DETAILS: Record<string, {
  title: string;
  description: string;
  target?: 'small' | 'medium' | 'large';
  roiUsdRange: { min: number; max: number };
  recoveryRateRange: { min: number; max: number }; // 0..1
  monthlyPriceUsd: number;
  category: 'call-handling' | 'scheduling' | 'sales' | 'after-hours' | 'reviews' | 'reactivation';
  vertical: 'dental' | 'hvac' | 'both';
  painPointsResolved: string[];
}> = {
  // DENTAL SKILLS
  'reception-24-7': {
    title: 'Reception 24/7 Agent',
    description: 'AI agent that answers calls 24/7, provides info, sends estimates, and books appointments',
    roiUsdRange: { min: 3000, max: 7000 },
    recoveryRateRange: { min: 0.15, max: 0.30 },
    monthlyPriceUsd: 199,
    category: 'call-handling',
    vertical: 'dental',
    painPointsResolved: ['missed-calls', 'after-hours-calls', 'repetitive-questions']
  },
  'review-booster': {
    title: 'Review Booster Agent',
    description: 'AI agent that contacts happy patients for Google reviews and routes complaints',
    roiUsdRange: { min: 4000, max: 8000 },
    recoveryRateRange: { min: 0.05, max: 0.09 },
    monthlyPriceUsd: 199,
    category: 'reviews',
    vertical: 'dental',
    painPointsResolved: ['low-reviews', 'rating-under-45']
  },
  'recall-reactivation': {
    title: 'Recall & Reactivation Agent',
    description: 'AI agent that reactivates inactive patients and manages dental recalls',
    roiUsdRange: { min: 5000, max: 10000 },
    recoveryRateRange: { min: 0.20, max: 0.35 },
    monthlyPriceUsd: 199,
    category: 'reactivation',
    vertical: 'dental',
    painPointsResolved: ['inactive-patients', 'missed-recalls', 'patient-retention']
  },
  'follow-up-agent': {
    title: 'Follow-Up Agent',
    description: 'AI agent that follows up on unconfirmed treatment plans and estimates',
    roiUsdRange: { min: 8000, max: 12000 },
    recoveryRateRange: { min: 0.25, max: 0.35 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'dental',
    painPointsResolved: ['unconfirmed-treatments', 'pending-estimates']
  },
  'prevention-no-show': {
    title: 'Prevention & No-Show Agent',
    description: 'AI agent that prevents no-shows with voice reminders and waitlist management',
    roiUsdRange: { min: 3000, max: 5000 },
    recoveryRateRange: { min: 0.40, max: 0.60 },
    monthlyPriceUsd: 199,
    category: 'scheduling',
    vertical: 'dental',
    painPointsResolved: ['forgotten-appointments', 'no-shows', 'empty-slots']
  },
  'treatment-plan-closer': {
    title: 'Treatment Plan Closer Agent',
    description: 'AI agent specialized in closing pending treatment plans with payment options',
    roiUsdRange: { min: 10000, max: 20000 },
    recoveryRateRange: { min: 0.15, max: 0.25 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'dental',
    painPointsResolved: ['pending-treatment-plans', 'low-acceptance-rate', 'payment-concerns']
  },

  // HVAC SKILLS
  'hvac-reception-24-7': {
    title: 'Reception 24/7 Agent and Emergency Management',
    description: 'AI agent that handles HVAC calls 24/7, filters emergencies, and dispatches jobs',
    roiUsdRange: { min: 4000, max: 8000 },
    recoveryRateRange: { min: 0.20, max: 0.35 },
    monthlyPriceUsd: 199,
    category: 'call-handling',
    vertical: 'hvac',
    painPointsResolved: ['missed-service-calls', 'emergency-response', 'after-hours-calls']
  },
  'hvac-review-booster': {
    title: 'Review Booster Agent',
    description: 'AI agent that invites satisfied HVAC clients to review and filters complaints',
    roiUsdRange: { min: 3000, max: 6000 },
    recoveryRateRange: { min: 0.08, max: 0.12 },
    monthlyPriceUsd: 199,
    category: 'reviews',
    vertical: 'hvac',
    painPointsResolved: ['low-visibility', 'few-reviews', 'online-reputation']
  },
  'hvac-recall-reactivation': {
    title: 'Recall & Reactivation Agent',
    description: 'AI agent that reconnects inactive HVAC customers for maintenance and upgrades',
    roiUsdRange: { min: 4000, max: 7000 },
    recoveryRateRange: { min: 0.15, max: 0.25 },
    monthlyPriceUsd: 199,
    category: 'reactivation',
    vertical: 'hvac',
    painPointsResolved: ['inactive-customers', 'maintenance-reminders', 'seasonal-opportunities']
  },
  'quote-follow-up': {
    title: 'Quote Follow-Up Agent',
    description: 'AI agent that follows up on HVAC quotes, handles objections, and closes deals',
    roiUsdRange: { min: 6000, max: 10000 },
    recoveryRateRange: { min: 0.20, max: 0.30 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'hvac',
    painPointsResolved: ['unconfirmed-estimates', 'quote-follow-up', 'objection-handling']
  },
  'hvac-no-show-reminder': {
    title: 'No-Show & Reminder Agent',
    description: 'AI agent that prevents HVAC job cancellations with reminders and confirmations',
    roiUsdRange: { min: 2000, max: 4000 },
    recoveryRateRange: { min: 0.35, max: 0.50 },
    monthlyPriceUsd: 199,
    category: 'scheduling',
    vertical: 'hvac',
    painPointsResolved: ['missed-jobs', 'last-minute-cancellations', 'job-confirmations']
  },
  'contract-closer': {
    title: 'Contract Closer Agent',
    description: 'AI agent that follows up after HVAC jobs to close maintenance contracts',
    roiUsdRange: { min: 5000, max: 8000 },
    recoveryRateRange: { min: 0.25, max: 0.40 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'hvac',
    painPointsResolved: ['recurring-contracts', 'post-job-opportunities', 'maintenance-plans']
  }
};

// Signal tag to skills mapping - deterministic rules
export const SIGNAL_TO_SKILLS: Record<string, string[]> = {
  // DENTAL SIGNAL MAPPINGS
  'dental.missed_calls_medium': ['reception-24-7'],
  'dental.missed_calls_high': ['reception-24-7', 'follow-up-agent'],
  'dental.no_shows_high': ['prevention-no-show'],
  'dental.no_shows_critical': ['prevention-no-show', 'recall-reactivation'],
  'dental.treatment_plans_high': ['treatment-plan-closer', 'follow-up-agent'],
  'dental.treatment_conversion_low': ['treatment-plan-closer', 'follow-up-agent'],
  'dental.no_online_booking': ['prevention-no-show', 'reception-24-7'],

  // HVAC SIGNAL MAPPINGS
  'hvac.missed_calls_medium': ['hvac-reception-24-7'],
  'hvac.missed_calls_high': ['hvac-reception-24-7', 'quote-follow-up'],
  'hvac.job_cancellations_high': ['hvac-no-show-reminder'],
  'hvac.quotes_pending_high': ['quote-follow-up', 'contract-closer'],
  'hvac.quote_conversion_low': ['quote-follow-up', 'contract-closer'],
  'hvac.no_online_booking': ['hvac-no-show-reminder', 'hvac-reception-24-7']
};

// Pain point to skills mapping
export const PAINPOINT_TO_SKILLS: Record<string, string[]> = {
  // DENTAL PAIN POINTS
  'missed-calls': ['reception-24-7'],
  'after-hours-calls': ['reception-24-7'],
  'no-shows': ['prevention-no-show'],
  'inactive-patients': ['recall-reactivation'],
  'missed-recalls': ['recall-reactivation'],
  'pending-treatment-plans': ['treatment-plan-closer', 'follow-up-agent'],
  'low-reviews': ['review-booster'],
  'unconfirmed-treatments': ['follow-up-agent'],

  // HVAC PAIN POINTS  
  'missed-service-calls': ['hvac-reception-24-7'],
  'emergency-response': ['hvac-reception-24-7'],
  'job-cancellations': ['hvac-no-show-reminder'],
  'unconfirmed-estimates': ['quote-follow-up'],
  'inactive-customers': ['hvac-recall-reactivation'],
  'few-reviews': ['hvac-review-booster'],
  'recurring-contracts': ['contract-closer']
};

// Section-based skill recommendations (maps MoneyLost areas to skills)
export const SECTION_TO_SKILLS: Record<string, string[]> = {
  // DENTAL SECTIONS
  'Missed Calls Revenue Loss': ['reception-24-7'],
  'No-Shows Revenue Loss': ['prevention-no-show'],
  'Treatment Plans Revenue Loss': ['treatment-plan-closer', 'follow-up-agent'],

  // HVAC SECTIONS
  'Missed Service Calls Loss': ['hvac-reception-24-7'],
  'Last-Minute Cancellations Loss': ['hvac-no-show-reminder'],
  'Pending Quotes Revenue Loss': ['quote-follow-up']
};

// Priority calculation constants
const PRIORITY_WEIGHTS = {
  SIGNAL_SEVERITY_HIGH: 90,
  SIGNAL_SEVERITY_CRITICAL: 100,
  SIGNAL_SEVERITY_MEDIUM: 70,
  MONTHLY_IMPACT_HIGH_THRESHOLD: 5000,
  MONTHLY_IMPACT_MEDIUM_THRESHOLD: 2000,
  BASE_CONFIDENCE: 70,
  MONEY_LOST_BONUS: 10,
  BUSINESS_SIZE_MATCH_BONUS: 5,
  GENERIC_MAPPING_PENALTY: 10
} as const;

// Skill insight interface compatible with NeedAgentIQ
export interface SkillInsight {
  key: string;
  title: string;
  description: string;
  impact: string;
  category: string;
  monthlyImpactUsd: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  metadata: {
    vertical: 'dental' | 'hvac';
    skillId: string;
    painPointId?: string;
    signalTag?: string;
    recoveryRate: number;
    sources: string[];
    roiRange: { min: number; max: number };
  };
}

/**
 * Computes monthly impact based on loss amount and recovery rate
 */
function computeMonthlyImpact(lossBaseUsd: number, recoveryRange: { min: number; max: number }): number {
  return Math.round(lossBaseUsd * ((recoveryRange.min + recoveryRange.max) / 2));
}

/**
 * Calculates priority based on impact and signal severity
 */
function calculatePriority(monthlyImpact: number, signalTag?: string): 'high' | 'medium' | 'low' {
  const isCritical = signalTag?.includes('critical') || signalTag?.includes('high');
  const isHigh = monthlyImpact >= PRIORITY_WEIGHTS.MONTHLY_IMPACT_HIGH_THRESHOLD;
  
  if (isCritical || isHigh) return 'high';
  if (monthlyImpact >= PRIORITY_WEIGHTS.MONTHLY_IMPACT_MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Calculates confidence score based on available data
 */
function calculateConfidence(
  hasMoneyLostData: boolean,
  businessSize: string,
  skillTarget?: string,
  isGenericMapping = false
): number {
  let confidence = PRIORITY_WEIGHTS.BASE_CONFIDENCE;
  
  if (hasMoneyLostData) confidence += PRIORITY_WEIGHTS.MONEY_LOST_BONUS;
  if (businessSize && skillTarget && businessSize === skillTarget) {
    confidence += PRIORITY_WEIGHTS.BUSINESS_SIZE_MATCH_BONUS;
  }
  if (isGenericMapping) confidence -= PRIORITY_WEIGHTS.GENERIC_MAPPING_PENALTY;
  
  return Math.min(100, Math.max(0, confidence));
}

/**
 * Generates unique insight key
 */
function generateInsightKey(vertical: string, source: string, skillId: string): string {
  return `${vertical}_${source}_${skillId}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

/**
 * Maps signal tags to skill insights with deterministic ROI calculations
 */
export function mapSignalTagsToSkills(
  signalTags: string[], 
  moneyLostByArea: Record<string, number> = {}, 
  vertical: 'dental' | 'hvac', 
  businessSize: 'small' | 'medium' | 'large' = 'medium'
): SkillInsight[] {
  const insights: SkillInsight[] = [];
  
  signalTags.forEach(signalTag => {
    const skillIds = SIGNAL_TO_SKILLS[signalTag];
    if (!skillIds || skillIds.length === 0) return;
    
    skillIds.forEach(skillId => {
      const skillDetail = SKILL_DETAILS[skillId];
      if (!skillDetail || skillDetail.vertical !== vertical) return;
      
      // Find associated money lost amount (fallback to average if not found)
      const avgMoneyLost = Object.values(moneyLostByArea).reduce((a, b) => a + b, 0) / 
                          Math.max(Object.keys(moneyLostByArea).length, 1) || 5000;
      const monthlyImpact = computeMonthlyImpact(avgMoneyLost, skillDetail.recoveryRateRange);
      
      const priority = calculatePriority(monthlyImpact, signalTag);
      const confidence = calculateConfidence(
        Object.keys(moneyLostByArea).length > 0,
        businessSize,
        skillDetail.target
      );
      
      const insight: SkillInsight = {
        key: generateInsightKey(vertical, signalTag.replace(`${vertical}.`, ''), skillId),
        title: skillDetail.title,
        description: `${skillDetail.description} - Specifically addresses ${signalTag.replace(`${vertical}.`, '').replace(/_/g, ' ')} signals in your audit.`,
        impact: `Estimated monthly recovery: $${monthlyImpact.toLocaleString()} (${Math.round(skillDetail.recoveryRateRange.min * 100)}-${Math.round(skillDetail.recoveryRateRange.max * 100)}% of identified losses)`,
        category: skillDetail.category,
        monthlyImpactUsd: monthlyImpact,
        actionable: true,
        priority,
        confidence,
        metadata: {
          vertical,
          skillId,
          signalTag,
          recoveryRate: (skillDetail.recoveryRateRange.min + skillDetail.recoveryRateRange.max) / 2,
          sources: [`signal:${signalTag}`],
          roiRange: skillDetail.roiUsdRange
        }
      };
      
      insights.push(insight);
    });
  });
  
  return insights;
}

/**
 * Maps pain points to skill insights
 */
export function mapPainPointsToSkills(
  painPoints: Array<{ id: string; monthlyImpact?: number }>, 
  vertical: 'dental' | 'hvac',
  businessSize: 'small' | 'medium' | 'large' = 'medium'
): SkillInsight[] {
  const insights: SkillInsight[] = [];
  
  painPoints.forEach(painPoint => {
    const skillIds = PAINPOINT_TO_SKILLS[painPoint.id];
    if (!skillIds || skillIds.length === 0) return;
    
    skillIds.forEach(skillId => {
      const skillDetail = SKILL_DETAILS[skillId];
      if (!skillDetail || skillDetail.vertical !== vertical) return;
      
      const monthlyImpact = painPoint.monthlyImpact 
        ? computeMonthlyImpact(painPoint.monthlyImpact, skillDetail.recoveryRateRange)
        : skillDetail.roiUsdRange.min; // Fallback to minimum ROI
      
      const priority = calculatePriority(monthlyImpact);
      const confidence = calculateConfidence(
        !!painPoint.monthlyImpact,
        businessSize,
        skillDetail.target,
        true // pain point mapping is more generic
      );
      
      const insight: SkillInsight = {
        key: generateInsightKey(vertical, painPoint.id, skillId),
        title: skillDetail.title,
        description: `${skillDetail.description} - Directly targets your "${painPoint.id.replace(/-/g, ' ')}" pain point.`,
        impact: `Addresses ${painPoint.id.replace(/-/g, ' ')} with estimated monthly value of $${monthlyImpact.toLocaleString()}`,
        category: skillDetail.category,
        monthlyImpactUsd: monthlyImpact,
        actionable: true,
        priority,
        confidence,
        metadata: {
          vertical,
          skillId,
          painPointId: painPoint.id,
          recoveryRate: (skillDetail.recoveryRateRange.min + skillDetail.recoveryRateRange.max) / 2,
          sources: [`pain:${painPoint.id}`],
          roiRange: skillDetail.roiUsdRange
        }
      };
      
      insights.push(insight);
    });
  });
  
  return insights;
}

/**
 * Maps money lost sections to skill insights  
 */
export function mapSectionsToSkills(
  moneyLostData: Record<string, number>,
  vertical: 'dental' | 'hvac',
  businessSize: 'small' | 'medium' | 'large' = 'medium'
): SkillInsight[] {
  const insights: SkillInsight[] = [];
  
  Object.entries(moneyLostData).forEach(([sectionName, lossAmount]) => {
    const skillIds = SECTION_TO_SKILLS[sectionName];
    if (!skillIds || skillIds.length === 0) return;
    
    skillIds.forEach(skillId => {
      const skillDetail = SKILL_DETAILS[skillId];
      if (!skillDetail || skillDetail.vertical !== vertical) return;
      
      const monthlyImpact = computeMonthlyImpact(lossAmount, skillDetail.recoveryRateRange);
      const priority = calculatePriority(monthlyImpact);
      const confidence = calculateConfidence(true, businessSize, skillDetail.target);
      
      const insight: SkillInsight = {
        key: generateInsightKey(vertical, sectionName.replace(/\s+/g, '_'), skillId),
        title: skillDetail.title,
        description: `${skillDetail.description} - Specifically designed to recover losses in "${sectionName}".`,
        impact: `Target recovery from ${sectionName}: $${monthlyImpact.toLocaleString()} monthly (${Math.round(skillDetail.recoveryRateRange.min * 100)}-${Math.round(skillDetail.recoveryRateRange.max * 100)}% recovery rate)`,
        category: skillDetail.category,
        monthlyImpactUsd: monthlyImpact,
        actionable: true,
        priority,
        confidence,
        metadata: {
          vertical,
          skillId,
          recoveryRate: (skillDetail.recoveryRateRange.min + skillDetail.recoveryRateRange.max) / 2,
          sources: [`section:${sectionName}`],
          roiRange: skillDetail.roiUsdRange
        }
      };
      
      insights.push(insight);
    });
  });
  
  return insights;
}

/**
 * Merges and deduplicates skill insights from multiple sources
 */
export function mergeSkillInsights(insights: SkillInsight[]): SkillInsight[] {
  const mergedMap = new Map<string, SkillInsight>();
  
  insights.forEach(insight => {
    const existing = mergedMap.get(insight.metadata.skillId);
    
    if (!existing) {
      mergedMap.set(insight.metadata.skillId, insight);
    } else {
      // Merge insights for same skill: take highest values
      const merged: SkillInsight = {
        ...existing,
        priority: existing.priority === 'high' || insight.priority === 'high' ? 'high' :
                 existing.priority === 'medium' || insight.priority === 'medium' ? 'medium' : 'low',
        confidence: Math.max(existing.confidence, insight.confidence),
        monthlyImpactUsd: Math.max(existing.monthlyImpactUsd, insight.monthlyImpactUsd),
        metadata: {
          ...existing.metadata,
          sources: [...existing.metadata.sources, ...insight.metadata.sources]
        }
      };
      
      // Update impact description to reflect merged sources
      merged.impact = `Multi-source recovery potential: $${merged.monthlyImpactUsd.toLocaleString()} monthly`;
      merged.key = generateInsightKey(
        merged.metadata.vertical,
        'merged',
        merged.metadata.skillId
      );
      
      mergedMap.set(insight.metadata.skillId, merged);
    }
  });
  
  // Return sorted by priority then impact
  return Array.from(mergedMap.values()).sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.monthlyImpactUsd - a.monthlyImpactUsd;
  });
}

/**
 * Main function to build complete NeedAgentIQ insights
 */
export function buildNeedAgentIQInsights(input: {
  signalTags: string[];
  painPoints?: Array<{ id: string; monthlyImpact?: number }>;
  moneyLostByArea: Record<string, number>;
  vertical: 'dental' | 'hvac';
  businessSize: 'small' | 'medium' | 'large';
}): SkillInsight[] {
  const allInsights: SkillInsight[] = [];
  
  // Map signal tags to skills
  if (input.signalTags.length > 0) {
    const signalInsights = mapSignalTagsToSkills(
      input.signalTags, 
      input.moneyLostByArea, 
      input.vertical, 
      input.businessSize
    );
    allInsights.push(...signalInsights);
  }
  
  // Map pain points to skills (if provided)
  if (input.painPoints && input.painPoints.length > 0) {
    const painInsights = mapPainPointsToSkills(
      input.painPoints, 
      input.vertical, 
      input.businessSize
    );
    allInsights.push(...painInsights);
  }
  
  // Map money lost sections to skills
  if (Object.keys(input.moneyLostByArea).length > 0) {
    const sectionInsights = mapSectionsToSkills(
      input.moneyLostByArea, 
      input.vertical, 
      input.businessSize
    );
    allInsights.push(...sectionInsights);
  }
  
  // Merge and deduplicate, then return top insights
  const mergedInsights = mergeSkillInsights(allInsights);
  
  // Return top 6 insights for UI performance
  return mergedInsights.slice(0, 6);
}

/**
 * Validates skill mapping configuration
 */
export function validateSkillMapping(): {
  isValid: boolean;
  warnings: string[];
  missingSkills: string[];
} {
  const warnings: string[] = [];
  const missingSkills = new Set<string>();
  
  // Check signal mappings reference valid skills
  Object.values(SIGNAL_TO_SKILLS).flat().forEach(skillId => {
    if (!SKILL_DETAILS[skillId]) {
      missingSkills.add(skillId);
      warnings.push(`Signal mapping references unknown skill: ${skillId}`);
    }
  });
  
  // Check pain point mappings reference valid skills  
  Object.values(PAINPOINT_TO_SKILLS).flat().forEach(skillId => {
    if (!SKILL_DETAILS[skillId]) {
      missingSkills.add(skillId);
      warnings.push(`Pain point mapping references unknown skill: ${skillId}`);
    }
  });
  
  // Check section mappings reference valid skills
  Object.values(SECTION_TO_SKILLS).flat().forEach(skillId => {
    if (!SKILL_DETAILS[skillId]) {
      missingSkills.add(skillId);
      warnings.push(`Section mapping references unknown skill: ${skillId}`);
    }
  });
  
  return {
    isValid: missingSkills.size === 0,
    warnings,
    missingSkills: Array.from(missingSkills)
  };
}