import type { 
  Insight, 
  SimulatableSkill, 
  SimulationTotals, 
  BusinessSize,
  Vertical 
} from './types'

/**
 * Calculate ROI for a single skill
 */
export function calculateSkillROI(
  monthlyImpact: number,
  recoveryRate: number,
  cost: number
): number {
  const recoveredRevenue = monthlyImpact * recoveryRate
  return recoveredRevenue - cost
}

/**
 * Calculate ROI percentage
 */
export function calculateROIPercentage(netROI: number, totalCost: number): number {
  if (totalCost === 0) return 0
  return (netROI / totalCost) * 100
}

/**
 * Convert insights to simulatable skills
 */
export function convertInsightsToSkills(insights: Insight[]): SimulatableSkill[] {
  return insights.map((insight, index) => {
    const roiIfActive = calculateSkillROI(
      insight.monthlyImpact,
      insight.skill.recoveryRate,
      insight.skill.cost
    )

    return {
      id: `skill-${index}`,
      name: insight.skill.name,
      cost: insight.skill.cost,
      monthlyImpact: insight.monthlyImpact,
      recoveryRate: insight.skill.recoveryRate,
      roiIfActive,
      isActive: false, // Default to inactive
      rationale: insight.rationale,
    }
  })
}

/**
 * Calculate simulation totals from active skills
 */
export function calculateSimulationTotals(skills: SimulatableSkill[]): SimulationTotals {
  const activeSkills = skills.filter(skill => skill.isActive)
  const totalSkillsCount = skills.length
  const activeSkillsCount = activeSkills.length

  const totalRecoverableRevenue = activeSkills.reduce(
    (sum, skill) => sum + (skill.monthlyImpact * skill.recoveryRate), 
    0
  )
  
  const totalCost = activeSkills.reduce((sum, skill) => sum + skill.cost, 0)
  const netROI = totalRecoverableRevenue - totalCost
  const roiPercentage = calculateROIPercentage(netROI, totalCost)

  return {
    totalRecoverableRevenue,
    totalCost,
    netROI,
    roiPercentage,
    activeSkillsCount,
    totalSkillsCount,
  }
}

/**
 * Apply business size multiplier to base costs and impacts
 */
export function applyBusinessSizeMultiplier(
  value: number, 
  businessSize: BusinessSize
): number {
  const multipliers = {
    Small: 1.0,
    Medium: 1.5,
    Large: 2.5,
  }
  
  return value * multipliers[businessSize]
}

/**
 * Apply vertical-specific adjustments
 */
export function applyVerticalAdjustments(
  value: number,
  vertical: Vertical
): number {
  const adjustments = {
    dental: 1.0,   // Base multiplier
    hvac: 1.2,     // HVAC typically higher impact
  }
  
  return value * adjustments[vertical]
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(0)}%`
}

/**
 * FASE 4.3.1: Smart impact distribution based on area-to-skill mapping
 * Maps MoneyLost areas to specific skills instead of uniform distribution
 */
export function distributeSmartImpacts(
  solutions: Array<{ skillId: string; title: string; rationale: string }>,
  moneyLostAreas: Array<{ id: string; title: string; monthlyUsd: number }>,
  fallbackTotalUsd: number
): Array<{ skillId: string; title: string; rationale: string; monthlyImpact: number }> {
  
  // Area ID to Skill ID mapping (from Phase 4.1 voice skill mapping)
  const areaToSkillMapping: Record<string, string[]> = {
    // Dental areas
    'missed_calls': ['reception-24-7'],
    'patient_no_shows': ['prevention-no-show'], 
    'treatment_plans': ['treatment-plan-closer', 'follow-up-agent'],
    'inactive_patients': ['recall-reactivation'],
    'missed_recalls': ['recall-reactivation'],
    'low_reviews': ['review-booster'],
    
    // HVAC areas  
    'missed_service_calls': ['hvac-reception-24-7'],
    'job_cancellations': ['hvac-no-show-reminder'],
    'pending_quotes': ['quote-follow-up'],
    'inactive_customers': ['hvac-recall-reactivation'],
    'few_reviews': ['hvac-review-booster'],
  }

  // Create skill impact map
  const skillImpactMap: Record<string, number> = {}
  
  // First, try to map areas to skills
  let mappedTotalUsd = 0
  
  for (const area of moneyLostAreas) {
    const matchingSkills = areaToSkillMapping[area.id] || []
    const impactPerSkill = matchingSkills.length > 0 ? area.monthlyUsd / matchingSkills.length : 0
    
    for (const skillId of matchingSkills) {
      skillImpactMap[skillId] = (skillImpactMap[skillId] || 0) + impactPerSkill
      mappedTotalUsd += impactPerSkill
    }
  }
  
  // For unmapped skills, distribute remaining amount uniformly
  const mappedSkills = new Set(Object.keys(skillImpactMap))
  const unmappedSkills = solutions.filter(s => !mappedSkills.has(s.skillId))
  const remainingUsd = Math.max(0, fallbackTotalUsd - mappedTotalUsd)
  const uniformImpact = unmappedSkills.length > 0 ? remainingUsd / unmappedSkills.length : 0
  
  for (const skill of unmappedSkills) {
    skillImpactMap[skill.skillId] = uniformImpact
  }
  
  // Apply impacts to solutions
  return solutions.map(solution => ({
    ...solution,
    monthlyImpact: Math.round(skillImpactMap[solution.skillId] || 0)
  }))
}

/**
 * FASE 4.3.1: Enhanced telemetry data extraction
 */
export function extractTelemetryData(moneyLost: any, roiBrainMetadata?: any) {
  const areas = moneyLost?.areas || []
  const topArea = areas.reduce((max: any, area: any) => 
    (!max || area.monthlyUsd > max.monthlyUsd) ? area : max, null)
  
  return {
    areasCount: areas.length,
    topAreaId: topArea?.id || null,
    topAreaUsd: topArea?.monthlyUsd || 0,
    source: moneyLost?.source || 'unknown',
    confidence: moneyLost?.confidence || null,
    versions: roiBrainMetadata?.versions || null,
    hasAreaMapping: areas.length > 0
  }
}