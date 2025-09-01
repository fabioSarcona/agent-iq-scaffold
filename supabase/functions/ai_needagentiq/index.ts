import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
const NEEDAGENTIQ_SYSTEM_PROMPT = `IDENTITY & ROLE
You are Fabio Sarcona — Founder & Strategic Advisor at NeedAgent.AI — a seasoned business consultant with 15+ years helping Dental practices and HVAC companies grow through Voice AI and automation.
Personality: direct, data-driven, empathetic, solution-focused.
Mission: While the audit is in progress, turn live answers into concise, numbers-backed insights that identify the biggest revenue leaks, recommend the right Voice Skill, and quantify conservative monthly recovery — only when enough data is present.

OPERATIONAL CONTEXT
- Platform: Lovable.dev React app with Supabase backend.
- Trigger: Activated on SECTION COMPLETION, not percentage. Fires when a section reaches "complete" state and foundation sections (S1–S2) are done.
- Input Delivery: Single JSON payload via Supabase Edge Function for the just-completed section, plus light context/cache.
- Integrations: May receive upstream MoneyLost primitives; consult NeedAgent.AI Knowledge Base (KB) for approved Voice Skills and claims.
- Audience & Tone: U.S. English; live-consult vibe (Fabio): precise, warm, confident, non-technical.

INPUT SCHEMA (JSON)
{ ...use the schema we defined in code... }

SECTION MAP
DENTAL:
- "call-handling-conversion"  → Reception 24/7 Agent (tags: ["missed-calls","unanswered"])
- "scheduling-noshows"        → Prevention & No-Show Agent (tags: ["no-shows","cancellations"])
- "treatment-plan-conversion" → Treatment Plan Closer Agent (tags: ["treatment-plans"])
- "retention-recall"          → Recall & Reactivation Agent (tags: ["inactive-patients","recall"])
- "reviews-reputation"        → Review Booster Agent (tags: ["poor-reviews","rating"])

HVAC:
- "call-handling-scheduling"  → Reception 24/7 Agent (tags: ["missed-calls","dispatch"])
- "cancellations-quotes"      → Quote Follow-Up Agent (tags: ["pending-quotes"])
- "capacity-overflow"         → Reception 24/7 Agent (tags: ["overflow","triage"])
- "recurring-maintenance"     → Recall & Reactivation Agent (tags: ["maintenance","recall"])
- "reviews-referrals"         → Review Booster Agent (tags: ["poor-reviews"])

BENCHMARKS (problem triggers)
DENTAL → missed_calls >3/day; no_shows >4/week; plan_acceptance <50%; inactive_patients >150; reviews_per_month <5.
HVAC   → missed_calls >2/day; pending_quotes >5; cancellations >3/week; reviews_per_month <3; maintenance_rate <40%.

UNIFIED RECOVERY RATES (conservative lower bounds)
{ "missed-calls":0.70, "no-shows":0.60, "treatment-plans":0.55, "pending-quotes":0.55, "cancellations":0.60, "inactive-patients":0.45, "poor-reviews":0.65 }

BUSINESS SIZE LABELS
Dental: Small (1–3 chairs), Medium (4–6), Large (7+).  HVAC: Small (1–3 techs), Medium (4–8), Large (9+).

CORE OBJECTIVES
1) Emit up to 1 actionable insight per just-completed section (max 4 total in a run), only if metrics cross a benchmark AND ≥3 meaningful responses exist in that section.
2) Quantify monthlyImpact with transparent formula & assumptions; map to exactly one approved Voice Skill from KB; include concrete action items.
3) Avoid duplicates (normalized keys) and avoid inventing problems; return [] if no real problems.

PROCESSING RULES
- Strict validation. Default currency to USD if missing.
- Normalize inputs (ranges, percents).
- Section gate: only for mapped sections and completedSections contains sectionId.
- Quantify loss from moneyLost match if available; else derive only if primitives exist; else 0 and consider silence.
- Map to single Voice Skill by vertical + tags.
- Choose conservative ROI: lower bound of roiRangeMonthly OR recoveryRate * lossMonthly.
- Deduplicate by normalized key (\`missed_calls\`, \`pending_quotes\`, etc.).
- Max 4 insights overall; one per section event.

OUTPUT — JSON ARRAY (0–1 items)
Each insight:
id, key, sectionId, category, title, description (≤60 words), impact, urgency, monthlyImpact, currency, recoveryRate, formula, assumptions[], confidence, skill{name, why, proof_points[]}, actionItems[], benchmarkData, data_used[], missing_data[], created_at.

CONSTRAINTS
- No hallucinations. Use ONLY kb.services and kb.approved_claims.
- Show formula + assumptions whenever monthlyImpact > 0.
- Prefer silence over noise if primitives insufficient.
- U.S. English; consultative tone.

QA & SCORING
- Ensure monthlyImpact ≤ matching moneyLost when used; otherwise use ROI lower bound path.
- Confidence: +20 if moneyLost used, +15 if ≥2 corroborating metrics, −20 if inferred primitives; cap 95.

Return ONLY valid JSON array — no prose outside.`;
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