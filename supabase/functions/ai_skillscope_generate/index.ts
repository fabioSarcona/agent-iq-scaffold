import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";

// Load system prompt at module level
let SYSTEM_PROMPT: string;
try {
  SYSTEM_PROMPT = await Deno.readTextFile(new URL("./system/skillscope.system.md", import.meta.url));
  console.log(`SkillScope system prompt loaded: ${SYSTEM_PROMPT.length} characters`);
} catch (error) {
  console.error("Failed to load SkillScope system prompt:", error);
  SYSTEM_PROMPT = "__PLACEHOLDER__";
}

// Environment variables
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const AI_MODEL = Deno.env.get('AI_MODEL') || 'claude-3-5-sonnet-20240620';
const AI_COST_CAP_USD = parseFloat(Deno.env.get('AI_COST_CAP_USD') || '0.15');

// Simple in-memory cache
const cache = new Map<string, any>();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const SkillScopeInputSchema = z.object({
  context: z.object({
    auditId: z.string(),
    auditType: z.enum(['dental', 'hvac']),
    business: z.object({
      name: z.string(),
      location: z.string(),
      size: z.object({
        chairs: z.number().optional(),
        techs: z.number().optional(),
      }).optional(),
    }),
    settings: z.object({
      currency: z.enum(['USD', 'EUR']).default('USD'),
      locale: z.enum(['en-US', 'it-IT']).default('en-US'),
      maxLength: z.number().optional(),
      tone: z.enum(['consultative', 'direct', 'friendly']).optional(),
    }),
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
    aiReadinessScore: z.number().min(0).max(100).optional(),
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
      target: z.enum(['Dental', 'HVAC', 'Both']),
      problem: z.string(),
      how: z.string(),
      roiRangeMonthly: z.tuple([z.number(), z.number()]).optional(),
      tags: z.array(z.string()).optional(),
    })),
    case_studies: z.array(z.object({
      skillName: z.string(),
      vertical: z.enum(['Dental', 'HVAC']),
      metric: z.string(),
      timeframe: z.string().optional(),
    })).optional(),
  }),
});

async function callClaude(input: any): Promise<any> {
  const startTime = Date.now();
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a SkillScope brief for the following input. Return ONLY valid JSON per the schema:\n\n${JSON.stringify(input, null, 2)}`
        }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  try {
    const result = JSON.parse(content);
    result.metadata = result.metadata || {};
    result.metadata.processing_time_ms = Date.now() - startTime;
    return result;
  } catch (parseError) {
    console.error('Failed to parse Claude response as JSON:', content);
    return {
      success: false,
      error: { message: "Invalid AI output" },
      metadata: { processing_time_ms: Date.now() - startTime }
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if system prompt is still placeholder
    if (SYSTEM_PROMPT.includes('__PLACEHOLDER__')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "System prompt not installed" }
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "ANTHROPIC_API_KEY not configured" }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validatedInput = SkillScopeInputSchema.parse(body);

    // Generate cache key
    const cacheKey = `${validatedInput.context.auditId}::${validatedInput.skill.name}::${validatedInput.context.settings.currency}`;
    
    // Check cache
    if (cache.has(cacheKey)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(
        JSON.stringify(cache.get(cacheKey)),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate skill exists in KB
    const skillExists = validatedInput.kb.services.some(service => 
      service.name === validatedInput.skill.name && 
      (service.target === validatedInput.context.auditType.charAt(0).toUpperCase() + validatedInput.context.auditType.slice(1) || service.target === 'Both')
    );

    if (!skillExists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Skill not available for this vertical" }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Claude
    const result = await callClaude(validatedInput);
    
    // Cache successful results
    if (result.success) {
      cache.set(cacheKey, result);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('SkillScope generation error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Invalid input", missing: error.errors.map(e => e.path.join('.')) }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || "Internal server error" }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});