export { RevenueSimulator } from './RevenueSimulator'
export { CTA } from './CTA'
export { SaveForm } from './SaveForm'
export { ROIChart } from './Chart'
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
  calculateSimulationTotals,
  distributeSmartImpacts,
  extractTelemetryData
} from './utils'