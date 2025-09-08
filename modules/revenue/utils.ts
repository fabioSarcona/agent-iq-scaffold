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