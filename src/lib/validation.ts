import { z } from 'zod'
import { logger } from '@/lib/logger'

// Runtime validation boundaries for API responses and critical data flows

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
})

export const MoneyLostSummary = z.object({
  total: z.object({
    dailyUsd: z.number().min(0),
    monthlyUsd: z.number().min(0),
    annualUsd: z.number().min(0),
  }),
  areas: z.array(z.object({
    key: z.string().min(1),
    title: z.string().min(1),
    dailyUsd: z.number().min(0),
    monthlyUsd: z.number().min(0),
    annualUsd: z.number().min(0),
    recoverablePctRange: z.object({
      min: z.number().min(0).max(1),
      max: z.number().min(0).max(1),
    }),
    rationale: z.array(z.string().min(1)),
  })),
  assumptions: z.array(z.string()).optional(),
  version: z.string().min(1),
})

export const VoiceFitReportSchema = z.object({
  score: z.number().min(1).max(100),
  band: z.enum(['Crisis', 'Optimization Needed', 'Growth Ready', 'AI-Optimized']),
  diagnosis: z.array(z.string().min(1)),
  consequences: z.array(z.string().min(1)),
  solutions: z.array(z.object({
    skillId: z.string().min(1),
    title: z.string().min(1),
    rationale: z.string().min(1),
    estimatedRecoveryPct: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).optional(),
  })),
  faq: z.array(z.object({
    q: z.string().min(1),
    a: z.string().min(1),
  })),
  plan: z.object({
    name: z.string().min(1),
    priceMonthlyUsd: z.number().min(0),
    inclusions: z.array(z.string().min(1)),
    addons: z.array(z.string()).optional(),
  }),
  benchmarks: z.array(z.string()).optional(),
})

export const AuditAnswersSchema = z.record(z.string(), z.unknown())

// Validation utility functions
export function validateApiResponse(data: unknown): { success: boolean; data?: unknown; error?: string } {
  try {
    const result = ApiResponseSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}

export function validateMoneyLostResponse(data: unknown) {
  return MoneyLostSummary.parse(data)
}

export function validateVoiceFitReport(data: unknown) {
  return VoiceFitReportSchema.parse(data)
}

export function validateAuditAnswers(data: unknown) {
  return AuditAnswersSchema.parse(data)
}

// Type guards with runtime validation
export function isValidVertical(value: unknown): value is 'dental' | 'hvac' {
  return typeof value === 'string' && ['dental', 'hvac'].includes(value)
}

export function isValidAnswer(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

// Error boundary helper for type-safe error handling
export class ValidationError extends Error {
  constructor(message: string, public readonly validationErrors?: z.ZodError) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function createValidationBoundary<T>(
  schema: z.ZodSchema<T>, 
  fallbackValue?: T
) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation failed', { errors: error.errors })
        if (fallbackValue !== undefined) {
          return fallbackValue
        }
        throw new ValidationError('Validation failed', error)
      }
      throw error
    }
  }
}