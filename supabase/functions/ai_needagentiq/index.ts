import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import configuration (will be available when deployed)
import { 
  NEEDAGENTIQ_MODEL,
  NEEDAGENTIQ_PARAMS,
  NEEDAGENTIQ_SYSTEM_PROMPT,
  NEEDAGENTIQ_TIMEOUT_MS
} from '../../../modules/ai/needagentiq/model-config.ts';

// Import validation schemas
import { NeedAgentIQInputSchema } from '../../../modules/ai/needagentiq/types.ts';

// Import KB access
import knowledgeBase from '../../../src/kb/index.ts';

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