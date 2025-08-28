import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { NeedAgentIQInputSchema, NeedAgentIQOutputSchema } from '../_shared/validation.ts';
import { validateKBSlice } from '../_shared/kb.ts';
import type { NeedAgentIQInput, NeedAgentIQOutput, ErrorResponse } from '../_shared/types.ts';

// Configuration (inline for edge function - will be moved to shared config later)
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
    const errorResponse: ErrorResponse = {
      success: false,
      error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
      metadata: { processing_time_ms: Date.now() - startTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const input = NeedAgentIQInputSchema.parse(body);
    
    const { context, audit, moneyLost, kb } = input;
    const cacheKey = getCacheKey(context.auditId, context.sectionId);
    
    logger.info('Processing NeedAgentIQ request', { 
      auditId: context.auditId, 
      sectionId: context.sectionId 
    });
    
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      logger.info('Cache hit', { cacheKey });
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-NeedAgentIQ-Cache': 'HIT'
        }
      });
    }

    // Validate KB slice
    validateKBSlice(kb);

    // Check if system prompt is set
    if (!NEEDAGENTIQ_SYSTEM_PROMPT || NEEDAGENTIQ_SYSTEM_PROMPT.trim() === '') {
      const response: NeedAgentIQOutput = [];
      const processingTime = Date.now() - startTime;
      
      // Cache empty response to avoid repeated calls
      setCache(cacheKey, response, 60000); // 1 minute cache for empty responses
      
      logger.warn('System prompt not installed', { cacheKey });
      
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
    const insights: NeedAgentIQOutput = [];
    const processingTime = Date.now() - startTime;
    
    // Cache the response
    setCache(cacheKey, insights);
    
    logger.info('NeedAgentIQ processed successfully', { 
      auditId: context.auditId, 
      sectionId: context.sectionId,
      processingTime 
    });
    
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
    logger.error('NeedAgentIQ error', { error: error.message });
    
    const processingTime = Date.now() - startTime;
    let errorResponse: ErrorResponse;
    
    if (error.name === 'ZodError') {
      errorResponse = {
        success: false,
        error: { 
          message: 'Invalid input format', 
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        metadata: { processing_time_ms: processingTime }
      };

      return new Response(JSON.stringify(errorResponse), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    errorResponse = {
      success: false,
      error: { 
        message: error.message || 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      metadata: { processing_time_ms: processingTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});