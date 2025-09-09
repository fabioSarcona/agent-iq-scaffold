// MoneyLost module barrel file - centralized exports
export { requestMoneyLost } from './client'

// Components
export { MoneyLostSummaryCard, LossAreaCard, DisclaimerNote } from './components'

// Types
export type * from './types'
// export type * from './moneylost.types' // Legacy types - causes collision with types.ts

// Utilities
export { computeMoneyLost } from './moneylost'
export { getSeverityColor, getSeverityLabel, severityFromDaily } from './severity'
export { BENCHMARKS } from './benchmarks'