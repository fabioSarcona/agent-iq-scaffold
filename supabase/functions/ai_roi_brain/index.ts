import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/env.ts'
import { logger as sharedLogger } from '../_shared/logger.ts';
import { normalizeError } from '../_shared/errorUtils.ts';
import { diagWrap } from "../_shared/diag.ts";
import type { 
  BusinessContext,
  VoiceFitOutput,
  SkillScopeOutput,
  MoneyLostOutput,
  NeedAgentIQInsight,
  ErrorResponse,
  SuccessMetadata
} from '../_shared/types.ts';

// ============= MINIMAL STANDALONE IMPLEMENTATION =============

// Initialize Supabase for L2 cache
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AI Model Configuration
const MODEL_NAME = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8000;

// Inlined Types
interface BusinessContextNormalized {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary: {
    overall: number;
    sections: Array<{ sectionId?: string; name?: string; score: number }>;
  };
  moneyLostSummary: {
    total: { dailyUsd: number; monthlyUsd: number; annualUsd: number };
    areas: Array<{
      key: string;
      title: string;
      dailyUsd: number;
      monthlyUsd: number;
      annualUsd: number;
      recoverablePctRange: { min: number; max: number };
      rationale: string[];
    }>;
  };
}

interface BusinessIntelligence {
  businessSize: 'small' | 'medium' | 'large';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryPainPoints: string[];
  technicalReadiness: number;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

// Simple logger
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || '')
};

// Input validation (simplified)
function validateInput(rawInput: any): boolean {
  return rawInput && typeof rawInput === 'object' && 
         typeof rawInput.vertical === 'string' &&
         typeof rawInput.auditAnswers === 'object';
}

// Normalize input data
function normalizeInput(rawInput: any): BusinessContextNormalized {
  const vertical = rawInput.vertical || 'dental';
  const auditAnswers = rawInput.auditAnswers || {};
  
  const scoreSummary = {
    overall: rawInput.scoreSummary?.overall || 50,
    sections: rawInput.scoreSummary?.sections || []
  };
  
  // Create default sections if none exist
  if (scoreSummary.sections.length === 0) {
    scoreSummary.sections = vertical === 'dental' 
      ? [
          { sectionId: 'patient_communication', name: 'Patient Communication', score: 50 },
          { sectionId: 'appointment_management', name: 'Appointment Management', score: 50 }
        ]
      : [
          { sectionId: 'customer_service', name: 'Customer Service', score: 50 },
          { sectionId: 'scheduling', name: 'Scheduling', score: 50 }
        ];
  }
  
  // Default money lost data
  const moneyLostSummary = rawInput.moneyLostSummary || {
    total: { dailyUsd: 1000, monthlyUsd: 30000, annualUsd: 360000 },
    areas: [
      {
        key: 'missed_calls',
        title: 'Missed Calls',
        dailyUsd: 500,
        monthlyUsd: 15000,
        annualUsd: 180000,
        recoverablePctRange: { min: 70, max: 90 },
        rationale: ['Poor call handling leads to lost opportunities']
      }
    ]
  };
  
  return { vertical, auditAnswers, scoreSummary, moneyLostSummary };
}

// Extract business intelligence
function extractBusinessContext(context: BusinessContextNormalized): BusinessIntelligence {
  const { vertical, auditAnswers, scoreSummary, moneyLostSummary } = context;
  
  // Business Size Detection
  let businessSize: 'small' | 'medium' | 'large' = 'medium';
  if (vertical === 'dental') {
    const chairs = String(auditAnswers?.['dental_chairs_active_choice'] ?? '3_4');
    businessSize = chairs === '1_2' ? 'small' : chairs === '5_8' ? 'large' : 'medium';
  } else {
    const techs = String(auditAnswers?.['field_technicians_count_choice'] ?? '3_5');
    businessSize = techs === '1_2' ? 'small' : techs === '6_10' ? 'large' : 'medium';
  }

  // Urgency Level
  const monthlyLoss = moneyLostSummary?.total?.monthlyUsd ?? 30000;
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (monthlyLoss > 50000) urgencyLevel = 'critical';
  else if (monthlyLoss > 25000) urgencyLevel = 'high';
  else if (monthlyLoss > 10000) urgencyLevel = 'medium';

  // Primary Pain Points
  const areas = moneyLostSummary?.areas ?? [];
  const primaryPainPoints = areas
    .sort((a, b) => (b?.monthlyUsd ?? 0) - (a?.monthlyUsd ?? 0))
    .slice(0, 3)
    .map(area => area?.key ?? 'operational_efficiency')
    .filter(Boolean);
  
  if (primaryPainPoints.length === 0) {
    primaryPainPoints.push('operational_efficiency');
  }

  const technicalReadiness = Math.max(0, Math.min(100, scoreSummary?.overall ?? 50));

  let implementationComplexity: 'simple' | 'moderate' | 'complex' = 'moderate';
  if (businessSize === 'small' && technicalReadiness > 70) implementationComplexity = 'simple';
  else if (businessSize === 'large' || technicalReadiness < 40) implementationComplexity = 'complex';

  return {
    businessSize,
    urgencyLevel,
    primaryPainPoints,
    technicalReadiness,
    implementationComplexity
  };
}

