// MoneyLost module barrel file - centralized exports
export { requestMoneyLost } from './client'

// Components
export { MoneyLostSummaryCard, LossAreaCard, DisclaimerNote } from './components'

// Types
export type * from './types'

// Utilities
export { computeMoneyLost } from './moneylost'
export { getSeverityColor, getSeverityLabel } from './severity'
export { BENCHMARKS } from './benchmarks'