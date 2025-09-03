import type { VoiceFitReportData } from './report.types'
import type { MoneyLostSummary } from '@modules/moneylost/moneylost.types'

export type Vertical = 'dental' | 'hvac'

export interface KBPayload {
  brand: any
  voiceSkills: any
  painPoints: any
  pricing: any
  responseModels?: any
  faq: any
}

export interface GenerateReportRequest {
  vertical: Vertical
  answers: Record<string, unknown>
  moneylost?: MoneyLostSummary
  kb?: KBPayload
}

export type GenerateReportResponse = VoiceFitReportData