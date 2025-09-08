// Zod validation schemas for Edge Functions
import { z } from "https://esm.sh/zod@3.22.4";

// Common business context
export const BusinessContextSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
  size: z.object({
    chairs: z.number().optional(), // dental
    techs: z.number().optional()   // hvac
  }).optional()
});

// Common settings
export const SettingsSchema = z.object({
  currency: z.enum(['USD', 'EUR']).default('USD'),
  locale: z.string().default('en-US'),
  preferredPlan: z.string().optional(),
  maxSkills: z.number().optional(),
  maxLength: z.number().optional(),
  tone: z.enum(['consultative', 'direct', 'friendly']).optional()
});

// Audit response
export const AuditResponseSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  value: z.unknown(),
  section: z.string().optional()
});

// Money lost item
export const MoneyLostItemSchema = z.object({
  area: z.string(),
  formula: z.string(),
  assumptions: z.array(z.string()),
  resultMonthly: z.number(),
  confidence: z.number().min(0).max(100)
});

// KB Service
export const KBServiceSchema = z.object({
  name: z.string(),
  target: z.enum(['Dental', 'HVAC', 'Both']),
  problem: z.string(),
  how: z.string(),
  roiRangeMonthly: z.tuple([z.number(), z.number()]).optional().or(z.array(z.number()).optional()),
  tags: z.array(z.string()).optional()
});

// KB Case Study
export const KBCaseStudySchema = z.object({
  skillName: z.string(),
  vertical: z.enum(['Dental', 'HVAC']),
  metric: z.string(),
  timeframe: z.string().optional()
});

// VoiceFit Report Input
export const VoiceFitInputSchema = z.object({
  context: z.object({
    auditId: z.string(),
    auditType: z.enum(['dental', 'hvac']),
    business: BusinessContextSchema,
    settings: SettingsSchema
  }),
  audit: z.object({
    responses: z.array(AuditResponseSchema),
    sectionScores: z.record(z.string(), z.number()).optional(),
    aiReadinessScore: z.number().min(0).max(100).optional()
  }),
  moneyLost: z.object({
    items: z.array(MoneyLostItemSchema),
    totalMonthly: z.number()
  }),
  insights: z.array(z.object({
    key: z.string(),
    area: z.string(),
    problem: z.string(),
    impactMonthly: z.number(),
    recommendations: z.array(z.string()),
    confidence: z.number()
  })),
  kb: z.object({
    approved_claims: z.array(z.string()),
    services: z.array(KBServiceSchema)
  }),
  history: z.object({
    previousInsightsKeys: z.array(z.string()),
    previousReports: z.array(z.string())
  })
});

// VoiceFit Report Output
export const VoiceFitOutputSchema = z.object({
  success: z.boolean(),
  report: z.object({
    header: z.object({
      businessName: z.string(),
      vertical: z.enum(['Dental', 'HVAC']),
      aiReadinessScore: z.number().min(0).max(100),
      summary: z.string()
    }).optional(),
    skills: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      monthlyROI: z.object({
        min: z.number(),
        max: z.number(),
        currency: z.string()
      }),
      priority: z.enum(['high', 'medium', 'low']),
      category: z.string(),
      integrations: z.array(z.string()).optional()
    })).optional(),
    benchmarks: z.array(z.object({
      metric: z.string(),
      value: z.string(),
      context: z.string()
    })).optional(),
    plans: z.array(z.object({
      name: z.string(),
      monthlyPrice: z.number(),
      features: z.array(z.string()),
      recommended: z.boolean().optional()
    })).optional()
  }).optional(),
  metadata: z.object({
    processing_time_ms: z.number(),
    data_quality: z.enum(['high', 'medium', 'low']),
    warnings: z.array(z.string()).optional()
  }).optional(),
  error: z.object({
    message: z.string(),
    missing: z.array(z.string()).optional()
  }).optional()
});

// SkillScope Input
export const SkillScopeInputSchema = z.object({
  context: z.object({
    auditId: z.string(),
    auditType: z.enum(['dental', 'hvac']),
    business: BusinessContextSchema,
    settings: SettingsSchema
  }),
  skill: z.object({
    id: z.string(),
    name: z.string(),
    target: z.enum(['Dental', 'HVAC', 'Both']),
    problem: z.string(),
    how: z.string(),
    roiRangeMonthly: z.tuple([z.number(), z.number()]).optional(),
    implementation: z.object({
      time_weeks: z.number().optional(),
      phases: z.array(z.string()).optional()
    }).optional(),
    integrations: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }),
  audit: z.object({
    responses: z.array(AuditResponseSchema).optional(),
    aiReadinessScore: z.number().min(0).max(100).optional(),
    sectionScores: z.record(z.number()).optional()
  }).optional(),
  moneyLost: z.object({
    items: z.array(MoneyLostItemSchema),
    totalMonthly: z.number()
  }).optional(),
  kb: z.object({
    approved_claims: z.array(z.string()),
    services: z.array(KBServiceSchema),
    case_studies: z.array(KBCaseStudySchema).optional()
  })
});

