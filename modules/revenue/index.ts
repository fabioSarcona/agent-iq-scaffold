export { RevenueSimulator } from './RevenueSimulator'
export type { 
  RevenueSimulatorProps, 
  Insight, 
  SimulatableSkill, 
  SimulationTotals,
  Pricing,
  Vertical,
  BusinessSize 
} from './types'
export { 
  mapSolutionToInsight,
  InsightSchema,
  RevenueSimulatorPropsSchema
} from './types'
export { useSimulator, useROICalculation } from './hooks'
export { 
  formatCurrency, 
  formatPercentage,
  calculateSkillROI,
  calculateSimulationTotals 
} from './utils'