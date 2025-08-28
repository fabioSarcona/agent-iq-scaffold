import { z } from 'zod';

// Input schema for NeedAgentIQ
export const NeedAgentIQInputSchema = z.object({
  context: z.object({
    auditId: z.string(),
    auditType: z.enum(['dental', 'hvac']),
    sectionId: z.string(),
    business: z.object({
      name: z.string(),
      location: z.string().optional(),
      size: z.object({
        chairs: z.number().optional(), // dental
        techs: z.number().optional()   // hvac
      }).optional()
    }).optional(),
    settings: z.object({
      currency: z.enum(['USD', 'EUR']).default('USD'),
      locale: z.string().default('en-US')
    }).optional()
  }),
  audit: z.object({
    responses: z.array(z.object({
      key: z.string(),
      value: z.unknown()
    })),
    aiReadinessScore: z.number().min(0).max(100).optional(),
    sectionScores: z.record(z.string(), z.number()).optional()
  }),
  moneyLost: z.object({
    items: z.array(z.object({
      area: z.string(),
      formula: z.string(),
      assumptions: z.array(z.string()),
      resultMonthly: z.number(),
      confidence: z.number().min(0).max(100)
    })),
    totalMonthly: z.number()
  }).optional(),
  kb: z.object({
    approved_claims: z.array(z.string()),
    services: z.array(z.object({
      name: z.string(),
      target: z.enum(['Dental', 'HVAC', 'Both']),
      problem: z.string(),
      how: z.string(),
      roiRangeMonthly: z.array(z.number()).optional(),
      tags: z.array(z.string()).optional()
    }))
  }),
  history: z.object({
    previousInsights: z.array(z.string()).optional(),
    lastTriggered: z.string().optional()
  }).optional()
});

// Output schema for NeedAgentIQ insights
export const NeedAgentIQInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  monthlyImpact: z.object({
    amount: z.number(),
    currency: z.enum(['USD', 'EUR']),
    confidence: z.number().min(0).max(100)
  }),
  skill: z.object({
    name: z.string(),
    id: z.string().optional()
  }),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  actionable: z.boolean(),
  metadata: z.object({
    sectionTriggered: z.string(),
    relevanceScore: z.number().min(0).max(100)
  }).optional()
});

export const NeedAgentIQInsightsSchema = z.array(NeedAgentIQInsightSchema);

// TypeScript types
export type NeedAgentIQInput = z.infer<typeof NeedAgentIQInputSchema>;
export type NeedAgentIQInsight = z.infer<typeof NeedAgentIQInsightSchema>;
export type NeedAgentIQInsights = z.infer<typeof NeedAgentIQInsightsSchema>;

// Response wrapper
export const NeedAgentIQResponseSchema = z.object({
  success: z.boolean(),
  insights: NeedAgentIQInsightsSchema,
  metadata: z.object({
    processing_time_ms: z.number(),
    warnings: z.array(z.string()).optional(),
    model_used: z.string().optional()
  }).optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional()
  }).optional()
});

export type NeedAgentIQResponse = z.infer<typeof NeedAgentIQResponseSchema>;