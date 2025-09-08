import { z } from 'zod'

// Use relative imports for modules
export type { MoneyLostSummary } from '../moneylost/types'
export type { RecommendedSolution } from '../ai/voicefit/report.types'

export type Vertical = 'dental' | 'hvac'
export type BusinessSize = 'Small' | 'Medium' | 'Large'

// Pricing structure
export const PricingSchema = z.object({
  setup: z.number().min(0),
  monthly: z.number().min(0),
})

export type Pricing = z.infer<typeof PricingSchema>

// Extended insight with cost information
export const InsightSchema = z.object({
  skill: z.object({
    name: z.string(),
    cost: z.number().min(0),
    recoveryRate: z.number().min(0).max(1), // 0-1 decimal
  }),
  monthlyImpact: z.number().min(0),
  rationale: z.string(),
  estimatedRecoveryPct: z.tuple([z.number(), z.number()]).optional(),
})

export type Insight = z.infer<typeof InsightSchema>

// Internal simulatable skill
export const SimulatableSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number().min(0),
  monthlyImpact: z.number().min(0),
  recoveryRate: z.number().min(0).max(1),
  roiIfActive: z.number(),
  isActive: z.boolean(),
  rationale: z.string(),
})

export type SimulatableSkill = z.infer<typeof SimulatableSkillSchema>

// Simulation totals
export const SimulationTotalsSchema = z.object({
  totalRecoverableRevenue: z.number(),
  totalCost: z.number(),
  netROI: z.number(),
  roiPercentage: z.number(),
  activeSkillsCount: z.number(),
  totalSkillsCount: z.number(),
})

export type SimulationTotals = z.infer<typeof SimulationTotalsSchema>

// Component props
export const RevenueSimulatorPropsSchema = z.object({
  insights: z.array(InsightSchema),
  moneyLost: z.object({
    dailyUsd: z.number(),
    monthlyUsd: z.number(),
    annualUsd: z.number(),
    areas: z.array(z.any()),
  }),
  pricing: PricingSchema,
  vertical: z.enum(['dental', 'hvac']),
  businessSize: z.enum(['Small', 'Medium', 'Large']),
})

export type RevenueSimulatorProps = z.infer<typeof RevenueSimulatorPropsSchema>

// Utility to convert RecommendedSolution to Insight
export function mapSolutionToInsight(solution: any, baseMonthlyImpact: number): Insight {
  const recoveryRate = solution.estimatedRecoveryPct 
    ? (solution.estimatedRecoveryPct[0] + solution.estimatedRecoveryPct[1]) / 2 / 100
    : 0.5 // Default 50% if no range provided

  // Base cost estimate (can be refined based on business requirements)
  const baseCost = baseMonthlyImpact * 0.25 // 25% of impact as cost

  return {
    skill: {
      name: solution.title,
      cost: baseCost,
      recoveryRate,
    },
    monthlyImpact: baseMonthlyImpact,
    rationale: solution.rationale,
    estimatedRecoveryPct: solution.estimatedRecoveryPct,
  }
}