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

// Types
export type * from './report.types'

// Mock data (for development)
export { buildMockVoiceFitReport } from './report.mock'