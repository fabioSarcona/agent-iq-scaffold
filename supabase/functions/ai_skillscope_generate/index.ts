import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Shared modules
import { validateAIEnv, corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { SkillScopeInputSchema, SkillScopeOutputSchema } from '../_shared/validation.ts';
import { validateSkillForVertical } from '../_shared/kb.ts';
import type { SkillScopeInput, SkillScopeOutput, ErrorResponse } from '../_shared/types.ts';

// Load system prompt at module level
let SYSTEM_PROMPT: string;
try {
  SYSTEM_PROMPT = await Deno.readTextFile(new URL("./system/skillscope.system.md", import.meta.url));
  logger.info('SkillScope system prompt loaded', { length: SYSTEM_PROMPT.length });
} catch (error) {
  logger.error('Failed to load SkillScope system prompt', { error: error.message });
  SYSTEM_PROMPT = "__PLACEHOLDER__";
}

// Simple in-memory cache  
const cache = new Map<string, any>();

async function callClaude(input: SkillScopeInput): Promise<SkillScopeOutput> {
  const env = validateAIEnv();
  const startTime = Date.now();
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
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
    return SkillScopeOutputSchema.parse(result);
  } catch (parseError) {
    logger.error('Failed to parse Claude response as JSON', { 
      error: parseError.message,
      content: content.substring(0, 500)
    });
    return {
      success: false,
      error: { message: "Invalid AI output" },
      metadata: { 
        processing_time_ms: Date.now() - startTime,
        data_quality: 'low' as const,
        warnings: ['AI response parsing failed']
      }
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Check if system prompt is still placeholder
    if (SYSTEM_PROMPT.includes('__PLACEHOLDER__')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: { message: "System prompt not installed", code: 'SYSTEM_PROMPT_NOT_SET' },
        metadata: { processing_time_ms: Date.now() - startTime }
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate environment
    validateAIEnv();

    // Parse and validate input
    const body = await req.json();
    const validatedInput = SkillScopeInputSchema.parse(body);

    logger.info('Processing SkillScope request', { 
      auditId: validatedInput.context.auditId,
      skillName: validatedInput.skill.name 
    });

    // Generate cache key
    const cacheKey = `${validatedInput.context.auditId}::${validatedInput.skill.name}::${validatedInput.context.settings.currency}`;
    
    // Check cache
    if (cache.has(cacheKey)) {
      logger.info('Cache hit', { cacheKey });
      return new Response(
        JSON.stringify(cache.get(cacheKey)),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        }
      );
    }

    // Validate skill exists in KB for the vertical
    if (!validateSkillForVertical(validatedInput.kb, validatedInput.skill.name, validatedInput.context.auditType)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: { 
          message: "Skill not available for this vertical", 
          code: 'SKILL_NOT_FOUND' 
        },
        metadata: { processing_time_ms: Date.now() - startTime }
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Claude
    const result = await callClaude(validatedInput);
    
    // Cache successful results
    if (result.success) {
      cache.set(cacheKey, result);
    }

    const processingTime = Date.now() - startTime;
    logger.info('SkillScope generated successfully', { processingTime });

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Processing-Time': `${processingTime}ms`
      }
    });

  } catch (error) {
    logger.error('SkillScope generation error', { error: error.message });
    
    const processingTime = Date.now() - startTime;
    let errorResponse: ErrorResponse;

    if (error.name === 'ZodError') {
      errorResponse = {
        success: false,
        error: { 
          message: "Invalid input", 
          code: 'VALIDATION_ERROR',
          missing: error.errors.map((e: any) => e.path.join('.')) 
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
        message: error.message || "Internal server error", 
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