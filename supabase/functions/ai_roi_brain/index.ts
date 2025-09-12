import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { ROIBrainInputSchema, ROIBrainOutputSchema } from '../_shared/validation.ts';
import { extractRelevantKB } from '../_shared/kb/roibrain.ts';
import type { ProcessingMetrics, CacheEntry } from '../_shared/kb/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory L1 Cache (per-instance)
const l1Cache = new Map<string, any>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const MAX_L1_SIZE = 100;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const metrics: ProcessingMetrics = {
    sessionId: crypto.randomUUID(),
    startTime: Date.now(),
    cacheHit: false,
    errors: []
  };

  try {
    // Parse and validate input
    const rawInput = await req.json();
    console.log('ROI Brain input received:', { sessionId: metrics.sessionId, keys: Object.keys(rawInput) });
    
    const input = ROIBrainInputSchema.parse(rawInput);
    input.sessionId = metrics.sessionId;

    // Generate cache key from business context
    const cacheKey = generateCacheKey(input);
    console.log('Generated cache key:', cacheKey);

    // Try L1 Cache first (fastest)
    const l1Result = l1Cache.get(cacheKey);
    if (l1Result && Date.now() - l1Result.timestamp < CACHE_TTL) {
      console.log('L1 Cache hit for:', cacheKey);
      metrics.cacheHit = true;
      metrics.endTime = Date.now();
      
      const response = {
        ...l1Result.data,
        processingTime: metrics.endTime - metrics.startTime,
        cacheHit: true,
        sessionId: metrics.sessionId
      };

      return jsonOk(response);
    }

    // Try L2 Cache (Supabase)
    const l2Result = await checkL2Cache(cacheKey);
    if (l2Result) {
      console.log('L2 Cache hit for:', cacheKey);
      metrics.cacheHit = true;
      metrics.endTime = Date.now();

      // Store in L1 for future requests
      setL1Cache(cacheKey, l2Result);

      const response = {
        ...l2Result,
        processingTime: metrics.endTime - metrics.startTime,
        cacheHit: true,
        sessionId: metrics.sessionId
      };

      return jsonOk(response);
    }

    console.log('Cache miss - generating new response');

    // Extract relevant KB based on business context
    const relevantKB = extractRelevantKB(input);
    console.log('Extracted KB sections:', Object.keys(relevantKB));

    // Call Claude with unified context
    const aiResponse = await callClaude(input, relevantKB, metrics);

    // Validate AI response
    const validatedResponse = ROIBrainOutputSchema.parse({
      success: true,
      sessionId: metrics.sessionId,
      ...aiResponse,
      processingTime: metrics.endTime! - metrics.startTime,
      cacheHit: false
    });

    // Cache the result (both L1 and L2)
    await cacheResult(cacheKey, input, relevantKB, validatedResponse, metrics);

    console.log('ROI Brain response generated:', {
      sessionId: metrics.sessionId,
      processingTime: validatedResponse.processingTime,
      inputTokens: validatedResponse.costs?.inputTokens,
      outputTokens: validatedResponse.costs?.outputTokens
    });

    return jsonOk(validatedResponse);

  } catch (error) {
    console.error('ROI Brain error:', error);
    metrics.errors?.push(error.message);
    
    return jsonError(
      `ROI Brain processing failed: ${error.message}`,
      500,
      { sessionId: metrics.sessionId, errors: metrics.errors }
    );
  }
});

