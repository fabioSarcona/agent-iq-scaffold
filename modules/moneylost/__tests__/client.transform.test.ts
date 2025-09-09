import { expect, test, describe } from 'vitest'
import { MoneyLostSummary } from '@/lib/validation'
import type { MoneyLostSummary as ClientMoneyLostSummary } from '../types'

// Edge function response shape
interface EdgeMoneyLostResponse {
  vertical: 'dental' | 'hvac'
  dailyTotalUsd: number
  monthlyTotalUsd: number
  annualTotalUsd: number
  areas: Array<{
    key: string
    title: string
    dailyUsd: number
    monthlyUsd: number
    annualUsd: number
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recoverablePctRange: { min: number; max: number }
    rationale: string[]
  }>
  assumptions: string[]
  version: string
}

// Transform edge response to client shape
function transformMoneyLostResponse(edgeResponse: EdgeMoneyLostResponse): ClientMoneyLostSummary {
  return {
    total: {
      dailyUsd: edgeResponse.dailyTotalUsd,
      monthlyUsd: edgeResponse.monthlyTotalUsd,
      annualUsd: edgeResponse.annualTotalUsd
    },
    areas: edgeResponse.areas.map(area => ({
      key: area.key,
      title: area.title,
      dailyUsd: area.dailyUsd,
      monthlyUsd: area.monthlyUsd,
      annualUsd: area.annualUsd,
      recoverablePctRange: area.recoverablePctRange,
      rationale: area.rationale
    })),
    assumptions: edgeResponse.assumptions,
    version: edgeResponse.version
  }
}

describe('MoneyLost Client Transform', () => {
  test('transforms edge response to client shape', () => {
    const edgeResponse: EdgeMoneyLostResponse = {
      vertical: 'dental',
      dailyTotalUsd: 150,
      monthlyTotalUsd: 3300,
      annualTotalUsd: 39600,
      areas: [
        {
          key: 'missed_calls',
          title: 'Missed Calls Revenue Loss',
          dailyUsd: 80,
          monthlyUsd: 1760,
          annualUsd: 21120,
          severity: 'MEDIUM',
          recoverablePctRange: { min: 0.35, max: 0.60 },
          rationale: ['Missed calls per day ≈ 4', 'Call→appointment ≈ 40%', 'Avg appointment ≈ $200']
        },
        {
          key: 'no_shows',
          title: 'No-Shows Revenue Loss',
          dailyUsd: 70,
          monthlyUsd: 1540,
          annualUsd: 18480,
          severity: 'MEDIUM',
          recoverablePctRange: { min: 0.30, max: 0.60 },
          rationale: ['No-shows per week ≈ 3', 'Avg appointment ≈ $200']
        }
      ],
      assumptions: ['No fee data; used $180 conservative appointment value.'],
      version: 'ml-edge-v2.0'
    }

    const transformed = transformMoneyLostResponse(edgeResponse)

    // Test the transformation
    expect(transformed.total.dailyUsd).toBe(150)
    expect(transformed.total.monthlyUsd).toBe(3300)
    expect(transformed.total.annualUsd).toBe(39600)
    expect(transformed.areas).toHaveLength(2)
    expect(transformed.areas[0].key).toBe('missed_calls')
    expect(transformed.areas[0].recoverablePctRange.min).toBe(0.35)
    expect(transformed.assumptions).toEqual(['No fee data; used $180 conservative appointment value.'])
    expect(transformed.version).toBe('ml-edge-v2.0')
  })

  test('validates transformed response with Zod schema', () => {
    const edgeResponse: EdgeMoneyLostResponse = {
      vertical: 'hvac',
      dailyTotalUsd: 200,
      monthlyTotalUsd: 4400,
      annualTotalUsd: 52800,
      areas: [
        {
          key: 'missed_service_calls',
          title: 'Missed Service Calls Loss',
          dailyUsd: 120,
          monthlyUsd: 2640,
          annualUsd: 31680,
          severity: 'HIGH',
          recoverablePctRange: { min: 0.40, max: 0.65 },
          rationale: ['Missed calls per day ≈ 3', 'Call→job ≈ 75%', 'Value per call ≈ $160']
        }
      ],
      assumptions: ['Basic ticket missing; used 25% of large job value as avg ticket.'],
      version: 'ml-edge-v2.0'
    }

    const transformed = transformMoneyLostResponse(edgeResponse)
    
    // Should validate successfully with Zod
    expect(() => MoneyLostSummary.parse(transformed)).not.toThrow()
    
    const validated = MoneyLostSummary.parse(transformed)
    expect(validated.total.dailyUsd).toBe(200)
    expect(validated.areas[0].title).toBe('Missed Service Calls Loss')
  })

  test('handles empty areas and assumptions', () => {
    const edgeResponse: EdgeMoneyLostResponse = {
      vertical: 'dental',
      dailyTotalUsd: 0,
      monthlyTotalUsd: 0,
      annualTotalUsd: 0,
      areas: [],
      assumptions: [],
      version: 'ml-edge-v2.0'
    }

    const transformed = transformMoneyLostResponse(edgeResponse)
    
    expect(() => MoneyLostSummary.parse(transformed)).not.toThrow()
    expect(transformed.areas).toEqual([])
    expect(transformed.assumptions).toEqual([])
  })

  test('fails validation with invalid data', () => {
    const invalidData = {
      total: {
        dailyUsd: -100, // Invalid: negative number
        monthlyUsd: 'invalid', // Invalid: string instead of number
        annualUsd: 36000
      },
      areas: [],
      version: '' // Invalid: empty string
    }

    expect(() => MoneyLostSummary.parse(invalidData)).toThrow()
  })

  test('validates recoverable percentage range constraints', () => {
    const validData = {
      total: { dailyUsd: 100, monthlyUsd: 3000, annualUsd: 36000 },
      areas: [
        {
          key: 'test_area',
          title: 'Test Area',
          dailyUsd: 50,
          monthlyUsd: 1500,
          annualUsd: 18000,
          recoverablePctRange: { min: 0.2, max: 0.8 }, // Valid range 0-1
          rationale: ['Test rationale']
        }
      ],
      assumptions: [],
      version: 'v1.0'
    }

    expect(() => MoneyLostSummary.parse(validData)).not.toThrow()

    // Test invalid range
    const invalidData = {
      ...validData,
      areas: [{
        ...validData.areas[0],
        recoverablePctRange: { min: -0.1, max: 1.5 } // Invalid: outside 0-1 range
      }]
    }

    expect(() => MoneyLostSummary.parse(invalidData)).toThrow()
  })
})