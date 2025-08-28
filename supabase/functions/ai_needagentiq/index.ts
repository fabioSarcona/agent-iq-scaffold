import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

// Configuration (inline for edge function)
const NEEDAGENTIQ_MODEL = "claude-3.7-sonnet" as const;
const NEEDAGENTIQ_PARAMS = {
  temperature: 0.2,
  maxTokens: 1200,
  retry: {
    attempts: 2,
    backoffMs: 300
  }
} as const;
const NEEDAGENTIQ_SYSTEM_PROMPT = ""; // <-- will be injected later via a separate prompt
const NEEDAGENTIQ_TIMEOUT_MS = 1200;

// Validation schema (inline for edge function)
const NeedAgentIQInputSchema = z.object({
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCacheKey(auditId: string, sectionId: string): string {
  return `${auditId}::${sectionId}`;
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.timestamp + entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any, ttlMs: number = 300000): void { // 5min default
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' } }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const input = NeedAgentIQInputSchema.parse(body);
    
    const { context, audit, moneyLost, kb } = input;
    const cacheKey = getCacheKey(context.auditId, context.sectionId);
    
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-NeedAgentIQ-Cache': 'HIT'
        }
      });
    }

    // Check if system prompt is set
    if (!NEEDAGENTIQ_SYSTEM_PROMPT || NEEDAGENTIQ_SYSTEM_PROMPT.trim() === '') {
      const response = [];
      const processingTime = Date.now() - startTime;
      
      // Cache empty response to avoid repeated calls
      setCache(cacheKey, response, 60000); // 1 minute cache for empty responses
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-NeedAgentIQ-Warning': 'SYSTEM_PROMPT_NOT_SET',
          'X-Processing-Time-Ms': processingTime.toString()
        }
      });
    }

    // TODO: In a future prompt, we'll implement the actual LLM call here
    // For now, return empty insights array as stub
    const insights = [];
    const processingTime = Date.now() - startTime;
    
    // Cache the response
    setCache(cacheKey, insights);
    
    console.log(`NeedAgentIQ processed for audit ${context.auditId}, section ${context.sectionId} in ${processingTime}ms`);
    
    return new Response(JSON.stringify(insights), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time-Ms': processingTime.toString(),
        'X-NeedAgentIQ-Status': 'STUBBED'
      }
    });

  } catch (error) {
    console.error('NeedAgentIQ error:', error);
    
    const processingTime = Date.now() - startTime;
    
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({
          error: { 
            message: 'Invalid input format', 
            code: 'VALIDATION_ERROR',
            details: error.errors 
          }
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Processing-Time-Ms': processingTime.toString()
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: { 
          message: error.message || 'Internal server error', 
          code: 'INTERNAL_ERROR' 
        }
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time-Ms': processingTime.toString()
        }
      }
    );
  }
});