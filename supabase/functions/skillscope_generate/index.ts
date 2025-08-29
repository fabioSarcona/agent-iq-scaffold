import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline Zod validation schemas (no app imports)
const SkillScopeInputSchema = z.object({
  context: z.object({
    auditId: z.string(),
    auditType: z.enum(["dental", "hvac"]),
    business: z.object({
      name: z.string().optional(),
      location: z.string().optional(),
      size: z.object({
        chairs: z.number().optional(),
        techs: z.number().optional(),
      }).optional(),
    }).optional(),
    settings: z.object({
      currency: z.enum(["USD", "EUR"]).optional(),
      locale: z.enum(["en-US", "it-IT"]).optional(),
      maxLength: z.number().optional(),
      tone: z.string().optional(),
    }).optional(),
  }),
  skill: z.object({
    id: z.string(),
    name: z.string(),
    target: z.enum(["Dental", "HVAC", "Both"]),
    problem: z.string(),
    how: z.string(),
    roiRangeMonthly: z.tuple([z.number(), z.number()]).optional(),
    implementation: z.object({
      time_weeks: z.number().optional(),
      phases: z.array(z.string()).optional(),
    }).optional(),
    integrations: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
  audit: z.object({
    responses: z.array(z.object({
      key: z.string(),
      value: z.any(),
    })).optional(),
    aiReadinessScore: z.number().optional(),
    sectionScores: z.record(z.number()).optional(),
  }).optional(),
  moneyLost: z.object({
    items: z.array(z.object({
      area: z.string(),
      formula: z.string(),
      assumptions: z.array(z.string()),
      resultMonthly: z.number(),
      confidence: z.number(),
    })),
    totalMonthly: z.number(),
  }).optional(),
  kb: z.object({
    approved_claims: z.array(z.string()),
    services: z.array(z.object({
      name: z.string(),
      target: z.enum(["Dental", "HVAC", "Both"]),
      problem: z.string(),
      how: z.string(),
      roiRangeMonthly: z.tuple([z.number(), z.number()]).optional(),
      tags: z.array(z.string()).optional(),
    })),
    case_studies: z.array(z.object({
      skillName: z.string(),
      vertical: z.enum(["Dental", "HVAC"]),
      metric: z.string(),
      timeframe: z.string().optional(),
    })).optional(),
  }),
});

const SkillScopeOutputSchema = z.object({
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
    processing_time_ms: z.number(),
    data_quality: z.enum(["high", "medium", "low"]),
    warnings: z.array(z.string()),
  }).optional(),
  error: z.object({
    message: z.string(),
    missing: z.array(z.string()).optional(),
  }).optional(),
});

type SkillScopeInput = z.infer<typeof SkillScopeInputSchema>;
type SkillScopeOutput = z.infer<typeof SkillScopeOutputSchema>;

function calculateBusinessSize(input: SkillScopeInput): "Small" | "Medium" | "Large" {
  const { auditType } = input.context;
  const size = input.context.business?.size;
  
  if (auditType === "dental") {
    const chairs = size?.chairs || 0;
    if (chairs >= 7) return "Large";
    if (chairs >= 4) return "Medium";
    return "Small";
  } else {
    const techs = size?.techs || 0;
    if (techs >= 9) return "Large";
    if (techs >= 4) return "Medium";
    return "Small";
  }
}

function calculateConservativeROI(input: SkillScopeInput): number {
  const { skill, moneyLost } = input;
  
  // Use skill ROI range lower bound if available
  if (skill.roiRangeMonthly) {
    return skill.roiRangeMonthly[0];
  }
  
  // Match moneyLost areas by tags
  if (moneyLost && skill.tags) {
    const matchingAreas = moneyLost.items.filter(item => 
      skill.tags?.some(tag => item.area.toLowerCase().includes(tag.toLowerCase()))
    );
    
    if (matchingAreas.length > 0) {
      const totalMatchingLoss = matchingAreas.reduce((sum, item) => sum + item.resultMonthly, 0);
      return Math.floor(totalMatchingLoss * 0.5); // Conservative 50% recovery
    }
  }
  
  return 0;
}

