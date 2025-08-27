// MoneyLost module barrel file - centralized exports
export { requestMoneyLost } from './client'

// Components
export { MoneyLostSummaryCard, LossAreaCard, DisclaimerNote } from './components'

// Types
export type * from './types'
export type * from './moneylost.types'

// Utilities
export { calculateMoneyLost } from './moneylost'
export { getSeverityColor, getSeverityLabel } from './severity'
export { BENCHMARKS } from './benchmarks'