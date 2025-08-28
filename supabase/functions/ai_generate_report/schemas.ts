import { z } from "https://deno.land/x/zod/mod.ts"

// Input Schema - matches the required structure from system prompt
export const ContextSchema = z.object({
  auditId: z.string(),
  auditType: z.enum(["dental", "hvac"]),
  business: z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    size: z.object({
      chairs: z.number().int().nonnegative().optional(),
      techs: z.number().int().nonnegative().optional()
    }).optional()
  }),
  settings: z.object({
    currency: z.enum(["USD", "EUR"]).default("USD"),
    locale: z.enum(["en-US", "it-IT"]).default("en-US"),
    preferredPlan: z.enum(["Starter", "Growth", "Elite"]).optional(),
    maxSkills: z.number().int().positive().optional()
  })
})

export const AuditSchema = z.object({
  responses: z.array(z.object({
    id: z.string(),
    key: z.string(),
    value: z.unknown(),
    section: z.string()
  })),
  sectionScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
  aiReadinessScore: z.number().min(0).max(100).optional()
})

export const MoneyLostSchema = z.object({
  items: z.array(z.object({
    area: z.string(),
    assumptions: z.array(z.string()),
    formula: z.string(),
    resultMonthly: z.number().min(0),
    confidence: z.number().min(0).max(100)
  })),
  totalMonthly: z.number().min(0)
})

export const InsightsSchema = z.array(z.object({
  key: z.string(),
  area: z.string(),
  problem: z.string(),
  impactMonthly: z.number().min(0).optional(),
  recommendations: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100)
}))

export const KBServiceSchema = z.object({
  name: z.string(),
  target: z.enum(["Dental", "HVAC", "Both"]),
  problem: z.string(),
  how: z.string(),
  roiRangeMonthly: z.tuple([z.number().min(0), z.number().min(0)]).optional(),
  tags: z.array(z.string()).optional()
})

export const KBSchema = z.object({
  brand: z.record(z.string(), z.unknown()).optional(),
  approved_claims: z.array(z.string()).default([]),
  services: z.array(KBServiceSchema).min(1)
})

export const HistorySchema = z.object({
  previousInsightsKeys: z.array(z.string()).optional(),
  previousReports: z.array(z.object({
    timestamp: z.string(),
    summary: z.string()
  })).optional()
}).optional()

export const LLMInputSchema = z.object({
  context: ContextSchema,
  audit: AuditSchema,
  moneyLost: MoneyLostSchema,
  insights: InsightsSchema,
  kb: KBSchema,
  history: HistorySchema
})

// Output Schema - strict JSON requirements per system prompt
export const LLMOutputSchema = z.object({
  success: z.boolean(),
  report: z.object({
    welcome: z.string(),
    ai_readiness_score: z.number().min(0).max(100),
    quadrant: z.enum([
      "Low-ROI/Low-Readiness",
      "High-ROI/Low-Readiness", 
      "Low-ROI/High-Readiness",
      "High-ROI/High-Readiness"
    ]),
    bleeding_money: z.array(z.object({
      area: z.string(),
      estimate_monthly: z.number().min(0),
      currency: z.enum(["USD", "EUR"]),
      formula: z.string(),
      assumptions: z.array(z.string()),
      confidence: z.number().min(0).max(100)
    })),
    recommendations: z.object({
      plan: z.enum(["Starter", "Growth", "Elite"]),
      voice_skills: z.array(z.object({
        name: z.string(),
        why: z.string(),
        expected_roi_monthly: z.number().min(0),
        currency: z.enum(["USD", "EUR"]),
        proof_points: z.array(z.string())
      }))
    }),
    next_steps: z.object({
      primary_cta: z.object({
        label: z.string(),
        url: z.string()
      }),
      secondary: z.array(z.string())
    })
  }),
  calculations: z.object({
    total_estimated_recovery_monthly: z.number().min(0),
    currency: z.enum(["USD", "EUR"]),
    logic_notes: z.array(z.string())
  }),
  confidence_score: z.number().min(0).max(100),
  metadata: z.object({
    processing_time_ms: z.number().min(0),
    data_quality: z.enum(["high", "medium", "low"]),
    warnings: z.array(z.string())
  }),
  error: z.object({
    message: z.string(),
    missing: z.array(z.string())
  }).optional()
})

// Type inference exports
export type LLMInput = z.infer<typeof LLMInputSchema>
export type LLMOutput = z.infer<typeof LLMOutputSchema>
export type Context = z.infer<typeof ContextSchema>
export type AuditData = z.infer<typeof AuditSchema>
export type MoneyLostData = z.infer<typeof MoneyLostSchema>
export type InsightsData = z.infer<typeof InsightsSchema>
export type KBData = z.infer<typeof KBSchema>