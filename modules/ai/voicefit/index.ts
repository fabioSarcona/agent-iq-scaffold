// VoiceFit AI module barrel file - centralized exports

// Components
export { BenchmarkNote } from './components/BenchmarkNote'
export { FAQAccordion } from './components/FAQAccordion'
export { PlanCard } from './components/PlanCard'
export { ScoreGauge } from './components/ScoreGauge'
export { SolutionCard, type SolutionCardProps } from './components/SolutionCard'
export { SkillScopeModal } from './components/SkillScopeModal'

// Client utilities
export { requestVoiceFitReport, mapLLMToUI } from './report.client'

// ROI Brain Integration (Single Brain + Claude Orchestrator)  
export { requestROIBrain, roiBrainToVoiceFitAdapter, shouldUseROIBrain } from '../roibrain/client'
export type { ROIBrainBusinessContext, ROIBrainOutput } from '../roibrain/client'

// Types
export type * from './report.types'

// Mock data (for development)
export { buildMockVoiceFitReport } from './report.mock'