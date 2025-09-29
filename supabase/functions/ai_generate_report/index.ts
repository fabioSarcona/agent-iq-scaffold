import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Shared modules
import { validateAIEnv, checkAIEnv, corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { VoiceFitInputSchema, VoiceFitOutputSchema } from '../_shared/validation.ts';
import { validateKBSlice } from '../_shared/kb.ts';
import type { VoiceFitInput, VoiceFitOutput, ErrorResponse } from '../_shared/types.ts';

// Robust JSON parsing utilities
function stripCodeFence(content: string): string {
  return content.replace(/^```(?:json)?\s*/i, '').replace(/```$/,'').trim();
}

function tryParseLooseJson(content: string): any {
  try { 
    return JSON.parse(content); 
  } catch {
    // Remove trailing commas and try again
    const cleaned = content.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned);
  }
}

// Environment variables validation and system prompt loading
const SYSTEM_PROMPT = Deno.env.get('VOICEFIT_SYSTEM_PROMPT');
const AI_MODEL = Deno.env.get('AI_MODEL') || 'claude-sonnet-4-20250514';

if (!SYSTEM_PROMPT || SYSTEM_PROMPT.length < 2000) {
  logger.error('VoiceFit SYSTEM_PROMPT environment variable missing or too short');
  throw new Error('VOICEFIT_SYSTEM_PROMPT_NOT_SET');
}

logger.info('VoiceFit system prompt loaded from environment', { length: SYSTEM_PROMPT.length });

// Cache for KB data
let kbCache: { approved_claims: string[], services: any[] } | null = null;
let kbCacheTimestamp = 0;
const KB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Response cache
const responseCache = new Map<string, { data: any; timestamp: number }>();
const RESPONSE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getCachedKB(): Promise<{ approved_claims: string[], services: any[] }> {
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
    
    logger.info('VoiceFit KB cache refreshed', { 
      claims: kbCache.approved_claims.length, 
      services: kbCache.services.length 
    });
    
    return kbCache;
  } catch (error) {
    logger.error('Failed to load VoiceFit KB data', { error: error.message });
    return { approved_claims: [], services: [] };
  }
}

function buildLLMInput({ 
  vertical, 
  answers, 
  scoreSummary, 
  moneylost, 
  benchmarks,
  kb,
  language = 'en' // Add language parameter with default
}: {
  vertical: string;
  answers: Record<string, unknown>;
  scoreSummary?: any;
  moneylost?: any;
  benchmarks?: string[];
  kb: { approved_claims: string[], services: any[] };
  language?: string; // Make language optional
}): VoiceFitInput {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert answers to audit responses format
  const responses = Object.entries(answers).map(([key, value], index) => ({
    id: `q_${index}`,
    key,
    value,
    section: key.includes('daily_unanswered') ? 'calls' : 
             key.includes('no_shows') ? 'appointments' : 
             key.includes('treatment_plan') ? 'treatment' : 'general'
  }));

  // Convert moneylost to required format
  const moneyLostItems = moneylost?.areas?.map((area: any) => ({
    area: area.title || area.id,
    assumptions: area.notes ? [area.notes] : [],
    formula: `${area.dailyUsd} * workdays_per_month`,
    resultMonthly: area.monthlyUsd || 0,
    confidence: area.confidence === 'high' ? 90 : area.confidence === 'medium' ? 70 : 50
  })) || [];

  // Generate insights from top loss areas
  const insights = moneylost?.areas?.slice(0, 3).map((area: any, index: number) => ({
    key: `insight_${index}`,
    area: area.title || area.id,
    problem: `Revenue leakage identified in ${area.title?.toLowerCase() || area.id}`,
    impactMonthly: area.monthlyUsd || 0,
    recommendations: [`Implement AI automation for ${area.title?.toLowerCase() || area.id}`],
    confidence: area.confidence === 'high' ? 90 : area.confidence === 'medium' ? 70 : 50
  })) || [];

  return {
    context: {
      auditId,
      auditType: vertical as "dental" | "hvac",
      business: {
        name: String(answers.business_name || "Business"),
        location: String(answers.location || "Unknown"),
        size: {
          chairs: typeof answers.chairs === 'number' ? answers.chairs : undefined,
          techs: typeof answers.techs === 'number' ? answers.techs : undefined
        }
      },
      settings: {
        currency: "USD",
        locale: "en-US",
        preferredPlan: undefined,
        maxSkills: 6
      }
    },
    audit: {
      responses,
      sectionScores: scoreSummary?.sectionScores,
      aiReadinessScore: scoreSummary?.overallScore
    },
    moneyLost: {
      items: moneyLostItems,
      totalMonthly: moneylost?.monthlyUsd || 0
    },
    insights,
    kb,
    history: {
      previousInsightsKeys: [],
      previousReports: []
    }
  };
}