async function callClaude(input: any, kb: any, metrics: ProcessingMetrics) {
  const systemPrompt = buildSystemPrompt(input.vertical, kb);
  const userMessage = buildUserMessage(input);

  console.log('Calling Claude API...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  metrics.endTime = Date.now();

  // Track usage metrics
  metrics.inputTokens = data.usage?.input_tokens || 0;
  metrics.outputTokens = data.usage?.output_tokens || 0;
  metrics.totalCost = calculateCost(metrics.inputTokens, metrics.outputTokens);

  // Parse Claude's response
  const aiContent = data.content[0].text;
  
  try {
    const parsedResponse = JSON.parse(aiContent);
    
    return {
      ...parsedResponse,
      costs: {
        inputTokens: metrics.inputTokens,
        outputTokens: metrics.outputTokens,
        totalCost: metrics.totalCost
      }
    };
  } catch (parseError) {
    console.error('Failed to parse Claude response:', parseError);
    throw new Error('Invalid AI response format');
  }
}

function buildSystemPrompt(vertical: string, kb: any): string {
  return `You are ROI Brain, the central AI orchestrator for AgentIQ's ${vertical} business intelligence system.

Your mission: Generate a comprehensive, ROI-focused business analysis that combines VoiceFit insights, NeedAgentIQ recommendations, and actionable intelligence.

KNOWLEDGE BASE CONTEXT:
${JSON.stringify(kb, null, 2)}

RESPONSE REQUIREMENTS:
1. Analyze the business context holistically
2. Generate VoiceFit report with specific focus on voice AI ROI
3. Include targeted NeedAgentIQ insights where relevant
4. Ensure all recommendations are actionable and ROI-focused
5. Use industry-specific terminology for ${vertical}

OUTPUT FORMAT: Valid JSON matching ROIBrainOutputSchema structure.

CRITICAL: Focus on measurable business outcomes, not just features. Every recommendation must include clear ROI expectations.`;
}

function buildUserMessage(input: any): string {
  return `BUSINESS ANALYSIS REQUEST

Vertical: ${input.vertical.toUpperCase()}

Audit Answers:
${JSON.stringify(input.auditAnswers, null, 2)}

${input.scoreSummary ? `Score Summary:
Overall: ${input.scoreSummary.overall}/100
Section Scores: ${input.scoreSummary.sections.map(s => `${s.name}: ${s.score}/100`).join(', ')}` : ''}

${input.moneylost ? `Money Lost Analysis:
Monthly Loss: $${input.moneylost.monthlyUsd.toLocaleString()}
Annual Loss: $${input.moneylost.annualUsd.toLocaleString()}
Top Loss Areas: ${input.moneylost.areas.slice(0, 3).map(a => a.title).join(', ')}` : ''}

Generate a comprehensive ROI Brain analysis focusing on voice AI opportunities and business outcomes.`;
}

function generateCacheKey(input: any): string {
  // Create deterministic cache key from business context
  const context = {
    vertical: input.vertical,
    answers: input.auditAnswers,
    score: input.scoreSummary?.overall,
    monthlyLoss: input.moneylost?.monthlyUsd
  };
  
  const contextString = JSON.stringify(context, Object.keys(context).sort());
  
  // Create hash of context for cache key
  const encoder = new TextEncoder();
  const data = encoder.encode(contextString);
  return crypto.subtle.digest('SHA-256', data)
    .then(hash => Array.from(new Uint8Array(hash)))
    .then(bytes => bytes.map(b => b.toString(16).padStart(2, '0')).join(''))
    .then(hex => hex.substring(0, 16));
}

async function checkL2Cache(cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('roi_brain_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    return JSON.parse(data.ai_response);
  } catch (error) {
    console.error('L2 Cache check error:', error);
    return null;
  }
}

function setL1Cache(key: string, data: any) {
  // Manage L1 cache size
  if (l1Cache.size >= MAX_L1_SIZE) {
    const firstKey = l1Cache.keys().next().value;
    l1Cache.delete(firstKey);
  }

  l1Cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function cacheResult(cacheKey: string, input: any, kb: any, response: any, metrics: ProcessingMetrics) {
  // Set L1 cache
  setL1Cache(cacheKey, response);

  // Set L2 cache (Supabase)
  try {
    const cacheEntry = {
      cache_key: cacheKey,
      business_context: JSON.stringify(input),
      kb_payload: JSON.stringify(kb),
      ai_response: JSON.stringify(response),
      processing_time: metrics.endTime! - metrics.startTime,
      input_tokens: metrics.inputTokens || 0,
      output_tokens: metrics.outputTokens || 0,
      total_cost: metrics.totalCost || 0,
      expires_at: new Date(Date.now() + CACHE_TTL * 2).toISOString() // L2 cache lasts longer
    };

    await supabase
      .from('roi_brain_cache')
      .upsert(cacheEntry);

  } catch (error) {
    console.error('L2 Cache save error:', error);
    // Don't fail the request for cache errors
  }
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  // Claude 3.5 Sonnet pricing (per 1M tokens)
  const INPUT_COST_PER_1M = 3.00;
  const OUTPUT_COST_PER_1M = 15.00;
  
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;
  
  return inputCost + outputCost;
}

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 500, extra = {}) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}