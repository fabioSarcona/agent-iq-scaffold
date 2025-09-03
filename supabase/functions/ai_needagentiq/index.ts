import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { NeedAgentIQInputSchema, NeedAgentIQOutputSchema } from '../_shared/validation.ts';
import type { NeedAgentIQInput, NeedAgentIQOutput, ErrorResponse } from '../_shared/types.ts';

// Configuration
const NEEDAGENTIQ_MODEL = "claude-sonnet-4-20250514" as const;
const NEEDAGENTIQ_PARAMS = {
  maxCompletionTokens: 1800,
  retry: {
    attempts: 2,
    backoffMs: 300
  }
} as const;
const NEEDAGENTIQ_TIMEOUT_MS = 1200;

// Cache for KB data
let kbCache: { approved_claims: string[], services: any[] } | null = null;
let kbCacheTimestamp = 0;
const KB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Response cache
const responseCache = new Map<string, { data: any; timestamp: number }>();
const RESPONSE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getCachedKB() {
  const now = Date.now();
  if (kbCache && (now - kbCacheTimestamp) < KB_CACHE_TTL) {
    return kbCache;
  }

  try {
    const [claimsText, servicesText] = await Promise.all([
      Deno.readTextFile(new URL('./kb/approved_claims.json', import.meta.url)),
      Deno.readTextFile(new URL('./kb/services.json', import.meta.url))
    ]);
    
    kbCache = {
      approved_claims: JSON.parse(claimsText),
      services: JSON.parse(servicesText)
    };
    kbCacheTimestamp = now;
    
    logger.info('NeedAgentIQ KB cache refreshed', { 
      claims: kbCache.approved_claims.length, 
      services: kbCache.services.length 
    });
    
    return kbCache;
  } catch (error) {
    logger.error('Failed to load NeedAgentIQ KB data', { error: error.message });
    return { approved_claims: [], services: [] };
  }
}

function getCacheKey(auditId: string, sectionId: string): string {
  return `${auditId}::${sectionId}`;
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT Authentication Check
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return new Response('Unauthorized', { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const sb = createClient(supabaseUrl, supabaseAnonKey, { 
    global: { headers: { Authorization: auth } } 
  });

  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) {
    return new Response('Unauthorized', { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
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
    
    const { context, audit, moneyLost } = input;
    const cacheKey = getCacheKey(context.auditId, context.sectionId);
    
    logger.info('Processing NeedAgentIQ request', { 
      auditId: context.auditId, 
      sectionId: context.sectionId 
    });
    
    // Check response cache first
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < RESPONSE_CACHE_TTL) {
      logger.info('NeedAgentIQ cache hit', { cacheKey });
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-NeedAgentIQ-Cache': 'HIT'
        }
      });
    }

    // Load KB data from local files
    const kb = await getCachedKB();

    // Load system prompt from environment
    const systemPrompt = Deno.env.get('NEEDAGENT_IQ_SYSTEM_PROMPT');
    if (!systemPrompt) {
      throw new Error('NEEDAGENT_IQ_SYSTEM_PROMPT environment variable not found');
    }

    // Load Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable not found');
    }

    // Build enhanced input with KB data
    const enhancedInput = {
      ...input,
      kb
    };

    // Call Anthropic API
    let insights: NeedAgentIQOutput = [];
    
    try {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: NEEDAGENTIQ_MODEL,
          max_completion_tokens: NEEDAGENTIQ_PARAMS.maxCompletionTokens,
          messages: [
            {
              role: 'user',
              content: JSON.stringify(enhancedInput)
            }
          ],
          system: systemPrompt
        })
      });

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        logger.error('Anthropic API error', { 
          status: anthropicResponse.status,
          error: errorText 
        });
        throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      const content = anthropicData.content?.[0]?.text;
      
      if (content) {
        try {
          insights = JSON.parse(content);
          // Validate output
          NeedAgentIQOutputSchema.parse(insights);
        } catch (parseError) {
          logger.error('Failed to parse LLM response', { content, parseError });
          insights = []; // Fallback to empty array
        }
      }
    } catch (llmError) {
      logger.error('LLM processing failed', { error: llmError.message });
      insights = []; // Fallback to empty array on LLM errors
    }

    const processingTime = Date.now() - startTime;
    
    // Cache the response
    responseCache.set(cacheKey, { data: insights, timestamp: Date.now() });
    
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
        'X-NeedAgentIQ-Status': 'ACTIVE'
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