function generateSkillScopeStub(input: SkillScopeInput): SkillScopeOutput {
  const startTime = Date.now();
  const { skill, context } = input;
  const businessSize = calculateBusinessSize(input);
  const conservativeROI = calculateConservativeROI(input);
  const currency = context.settings?.currency || "USD";
  
  const warnings: string[] = ["This is a stub implementation - LLM integration pending (FP-13.2)"];
  
  if (conservativeROI === 0) {
    warnings.push("No ROI data available - using placeholder values");
  }
  
  const skillScope = {
    header: {
      skill_name: skill.name,
      vertical: context.auditType === "dental" ? "Dental" as const : "HVAC" as const,
      business_size: businessSize,
      summary: `AI-powered ${skill.name} solution for ${context.auditType} practices. ${skill.problem}`,
    },
    what_it_does: skill.problem,
    how_it_works: {
      trigger: "Activates automatically based on predefined business events",
      process: skill.how,
      actions: [
        "Analyzes incoming requests",
        "Executes appropriate responses",
        "Updates business systems",
        "Provides reporting metrics"
      ],
      integrations: skill.integrations || ["CRM", "Phone System", "Calendar"],
      follow_up: "Continuous monitoring and optimization based on performance metrics"
    },
    revenue_impact: {
      statement: conservativeROI > 0 
        ? `Expected to generate ${currency === "USD" ? "$" : "€"}${conservativeROI.toLocaleString()}/month in additional revenue` 
        : "ROI calculation requires more business data",
      expected_roi_monthly: conservativeROI,
      currency,
      formula: conservativeROI > 0 
        ? "Recovery Rate × Monthly Loss × Efficiency Factor" 
        : "Pending business data analysis",
      assumptions: conservativeROI > 0 
        ? ["50% conservative recovery rate", "Consistent implementation", "No major external disruptions"]
        : ["Business data collection in progress"],
      confidence: conservativeROI > 0 ? 75 : 45,
    },
    key_benefits: [
      "24/7 automated operation",
      "Consistent service quality",
      "Reduced operational costs",
      "Improved customer satisfaction",
      "Detailed performance analytics"
    ],
    implementation: {
      timeline_weeks: skill.implementation?.time_weeks || 4,
      phases: skill.implementation?.phases || [
        "Initial setup and configuration",
        "Integration with existing systems",
        "Testing and optimization",
        "Full deployment and monitoring"
      ],
    },
    proven_results: {
      stats: [
        "Average 35-60% improvement in target metrics",
        "ROI typically achieved within 60-90 days",
        "95%+ customer satisfaction ratings"
      ],
      typical_for_size: `${businessSize} ${context.auditType} practices typically see results within 30-60 days`,
    },
    requirements: {
      prerequisites: [
        "Existing phone system compatibility",
        "Internet connectivity",
        "Basic staff training (2-4 hours)"
      ],
      data_needed: [
        "Current call volume metrics",
        "Existing conversion rates",
        "Business process workflows"
      ],
    },
    cta: {
      primary: {
        label: "Schedule Implementation Call",
        url: "https://needagent.ai/schedule",
      },
      secondary: [
        "Download detailed case studies",
        "View live demo",
        "Get custom ROI calculation"
      ],
    },
  };

  return {
    success: true,
    skillScope,
    confidence_score: conservativeROI > 0 ? 75 : 45,
    metadata: {
      processing_time_ms: Date.now() - startTime,
      data_quality: conservativeROI > 0 ? "medium" : "low",
      warnings,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse and validate input
    const body = await req.json();
    const validatedInput = SkillScopeInputSchema.parse(body);

    console.log('Processing SkillScope request', { 
      auditId: validatedInput.context.auditId,
      skillName: validatedInput.skill.name 
    });

    // Generate stub response (no LLM call)
    const result = generateSkillScopeStub(validatedInput);
    
    const processingTime = Date.now() - startTime;
    console.log('SkillScope generated successfully', { processingTime });

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime}ms`
      }
    });

  } catch (error) {
    console.error('SkillScope generation error', { error: error.message });
    
    const processingTime = Date.now() - startTime;
    let errorResponse: SkillScopeOutput;

    if (error.name === 'ZodError') {
      errorResponse = {
        success: false,
        error: { 
          message: "Invalid input", 
          missing: error.errors.map((e: any) => e.path.join('.')) 
        },
        metadata: { 
          processing_time_ms: processingTime,
          data_quality: 'low',
          warnings: ['Input validation failed']
        }
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    errorResponse = {
      success: false,
      error: { 
        message: error.message || "Internal server error"
      },
      metadata: { 
        processing_time_ms: processingTime,
        data_quality: 'low',
        warnings: ['Unexpected error occurred']
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});