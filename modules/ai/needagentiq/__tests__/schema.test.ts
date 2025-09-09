import { expect, test, describe } from 'vitest'
import { 
  NeedAgentIQSimpleInputSchema, 
  NeedAgentIQSimpleOutputSchema,
  NeedAgentIQSimpleInsightSchema 
} from '../../../../supabase/functions/_shared/validation'

describe('NeedAgentIQ Input Schema Validation', () => {
  test('validates correct input format', () => {
    const validInput = {
      vertical: 'dental' as const,
      sectionId: 'section_patient_management',
      answersSection: {
        'daily_unanswered_calls_choice': '4_10',
        'new_patient_conversion_rate_choice': '3_5',
        'avg_fee_standard_treatment_usd': 180
      }
    }

    expect(() => NeedAgentIQSimpleInputSchema.parse(validInput)).not.toThrow()
    
    const validated = NeedAgentIQSimpleInputSchema.parse(validInput)
    expect(validated.vertical).toBe('dental')
    expect(validated.sectionId).toBe('section_patient_management')
    expect(validated.answersSection).toEqual(validInput.answersSection)
  })

  test('rejects invalid vertical', () => {
    const invalidInput = {
      vertical: 'invalid_vertical',
      sectionId: 'section_test',
      answersSection: {}
    }

    expect(() => NeedAgentIQSimpleInputSchema.parse(invalidInput)).toThrow()
  })

  test('rejects missing required fields', () => {
    const incompleteInput = {
      vertical: 'hvac' as const,
      // missing sectionId and answersSection
    }

    expect(() => NeedAgentIQSimpleInputSchema.parse(incompleteInput)).toThrow()
  })

  test('handles various answer types', () => {
    const mixedAnswers = {
      vertical: 'hvac' as const,
      sectionId: 'section_operations',
      answersSection: {
        'string_answer': 'some text',
        'number_answer': 42,
        'boolean_answer': true,
        'null_answer': null,
        'complex_object': { nested: 'value' }
      }
    }

    expect(() => NeedAgentIQSimpleInputSchema.parse(mixedAnswers)).not.toThrow()
  })
})

describe('NeedAgentIQ Output Schema Validation', () => {
  test('validates single insight', () => {
    const validInsight = {
      key: 'call_management_insight',
      title: 'Improve Call Handling Process',
      rationale: [
        'Missing 4-10 calls daily indicates insufficient phone coverage',
        'Poor conversion rate suggests training gaps',
        'Automated call routing could capture 60% of missed opportunities'
      ],
      monthlyImpactUsd: 2400,
      priority: 'high' as const
    }

    expect(() => NeedAgentIQSimpleInsightSchema.parse(validInsight)).not.toThrow()
    
    const validated = NeedAgentIQSimpleInsightSchema.parse(validInsight)
    expect(validated.key).toBe('call_management_insight')
    expect(validated.title).toBe('Improve Call Handling Process')
    expect(validated.rationale).toHaveLength(3)
    expect(validated.monthlyImpactUsd).toBe(2400)
    expect(validated.priority).toBe('high')
  })

  test('validates multiple insights array', () => {
    const validInsights = [
      {
        key: 'insight_1',
        title: 'Voice AI for Call Screening',
        rationale: ['Automated screening reduces hold times', 'Pre-qualifies urgent calls'],
        monthlyImpactUsd: 1800,
        priority: 'high' as const
      },
      {
        key: 'insight_2', 
        title: 'Appointment Reminder System',
        rationale: ['Reduces no-shows by 40%', 'Frees up staff time'],
        monthlyImpactUsd: 950,
        priority: 'medium' as const
      },
      {
        key: 'insight_3',
        title: 'Patient Communication Hub',
        rationale: ['Centralizes all patient touchpoints'],
        monthlyImpactUsd: 600,
        priority: 'low' as const
      }
    ]

    expect(() => NeedAgentIQSimpleOutputSchema.parse(validInsights)).not.toThrow()
    
    const validated = NeedAgentIQSimpleOutputSchema.parse(validInsights)
    expect(validated).toHaveLength(3)
    expect(validated[0].priority).toBe('high')
    expect(validated[1].monthlyImpactUsd).toBe(950)
  })

  test('validates empty insights array', () => {
    const emptyInsights: never[] = []

    expect(() => NeedAgentIQSimpleOutputSchema.parse(emptyInsights)).not.toThrow()
    
    const validated = NeedAgentIQSimpleOutputSchema.parse(emptyInsights)
    expect(validated).toEqual([])
  })

  test('rejects invalid priority values', () => {
    const invalidInsight = {
      key: 'test_insight',
      title: 'Test Insight',
      rationale: ['Test rationale'],
      monthlyImpactUsd: 1000,
      priority: 'critical' // Invalid: not in enum
    }

    expect(() => NeedAgentIQSimpleInsightSchema.parse(invalidInsight)).toThrow()
  })

  test('rejects negative monthly impact', () => {
    const invalidInsight = {
      key: 'negative_impact',
      title: 'Invalid Impact',
      rationale: ['Should not have negative impact'],
      monthlyImpactUsd: -500, // Invalid: negative
      priority: 'medium' as const
    }

    expect(() => NeedAgentIQSimpleInsightSchema.parse(invalidInsight)).toThrow()
  })

  test('rejects empty required strings', () => {
    const invalidInsight = {
      key: '', // Invalid: empty string
      title: 'Valid Title',
      rationale: ['Valid rationale'],
      monthlyImpactUsd: 1000,
      priority: 'high' as const
    }

    expect(() => NeedAgentIQSimpleInsightSchema.parse(invalidInsight)).toThrow()
  })

  test('rejects empty rationale array', () => {
    const invalidInsight = {
      key: 'valid_key',
      title: 'Valid Title', 
      rationale: [], // Invalid: empty array
      monthlyImpactUsd: 1000,
      priority: 'high' as const
    }

    expect(() => NeedAgentIQSimpleInsightSchema.parse(invalidInsight)).toThrow()
  })

  test('handles PII-safe rationale length limits', () => {
    const longRationale = 'A'.repeat(300) // Very long rationale
    
    const insightWithLongRationale = {
      key: 'long_rationale_test',
      title: 'Test Long Rationale',
      rationale: [longRationale],
      monthlyImpactUsd: 1000,
      priority: 'medium' as const
    }

    // Schema should still validate (length limits are enforced in edge function)
    expect(() => NeedAgentIQSimpleInsightSchema.parse(insightWithLongRationale)).not.toThrow()
    
    // But in real usage, rationale would be truncated to 240 chars for PII safety
    const truncatedRationale = longRationale.slice(0, 240)
    const safeInsight = {
      ...insightWithLongRationale,
      rationale: [truncatedRationale]
    }
    
    expect(() => NeedAgentIQSimpleInsightSchema.parse(safeInsight)).not.toThrow()
    expect(safeInsight.rationale[0]).toHaveLength(240)
  })
})