import { z } from 'zod'

// Use relative imports for modules
export type { MoneyLostSummary, MoneyLostArea, MoneyLostSource } from '../moneylost/types'
export type { RecommendedSolution } from '../ai/voicefit/report.types'

// FASE 4.3.1: Export smart distribution functions from utils
export { distributeSmartImpacts, extractTelemetryData } from './utils'

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

// Save simulation types
export const SaveSimulationDataSchema = z.object({
  email: z.string().email(),
  totals: SimulationTotalsSchema,
  skills: z.array(SimulatableSkillSchema),
  metadata: z.object({
    vertical: z.string(),
    businessSize: z.string(),
    timestamp: z.string(),
  })
})

export type SaveSimulationData = z.infer<typeof SaveSimulationDataSchema>

// Component props - Updated for Phase 4.3
export const RevenueSimulatorPropsSchema = z.object({
  insights: z.array(InsightSchema),
  moneyLost: z.object({
    dailyUsd: z.number().optional(),
    monthlyUsd: z.number(),
    annualUsd: z.number().optional(),
    areas: z.array(z.object({
      id: z.string(),
      title: z.string(),
      monthlyUsd: z.number()
    })),
    source: z.enum(['compute', 'legacy', 'roi_brain_fallback']),
    confidence: z.number().optional()
  }),
  pricing: PricingSchema,
  vertical: z.enum(['dental', 'hvac']),
  businessSize: z.enum(['Small', 'Medium', 'Large']),
})

export type RevenueSimulatorProps = z.infer<typeof RevenueSimulatorPropsSchema>

/**
 * Maps a RecommendedSolution to an Insight for revenue simulation
 * FASE 4.3.1: Now supports smart impact distribution with optional monthlyImpact
 */
export function mapSolutionToInsight(solution: any, monthlyImpact?: number): Insight {
  const recoveryRate = solution.estimatedRecoveryPct 
    ? (solution.estimatedRecoveryPct[0] + solution.estimatedRecoveryPct[1]) / 2 / 100
    : 0.5 // Default 50% if no range provided

  // Use provided impact or fallback to base calculation
  const impact = monthlyImpact ?? 0
  const baseCost = impact * 0.25 // 25% of impact as cost

  return {
    skill: {
      name: solution.title,
      cost: baseCost,
      recoveryRate,
    },
    monthlyImpact: impact,
    rationale: solution.rationale,
    estimatedRecoveryPct: solution.estimatedRecoveryPct,
  }
}