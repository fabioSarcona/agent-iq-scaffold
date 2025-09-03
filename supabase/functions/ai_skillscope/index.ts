import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAIEnv, corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { SkillScopeInputSchema, SkillScopeOutputSchema } from '../_shared/validation.ts';
import { validateKBSlice } from '../_shared/kb.ts';
import type { SkillScopeInput, SkillScopeOutput, ErrorResponse } from '../_shared/types.ts';

// Environment variables validation and system prompt loading
const SYSTEM_PROMPT = Deno.env.get('SKILLSCOPE_SYSTEM_PROMPT');
const AI_MODEL = Deno.env.get('AI_MODEL') || 'claude-sonnet-4-20250514';

if (!SYSTEM_PROMPT || SYSTEM_PROMPT.length < 2000) {
  logger.error('SkillScope SYSTEM_PROMPT environment variable missing or too short');
  throw new Error('SKILLSCOPE_SYSTEM_PROMPT_NOT_SET');
}

logger.info('SkillScope system prompt loaded from environment', { length: SYSTEM_PROMPT.length });

// Cache for KB data
let kbCache: { approved_claims: string[], services: any[] } | null = null;
let kbCacheTimestamp = 0;
const KB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    
    logger.info('SkillScope KB cache refreshed', { 
      claims: kbCache.approved_claims.length, 
      services: kbCache.services.length 
    });
    
    return kbCache;
  } catch (error) {
    logger.error('Failed to load SkillScope KB data', { error: error.message });
    throw new Error('KB_LOAD_FAILED');
  }
}

async function callClaude(input: SkillScopeInput): Promise<SkillScopeOutput> {
  const startTime = Date.now();
  
  try {
    const env = validateAIEnv();
    
    // Build system prompt with dynamic KB data
    const kb = await getCachedKB();
    const systemPrompt = `${SYSTEM_PROMPT}

=== KNOWLEDGE BASE ===
Approved Claims: ${JSON.stringify(kb.approved_claims, null, 2)}
Services: ${JSON.stringify(kb.services, null, 2)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_completion_tokens: 1800,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: JSON.stringify(input, null, 2)
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('Claude API error', { 
        status: response.status, 
        error: errorData,
        model: AI_MODEL
      });
      
      return {
        success: false,
        error: { message: `Claude API error: ${response.status}` }
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      logger.error('No content in Claude response', { data });
      return {
        success: false,
        error: { message: 'No content generated' }
      };
    }

    // Parse and validate the JSON response
    let result: SkillScopeOutput;
    try {
      const jsonContent = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0].trim()
        : content.trim();
      
      const parsed = JSON.parse(jsonContent);
      result = SkillScopeOutputSchema.parse(parsed);
      
      if (result.success && result.metadata) {
        result.metadata.processing_time_ms = Date.now() - startTime;
      }
      
    } catch (parseError) {
      logger.error('Failed to parse Claude response', { 
        error: parseError.message, 
        content: content.substring(0, 500) 
      });
      
      return {
        success: false,
        error: { message: 'Invalid JSON response from AI' }
      };
    }

    logger.info('SkillScope generated successfully', { 
      processing_time: Date.now() - startTime,
      success: result.success 
    });
    
    return result;

  } catch (error) {
    logger.error('Claude call failed', { error: error.message });
    return {
      success: false,
      error: { message: 'AI processing failed' }
    };
  }
}

// Response cache
const responseCache = new Map<string, { data: any; timestamp: number }>();
const RESPONSE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Validate environment
    validateAIEnv();
    
    // Parse and validate input
    let input: SkillScopeInput;
    try {
      const body = await req.json();
      input = SkillScopeInputSchema.parse(body);
    } catch (error) {
      logger.error('Input validation failed', { error: error.message });
      const errorResponse: ErrorResponse = {
        success: false,
        error: { message: 'Invalid input data' }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate KB data
    try {
      validateKBSlice(input.kb);
    } catch (error) {
      logger.error('KB validation failed', { error: error.message });
      const errorResponse: ErrorResponse = {
        success: false,
        error: { message: 'Invalid knowledge base data' }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check response cache
    const cacheKey = JSON.stringify(input);
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < RESPONSE_CACHE_TTL) {
      logger.info('Cache hit for SkillScope');
      return new Response(JSON.stringify(cached.data), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time': `${Date.now() - startTime}ms`,
          'X-Cache': 'HIT'
        }
      });
    }

    // Generate SkillScope
    const result = await callClaude(input);
    
    // Cache successful results
    if (result.success) {
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    logger.info('SkillScope request completed', { 
      processing_time: Date.now() - startTime,
      success: result.success,
      cached: false
    });

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${Date.now() - startTime}ms`,
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    logger.error('SkillScope request failed', { error: error.message });
    const errorResponse: ErrorResponse = {
      success: false,
      error: { message: 'Internal server error' }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});