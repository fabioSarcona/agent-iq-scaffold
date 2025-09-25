// Business Intelligence Extractor Module
// Extracts business intelligence from normalized audit data

export interface BusinessContextNormalized {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary: {
    overall: number;
    sections: Array<{ sectionId?: string; name?: string; score: number }>;
  };
  moneyLostSummary: {
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
  };
}

export interface BusinessIntelligence {
  businessSize: 'small' | 'medium' | 'large';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryPainPoints: string[];
  technicalReadiness: number;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Extracts business intelligence from normalized context data
 * @param context - Normalized business context
 * @returns Business intelligence analysis object
 */
export function extractBusinessContext(context: BusinessContextNormalized): BusinessIntelligence {
  const { vertical, auditAnswers, scoreSummary, moneyLostSummary } = context;
  
  // Business Size Detection with null safety
  let businessSize: 'small' | 'medium' | 'large' = 'medium';
  if (vertical === 'dental') {
    const chairs = String(auditAnswers?.['dental_chairs_active_choice'] ?? '3_4');
    businessSize = chairs === '1_2' ? 'small' : chairs === '5_8' ? 'large' : 'medium';
  } else {
    const techs = String(auditAnswers?.['field_technicians_count_choice'] ?? '3_5');
    businessSize = techs === '1_2' ? 'small' : techs === '6_10' ? 'large' : 'medium';
  }

  // Urgency Level (based on money lost) with null safety
  const monthlyLoss = moneyLostSummary?.total?.monthlyUsd ?? 30000;
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (monthlyLoss > 50000) urgencyLevel = 'critical';
  else if (monthlyLoss > 25000) urgencyLevel = 'high';
  else if (monthlyLoss > 10000) urgencyLevel = 'medium';

  // Primary Pain Points Identification with null safety
  const areas = moneyLostSummary?.areas ?? [];
  const primaryPainPoints = areas
    .sort((a, b) => (b?.monthlyUsd ?? 0) - (a?.monthlyUsd ?? 0))
    .slice(0, 3)
    .map(area => area?.key ?? 'operational_efficiency')
    .filter(Boolean);
  
  // Ensure at least one pain point
  if (primaryPainPoints.length === 0) {
    primaryPainPoints.push('operational_efficiency');
  }

  // Technical Readiness Score with null safety
  const technicalReadiness = Math.max(0, Math.min(100, scoreSummary?.overall ?? 50));

  // Implementation Complexity Assessment
  let implementationComplexity: 'simple' | 'moderate' | 'complex' = 'moderate';
  if (businessSize === 'small' && technicalReadiness > 70) implementationComplexity = 'simple';
  else if (businessSize === 'large' || technicalReadiness < 40) implementationComplexity = 'complex';

  return {
    businessSize,
    urgencyLevel,
    primaryPainPoints,
    technicalReadiness,
    implementationComplexity
  };
}