// Generate cache key
async function generateCacheKey(context: BusinessContextNormalized): Promise<string> {
  const keyData = JSON.stringify({
    vertical: context.vertical,
    auditAnswers: context.auditAnswers,
    score: context.scoreSummary.overall,
    monthlyLoss: context.moneyLostSummary.total.monthlyUsd
  });
  
  const encoder = new TextEncoder();
  const data = encoder.encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// L2 Cache Functions
async function readL2Cache(cacheKey: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('roi_brain_cache')
      .select('ai_response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    return error ? null : data?.ai_response;
  } catch {
    return null;
  }
}

async function storeL2Cache(cacheKey: string, value: any): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase.from('roi_brain_cache').insert({
      cache_key: cacheKey,
      business_context: {},
      kb_payload: {},
      ai_response: value,
      processing_time: value.processingTime || 0,
      input_tokens: 0,
      output_tokens: 0,
      total_cost: 0,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    logger.warn('Cache store failed', error);
  }
}

// Build prompt for AI
function buildPrompt(context: BusinessContextNormalized, intelligence: BusinessIntelligence): string {
  return `Analyze this ${context.vertical} business and provide actionable insights.

Business Context:
- Vertical: ${context.vertical}
- Business Size: ${intelligence.businessSize}
- Technical Readiness: ${intelligence.technicalReadiness}%
- Monthly Loss: $${context.moneyLostSummary.total.monthlyUsd.toLocaleString()}
- Primary Issues: ${intelligence.primaryPainPoints.join(', ')}

Provide response in JSON format with these fields:
{
  "score": number (0-100),
  "band": "string (Beginner/Intermediate/Advanced/Expert)",
  "diagnosis": ["array of 3-5 key findings"],
  "consequences": ["array of 3-5 business impacts"],
  "solutions": [{"title": "string", "description": "string", "impact": "string", "effort": "string"}],
  "benchmark": {"note": "string", "range": {"min": number, "max": number}},
  "faq": [{"question": "string", "answer": "string"}],
  "plan": {"phases": [{"title": "string", "duration": "string", "tasks": ["array"]}]},
  "skillScopeContext": {"summary": "string", "keyMetrics": {}},
  "aiInsights": {"summary": "string", "recommendations": ["array"]}
}`;
}

// Parse JSON from AI response
function extractJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No valid JSON found in response');
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const startTime = Date.now();
    logger.info('ROI Brain function started - Minimal Implementation');
    
    const rawInput = await req.json();
    
    // Validate input
    if (!validateInput(rawInput)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input format',
        hint: 'Provide vertical and auditAnswers fields'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize and analyze
    const normalizedContext = normalizeInput(rawInput);
    const intelligence = extractBusinessContext(normalizedContext);
    
    logger.info('Context analyzed', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel
    });
    
    // Check cache
    const cacheKey = await generateCacheKey(normalizedContext);
    let result = await readL2Cache(cacheKey);
    
    // Build prompt for potential AI call or debug info
    const prompt = buildPrompt(normalizedContext, intelligence);
    
    if (!result) {
      logger.info('Cache miss - calling AI');
      
      // Call Claude API
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!claudeResponse.ok) {
        throw new Error(`Claude API error: ${claudeResponse.statusText}`);
      }

      const claudeData = await claudeResponse.json();
      const aiContent = claudeData.content[0]?.text;

      if (!aiContent) {
        throw new Error('No content from Claude API');
      }

      // Parse AI response
      const parsedContent = extractJSON(aiContent);
      
      // Create result structure
      result = {
        success: true,
        voiceFitReport: parsedContent,
        needAgentIQInsights: {
          summary: parsedContent.aiInsights?.summary || 'AI analysis completed',
          recommendations: parsedContent.aiInsights?.recommendations || []
        },
        skillScopeContext: parsedContent.skillScopeContext || {},
        businessIntelligence: intelligence,
        processingMetrics: {
          totalTime: Date.now() - startTime,
          cacheHit: false,
          inputTokens: claudeData.usage?.input_tokens || 0,
          outputTokens: claudeData.usage?.output_tokens || 0
        },
        consistency: {
          dataQualityScore: 85,
          overallSuccess: true,
          parts: {
            iq: { status: 'success', message: 'Generated successfully' },
            report: { status: 'success', message: 'Generated successfully' },
            skills: { status: 'success', message: 'Generated successfully' }
          }
        }
      };
      
      // Store in cache
      await storeL2Cache(cacheKey, result);
    } else {
      logger.info('Cache hit');
      result.processingMetrics = {
        ...result.processingMetrics,
        totalTime: Date.now() - startTime,
        cacheHit: true
      };
    }

    logger.info('ROI Brain completed', {
      processingTime: Date.now() - startTime,
      cacheHit: !!result.processingMetrics?.cacheHit
    });

    const jsonOk = (data: any) => new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
    return jsonOk(diagWrap({ ok: true, result }, { promptSent: prompt?.slice?.(0, 4000) || prompt }));

  } catch (error) {
    logger.error('ROI Brain function error', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error', 
      message: normalizeError(error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});