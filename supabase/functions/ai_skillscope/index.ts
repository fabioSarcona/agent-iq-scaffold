import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Inline Zod validation schemas
const ContextSchema = z.object({
  auditId: z.string(),
  auditType: z.enum(["dental", "hvac"]),
  business: z.object({
    size: z.enum(["Small", "Medium", "Large"]).optional(),
  }).optional(),
  settings: z.object({
    currency: z.enum(["USD", "EUR"]).optional(),
  }).optional(),
});

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const AuditSchema = z.object({
  responses: z.record(z.any()).optional(),
}).optional();

const MoneyLostSchema = z.object({
  total: z.number().optional(),
  summary: z.string().optional(),
}).optional();

const KbSchema = z.object({
  vertical: z.record(z.any()).optional(),
  shared: z.record(z.any()).optional(),
}).optional();

const RequestSchema = z.object({
  context: ContextSchema,
  skill: SkillSchema,
  audit: AuditSchema,
  moneyLost: MoneyLostSchema,
  kb: KbSchema,
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
    processing_time_ms: z.number().optional(),
    data_quality: z.enum(["high", "medium", "low"]).optional(),
    warnings: z.array(z.string()).optional(),
  }).optional(),
  error: z.object({
    message: z.string(),
    missing: z.array(z.string()).optional(),
  }).optional(),
});

function generateMockSkillScope(input: z.infer<typeof RequestSchema>): z.infer<typeof SkillScopeOutputSchema> {
  const vertical = input.context.auditType === "dental" ? "Dental" : "HVAC";
  const businessSize = input.context.business?.size || "Medium";
  const currency = input.context.settings?.currency || "USD";
  
  return {
    success: true,
    skillScope: {
      header: {
        skill_name: input.skill.name,
        vertical,
        business_size: businessSize,
        summary: `AI-powered ${input.skill.name} optimization for ${vertical.toLowerCase()} practices`,
      },
      what_it_does: `${input.skill.name} automates key processes to improve efficiency and reduce manual work.`,
      how_it_works: {
        trigger: "Customer interaction or scheduled event",
        process: "AI analyzes context and executes appropriate workflow",
        actions: ["Data collection", "Process automation", "Result delivery"],
        integrations: ["CRM", "Phone system", "Practice management"],
        follow_up: "Automated follow-up based on outcomes",
      },
      revenue_impact: {
        statement: `Expected to generate $2,400 monthly in additional revenue`,
        expected_roi_monthly: 2400,
        currency,
        formula: "ROI = (Efficiency Gains + New Revenue) - Implementation Cost",
        assumptions: ["10% efficiency improvement", "5% conversion increase"],
        confidence: 0.75,
      },
      key_benefits: [
        "Reduced manual work",
        "Improved customer experience",
        "Increased conversion rates",
      ],
      implementation: {
        timeline_weeks: 4,
        phases: ["Setup", "Configuration", "Testing", "Launch"],
      },
      proven_results: {
        stats: ["25% reduction in manual tasks", "15% improvement in response time"],
        typical_for_size: `${businessSize} businesses typically see 20-30% efficiency gains`,
      },
      requirements: {
        prerequisites: ["Active CRM system", "Staff training capacity"],
        data_needed: ["Customer contact info", "Service history"],
      },
      cta: {
        primary: {
          label: "Schedule Implementation",
          url: "https://needagent.ai/contact",
        },
        secondary: ["Request demo", "Download case study"],
      },
    },
    confidence_score: 0.8,
    metadata: {
      processing_time_ms: Date.now() % 1000 + 500,
      data_quality: "medium",
      warnings: [],
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Authentication required" } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('SUPABASE_CONFIG_MISSING', errorId);
      return new Response(
        JSON.stringify({ success: false, error: { message: "Service configuration error" } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Invalid authentication" } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const validatedInput = RequestSchema.parse(body);

    // System prompt handling
    const SYS_PROMPT = Deno.env.get("NEEDAGENT_SKILLSCOPE_SYS_PROMPT") ?? "";
    
    if (!SYS_PROMPT) {
      const fallbackResponse = {
        success: true,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          warnings: ["SYSTEM_PROMPT_NOT_SET"]
        },
        skillScope: undefined
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare model input
    const modelInput = {
      context: validatedInput.context,
      skill: validatedInput.skill,
      audit_summary: validatedInput.audit?.responses ? "responses_provided" : "no_responses",
      money_lost: validatedInput.moneyLost?.total || 0,
      kb_available: !!(validatedInput.kb?.vertical || validatedInput.kb?.shared)
    };

    // TODO: call Claude with SYS_PROMPT and modelInput
    // For now, return mock data
    const result = generateMockSkillScope(validatedInput);
    result.metadata = {
      ...result.metadata,
      processing_time_ms: Date.now() - startTime
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(e => e.path.join('.'));
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Invalid request data", missing: missingFields }
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('SKILLSCOPE_ERROR', errorId, error.name);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: `Internal server error (${errorId})` }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});