async function callClaude(systemPrompt: string, llmInput: VoiceFitInput, language: string = 'en'): Promise<VoiceFitOutput> {
  // PLAN D: Use non-throwing validation for structured error handling
  const envCheck = checkAIEnv();
  if (!envCheck.success) {
    throw new Error(envCheck.error.message);
  }
  const env = envCheck.config;
  const startTime = Date.now();
  
  // Add language instructions to system prompt
  const languageAwarePrompt = `${systemPrompt}

LANGUAGE INSTRUCTIONS:
- Respond in ${language === 'it' ? 'Italian' : 'English'}
- Use professional ${language === 'it' ? 'Italian' : 'English'} terminology appropriate for business contexts
- Maintain the same JSON structure regardless of language
- All text content (titles, descriptions, recommendations) should be in ${language === 'it' ? 'Italian' : 'English'}

`;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate a VoiceFit Report based on this data. Respond ONLY with valid JSON matching the LLMOutputSchema:\n\n${JSON.stringify(llmInput, null, 2)}`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const result = await response.json();
  const content = result.content?.[0]?.text;

  if (!content) {
    throw new Error('No content received from Claude');
  }

  try {
    const cleanContent = stripCodeFence(content);
    const parsed = tryParseLooseJson(cleanContent);
    return VoiceFitOutputSchema.parse(parsed);
  } catch (parseError) {
    logger.error('LLM Output validation failed', { 
      error: parseError.message, 
      content: content.substring(0, 500),
      cleanedContent: stripCodeFence(content).substring(0, 500)
    });
    throw new Error(`LLM validation failed: ${parseError.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const request = await req.json();
    logger.info('Processing VoiceFit report request', { vertical: request.vertical });

    // Load KB data
    const kb = await getCachedKB();

    // Build LLM input from request format  
    const llmInput = buildLLMInput({ ...request, kb });
    
    // Extract language from request (prepare for multilingual support)
    const language = request.language || 'en';
    
    // Validate input
    const validatedInput = VoiceFitInputSchema.parse(llmInput);
    
    // Check response cache
    const cacheKey = JSON.stringify(validatedInput);
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < RESPONSE_CACHE_TTL) {
      logger.info('Cache hit for VoiceFit');
      return new Response(JSON.stringify(cached.data), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time': `${Date.now() - startTime}ms`,
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Call Claude with system prompt
    const llmOutput = await callClaude(SYSTEM_PROMPT, validatedInput, language);
    
    // Cache successful response
    responseCache.set(cacheKey, { data: llmOutput, timestamp: Date.now() });
    
    const processingTime = Date.now() - startTime;
    logger.info('Report generated successfully', { processingTime });

    return new Response(JSON.stringify(llmOutput), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime}ms`,
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    logger.error('Error generating VoiceFit report', { 
      error: error.message,
      stack: error.stack,
      timeoutOccurred: error.message?.includes('timeout')
    });
    
    const processingTime = Date.now() - startTime;
    
    // PLAN D: Enhanced error response structure with specific codes
    let errorCode = 'INTERNAL_ERROR';
    let httpStatus = 500;
    
    if (error.name === 'ZodError') {
      errorCode = 'VALIDATION_ERROR';
      httpStatus = 422;
    } else if (error.message?.includes('ANTHROPIC_API_KEY')) {
      errorCode = 'MISSING_API_KEY';
      httpStatus = 503; // Service Unavailable
    } else if (error.message?.includes('validation')) {
      errorCode = 'VALIDATION_ERROR';
      httpStatus = 422;
    } else if (error.message?.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';  
      httpStatus = 408; // Request Timeout
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: error.message || 'Unknown error occurred',
        code: errorCode
      },
      metadata: {
        processing_time_ms: processingTime,
        warnings: [`Processing failed: ${error.message}`],
        // PLAN D: Add diagnostic information for frontend
        diagnostic: {
          errorType: error.name,
          timeoutOccurred: error.message?.includes('timeout'),
          apiKeyConfigured: !!Deno.env.get('ANTHROPIC_API_KEY')
        }
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});