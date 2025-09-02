import { z } from "zod";

export const SkillScopeOutputSchema = z.object({
  success: z.boolean(),
  skillScope: z.object({
    header: z.object({
      skill_name: z.string(),
      vertical: z.enum(["Dental", "HVAC"]),
      business_size: z.enum(["Small", "Medium", "Large"]),
      summary: z.string(),
    }),
    what_it_does: z.string(),
    how_it_works: z.object({
      trigger: z.string(),
      process: z.string(),
      actions: z.array(z.string()),
      integrations: z.array(z.string()),
      follow_up: z.string(),
    }),
    revenue_impact: z.object({
      statement: z.string(),
      expected_roi_monthly: z.number(),
      currency: z.enum(["USD", "EUR"]),
      formula: z.string(),
      assumptions: z.array(z.string()),
      confidence: z.number(),
    }),
    key_benefits: z.array(z.string()),
    implementation: z.object({
      timeline_weeks: z.number(),
      phases: z.array(z.string()),
    }),
    proven_results: z.object({
      stats: z.array(z.string()),
      typical_for_size: z.string(),
    }),
    requirements: z.object({
      prerequisites: z.array(z.string()),
      data_needed: z.array(z.string()),
    }),
    cta: z.object({
      primary: z.object({
        label: z.string(),
        url: z.string(),
      }),
      secondary: z.array(z.string()),
    }),
  }).optional(),
  confidence_score: z.number().optional(),
  metadata: z.object({
    processing_time_ms: z.number().optional(),
    data_quality: z.enum(["high", "medium", "low"]).optional(),
    warnings: z.array(z.string()).optional(),
  }).optional(),
  error: z.object({
    message: z.string(),
    missing: z.array(z.string()).optional(),
  }).optional(),
});

export type SkillScopeOutput = z.infer<typeof SkillScopeOutputSchema>;