// SkillScope Output
export const SkillScopeOutputSchema = z.object({
  success: z.boolean(),
  skillScope: z.object({
    header: z.object({
      skill_name: z.string(),
      vertical: z.enum(['Dental', 'HVAC']),
      business_size: z.enum(['Small', 'Medium', 'Large']),
      summary: z.string()
    }),
    what_it_does: z.string(),
    how_it_works: z.object({
      trigger: z.string(),
      process: z.string(),
      actions: z.array(z.string()),
      integrations: z.array(z.string()),
      follow_up: z.string()
    }),
    revenue_impact: z.object({
      statement: z.string(),
      expected_roi_monthly: z.number(),
      currency: z.enum(['USD', 'EUR']),
      formula: z.string(),
      assumptions: z.array(z.string()),
      confidence: z.number()
    }),
    key_benefits: z.array(z.string()),
    implementation: z.object({
      timeline_weeks: z.number(),
      phases: z.array(z.string())
    }),
    proven_results: z.object({
      stats: z.array(z.string()),
      typical_for_size: z.string()
    }),
    requirements: z.object({
      prerequisites: z.array(z.string()),
      data_needed: z.array(z.string())
    }),
    cta: z.object({
      primary: z.object({
        label: z.string(),
        url: z.string()
      }),
      secondary: z.array(z.string())
    })
  }).optional(),
  confidence_score: z.number().optional(),
  metadata: z.object({
    processing_time_ms: z.number(),
    data_quality: z.enum(['high', 'medium', 'low']),
    warnings: z.array(z.string()).optional()
  }).optional(),
  error: z.object({
    message: z.string(),
    missing: z.array(z.string()).optional()
  }).optional()
});

// NeedAgentIQ Input
export const NeedAgentIQInputSchema = z.object({
  context: z.object({
    auditId: z.string(),
    auditType: z.enum(['dental', 'hvac']),
    sectionId: z.string(),
    business: BusinessContextSchema.optional(),
    settings: SettingsSchema.optional()
  }),
  audit: z.object({
    responses: z.array(AuditResponseSchema),
    aiReadinessScore: z.number().min(0).max(100).optional(),
    sectionScores: z.record(z.string(), z.number()).optional()
  }),
  moneyLost: z.object({
    items: z.array(MoneyLostItemSchema),
    totalMonthly: z.number()
  }).optional(),
  kb: z.object({
    approved_claims: z.array(z.string()),
    services: z.array(KBServiceSchema)
  }).optional(),
  history: z.object({
    previousInsights: z.array(z.string()).optional(),
    lastTriggered: z.string().optional()
  }).optional()
});

// NeedAgentIQ Insight
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

export const NeedAgentIQOutputSchema = z.array(NeedAgentIQInsightSchema);

// MoneyLost Input
export const MoneyLostInputSchema = z.object({
  vertical: z.enum(['dental', 'hvac']),
  answers: z.record(z.string(), z.unknown())
});

// MoneyLost Output
export const MoneyLostOutputSchema = z.object({
  vertical: z.enum(['dental', 'hvac']),
  dailyTotalUsd: z.number(),
  monthlyTotalUsd: z.number(),
  annualTotalUsd: z.number(),
  areas: z.array(z.object({
    key: z.string(),
    title: z.string(),
    dailyUsd: z.number(),
    monthlyUsd: z.number(),
    annualUsd: z.number(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    recoverablePctRange: z.object({
      min: z.number(),
      max: z.number()
    }),
    rationale: z.array(z.string())
  })),
  assumptions: z.array(z.string()),
  version: z.string()
});

// OTP Request Input
export const OTPRequestInputSchema = z.object({
  email: z.string().email()
});

// OTP Verify Input
export const OTPVerifyInputSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits')
});

// OTP Request Output
export const OTPRequestOutputSchema = z.object({
  ok: z.boolean(),
  cooldownSeconds: z.number(),
  expiresInMinutes: z.number(),
  error: z.string().optional()
});

// OTP Verify Output
export const OTPVerifyOutputSchema = z.object({
  verified: z.boolean(),
  error: z.string().optional()
});