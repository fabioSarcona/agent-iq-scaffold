import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { NeedAgentIQSimpleInputSchema, NeedAgentIQSimpleOutputSchema } from '../_shared/validation.ts';
import { filterServicesByVertical, filterServicesByTags, validateKBSlice, type KBService, type KBSlice } from '../_shared/kbValidation.ts';
import { isDiagMode, diagWrap } from "../_shared/diag.ts";

// FASE 2: Section Policy per differenziare comportamento tra sezioni - FIXED with correct dental section IDs
const ALLOWED_BY_SECTION: Record<string, {
  allowSkills: boolean;
  allowROI: boolean;
  allowedServiceIds: string[];
  mode: 'skills' | 'foundational';
}> = {
  // Dental sections with correct IDs from config.dental.json
  practice_profile: {
    allowSkills: false,
    allowROI: false,
    allowedServiceIds: ['appointment_booking'],
    mode: 'foundational'
  },
  financial_overview: {
    allowSkills: false,
    allowROI: false,
    allowedServiceIds: ['appointment_booking', 'lead_qualification'],
    mode: 'foundational'
  },
  call_handling_conversion: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing'],
    mode: 'skills'
  },
  scheduling_no_shows: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing'],
    mode: 'skills'
  },
  treatment_plan_conversion: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing'],
    mode: 'skills'
  },
  patient_retention_recall: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing'],
    mode: 'skills'
  },
  reviews_reputation: {
    allowSkills: false,
    allowROI: false,
    allowedServiceIds: ['appointment_booking'],
    mode: 'foundational'
  }
};

// Extended KB types for this function (includes additional fields from actual KB)
interface ExtendedKBService extends KBService {
  id?: string;
  description?: string;
  areaId?: string;
}

interface ExtendedKBSlice {
  approved_claims: string[];
  services: ExtendedKBService[];
}

// Area to money lost mapping
type AreaMap = {
  missed_calls: 'missed_calls';
  no_shows: 'no_shows';
  treatment_plans: 'treatment_plans';
  quotes: 'quotes';
  reactivation: 'reactivation';
};

// Helper functions for PLAN C Enhanced
function getAreaMonthlyUsd(moneyLost: any, areaId: string): number {
  if (!moneyLost?.areas || !Array.isArray(moneyLost.areas)) return 0;
  
  const area = moneyLost.areas.find((a: any) => 
    a.id === areaId || a.key === areaId || a.title?.toLowerCase().includes(areaId.replace('_', ' '))
  );
  
  return area?.monthlyUsd || 0;
}

function scoreService(service: ExtendedKBService, signalTags: string[], moneyLost: any): number {
  let score = 0;
  
  // Tag relevance (weight: 3)
  if (service.tags) {
    const tagHits = signalTags.filter(tag => 
      service.tags?.some(serviceTag => tag.includes(serviceTag))
    ).length;
    score += tagHits * 3;
  }
  
  // Area money impact (weight: 2)
  if (service.areaId) {
    const areaUsd = getAreaMonthlyUsd(moneyLost, service.areaId);
    if (areaUsd > 0) score += 2;
  }
  
  // Vertical match (weight: 1)
  score += 1;
  
  return score;
}

function inferTagsFromId(serviceId: string): string[] {
  const tagMap: Record<string, string[]> = {
    'appointment_booking': ['no_online_booking', 'scheduling'],
    'lead_qualification': ['lead_conversion', 'sales'],
    'emergency_routing': ['missed_calls_high', 'emergency'],
    'payment_processing': ['treatment_conversion_low', 'payment'],
    'no_show_prevention': ['no_shows_high', 'no_shows_critical'],
    'treatment_plan_closer': ['treatment_plans_high', 'treatment_conversion_low'],
    'hvac_emergency_dispatch': ['missed_calls_high', 'emergency'],
    'quote_follow_up': ['quotes_pending_high', 'quote_conversion_low']
  };
  return tagMap[serviceId] || [];
}

function inferAreaFromId(serviceId: string): string {
  const areaMap: Record<string, string> = {
    'appointment_booking': 'missed_calls',
    'lead_qualification': 'treatment_plans',
    'emergency_routing': 'missed_calls',
    'payment_processing': 'treatment_plans',
    'no_show_prevention': 'no_shows',
    'treatment_plan_closer': 'treatment_plans',
    'hvac_emergency_dispatch': 'missed_calls',
    'quote_follow_up': 'quotes'
  };
  return areaMap[serviceId] || 'operations';
}

function getDefaultROIRange(serviceId: string): [number, number] {
  const roiMap: Record<string, [number, number]> = {
    'appointment_booking': [2000, 4000],
    'lead_qualification': [3000, 6000],
    'emergency_routing': [1500, 3000],
    'payment_processing': [4000, 8000],
    'no_show_prevention': [3000, 5000],
    'treatment_plan_closer': [10000, 20000],
    'hvac_emergency_dispatch': [4000, 8000],
    'quote_follow_up': [6000, 10000]
  };
  return roiMap[serviceId] || [2000, 5000];
}

// Inline deterministic mapping to avoid cross-function imports
const THRESHOLDS = {
  MISSED_CALLS_MEDIUM: 4,
  MISSED_CALLS_HIGH: 11,
  NO_SHOWS_HIGH: 7,
  NO_SHOWS_CRITICAL: 11,
  COLD_PLANS_HIGH: 10,
  PENDING_QUOTES_HIGH: 20,
  TREATMENT_ACCEPTANCE_LOW: 40,
  QUOTE_ACCEPTANCE_LOW: 3,
} as const;

const SIGNAL_RULES: Array<{
  when: (answers: Record<string, unknown>, vertical: string) => boolean;
  add: string[];
}> = [
  // MISSED CALLS SIGNALS
  { when: (a, v) => v === 'dental' && a.daily_unanswered_calls_choice === '4_10', add: ['missed_calls_medium'] },
  { when: (a, v) => v === 'dental' && ['11_20', '21_plus'].includes(String(a.daily_unanswered_calls_choice)), add: ['missed_calls_high'] },
  { when: (a, v) => v === 'hvac' && ['1_3', '4_6'].includes(String(a.hvac_daily_unanswered_calls_choice)), add: ['missed_calls_medium'] },
  { when: (a, v) => v === 'hvac' && a.hvac_daily_unanswered_calls_choice === 'gt_6', add: ['missed_calls_high'] },
  
  // NO SHOWS / CANCELLATIONS SIGNALS
  { when: (a, v) => v === 'dental' && a.weekly_no_shows_choice === '7_10', add: ['no_shows_high'] },
  { when: (a, v) => v === 'dental' && a.weekly_no_shows_choice === '11_plus', add: ['no_shows_critical'] },
  { when: (a, v) => v === 'hvac' && ['3_5', 'gt_5'].includes(String(a.weekly_job_cancellations_choice)), add: ['job_cancellations_high'] },
  
  // TREATMENT PLANS / QUOTES SIGNALS
  { when: (a, v) => v === 'dental' && Number(a.monthly_cold_treatment_plans) > THRESHOLDS.COLD_PLANS_HIGH, add: ['treatment_plans_high'] },
  { when: (a, v) => v === 'dental' && ['lt_30', '30_60'].includes(String(a.treatment_acceptance_rate_choice)), add: ['treatment_conversion_low'] },
  { when: (a, v) => v === 'hvac' && Number(a.monthly_pending_quotes) > THRESHOLDS.PENDING_QUOTES_HIGH, add: ['quotes_pending_high'] },
  { when: (a, v) => v === 'hvac' && ['0_2', '3_5'].includes(String(a.immediate_quote_acceptance_choice)), add: ['quote_conversion_low'] },
  
  // TECHNOLOGY GAP SIGNALS
  { when: (a, v) => v === 'dental' && ['not_connected', 'no_website'].includes(String(a.website_scheduling_connection_choice)), add: ['no_online_booking'] },
  { when: (a, v) => v === 'hvac' && ['not_connected', 'no_website'].includes(String(a.website_system_connection_choice)), add: ['no_online_booking'] },
];

const SKILL_DETAILS: Record<string, {
  title: string;
  description: string;
  roiUsdRange: { min: number; max: number };
  recoveryRateRange: { min: number; max: number };
  monthlyPriceUsd: number;
  category: string;
  vertical: 'dental' | 'hvac' | 'both';
}> = {
  'reception-24-7': {
    title: 'Reception 24/7 Agent',
    description: 'AI agent that answers calls 24/7, provides info, sends estimates, and books appointments',
    roiUsdRange: { min: 3000, max: 7000 },
    recoveryRateRange: { min: 0.15, max: 0.30 },
    monthlyPriceUsd: 199,
    category: 'call-handling',
    vertical: 'dental'
  },
  'prevention-no-show': {
    title: 'Prevention & No-Show Agent',
    description: 'AI agent that prevents no-shows with voice reminders and waitlist management',
    roiUsdRange: { min: 3000, max: 5000 },
    recoveryRateRange: { min: 0.40, max: 0.60 },
    monthlyPriceUsd: 199,
    category: 'scheduling',
    vertical: 'dental'
  },
  'treatment-plan-closer': {
    title: 'Treatment Plan Closer Agent',
    description: 'AI agent specialized in closing pending treatment plans with payment options',
    roiUsdRange: { min: 10000, max: 20000 },
    recoveryRateRange: { min: 0.15, max: 0.25 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'dental'
  },
  'follow-up-agent': {
    title: 'Follow-Up Agent',
    description: 'AI agent that follows up on unconfirmed treatment plans and estimates',
    roiUsdRange: { min: 8000, max: 12000 },
    recoveryRateRange: { min: 0.25, max: 0.35 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'dental'
  },
  'hvac-reception-24-7': {
    title: 'Reception 24/7 Agent and Emergency Management',
    description: 'AI agent that handles HVAC calls 24/7, filters emergencies, and dispatches jobs',
    roiUsdRange: { min: 4000, max: 8000 },
    recoveryRateRange: { min: 0.20, max: 0.35 },
    monthlyPriceUsd: 199,
    category: 'call-handling',
    vertical: 'hvac'
  },
  'hvac-no-show-reminder': {
    title: 'No-Show & Reminder Agent',
    description: 'AI agent that prevents HVAC job cancellations with reminders and confirmations',
    roiUsdRange: { min: 2000, max: 4000 },
    recoveryRateRange: { min: 0.35, max: 0.50 },
    monthlyPriceUsd: 199,
    category: 'scheduling',
    vertical: 'hvac'
  },
  'quote-follow-up': {
    title: 'Quote Follow-Up Agent',
    description: 'AI agent that follows up on HVAC quotes, handles objections, and closes deals',
    roiUsdRange: { min: 6000, max: 10000 },
    recoveryRateRange: { min: 0.20, max: 0.30 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'hvac'
  },
  'contract-closer': {
    title: 'Contract Closer Agent',
    description: 'AI agent that follows up after HVAC jobs to close maintenance contracts',
    roiUsdRange: { min: 5000, max: 8000 },
    recoveryRateRange: { min: 0.25, max: 0.40 },
    monthlyPriceUsd: 199,
    category: 'sales',
    vertical: 'hvac'
  }
};

const SIGNAL_TO_SKILLS: Record<string, string[]> = {
  'dental.missed_calls_medium': ['reception-24-7'],
  'dental.missed_calls_high': ['reception-24-7', 'follow-up-agent'],
  'dental.no_shows_high': ['prevention-no-show'],
  'dental.no_shows_critical': ['prevention-no-show'],
  'dental.treatment_plans_high': ['treatment-plan-closer', 'follow-up-agent'],
  'dental.treatment_conversion_low': ['treatment-plan-closer', 'follow-up-agent'],
  'dental.no_online_booking': ['prevention-no-show', 'reception-24-7'],
  
  'hvac.missed_calls_medium': ['hvac-reception-24-7'],
  'hvac.missed_calls_high': ['hvac-reception-24-7', 'quote-follow-up'],
  'hvac.job_cancellations_high': ['hvac-no-show-reminder'],
  'hvac.quotes_pending_high': ['quote-follow-up', 'contract-closer'],
  'hvac.quote_conversion_low': ['quote-follow-up', 'contract-closer'],
  'hvac.no_online_booking': ['hvac-no-show-reminder', 'hvac-reception-24-7']
};

// Inline functions to avoid cross-function imports
function extractSignalTags(auditAnswers: Record<string, unknown>, vertical: 'dental' | 'hvac'): string[] {
  if (!auditAnswers || typeof auditAnswers !== 'object') return [];
  
  const signals = new Set<string>();
  for (const rule of SIGNAL_RULES) {
    try {
      if (rule.when(auditAnswers, vertical)) {
        rule.add.forEach(tag => signals.add(tag));
      }
    } catch (error) {
      console.warn(`Signal rule evaluation failed:`, error, rule);
    }
  }
  
  return Array.from(signals).map(tag => `${vertical}.${tag}`).sort();
}

function mapSignalTagsToSkills(signalTags: string[], moneyLostData: Record<string, number> = {}, vertical: 'dental' | 'hvac'): any[] {
  const insights: any[] = [];
  
  signalTags.forEach(signalTag => {
    const skillIds = SIGNAL_TO_SKILLS[signalTag];
    if (!skillIds || skillIds.length === 0) return;
    
    skillIds.forEach(skillId => {
      const skillDetail = SKILL_DETAILS[skillId];
      if (!skillDetail || skillDetail.vertical !== vertical) return;
      
      const avgMoneyLost = Object.values(moneyLostData).reduce((a, b) => a + b, 0) / Math.max(Object.keys(moneyLostData).length, 1) || 5000;
      const monthlyImpact = Math.round(avgMoneyLost * ((skillDetail.recoveryRateRange.min + skillDetail.recoveryRateRange.max) / 2));
      
      const insight = {
        title: skillDetail.title,
        description: skillDetail.description,
        impact: 'high',
        priority: monthlyImpact >= 5000 ? 'high' : monthlyImpact >= 2000 ? 'medium' : 'low',
        rationale: [`Addresses ${signalTag.replace(`${vertical}.`, '').replace(/_/g, ' ')} signals`, `Category: ${skillDetail.category}`],
        category: skillDetail.category,
        key: `${vertical}_${signalTag.replace(`${vertical}.`, '')}_${skillId}`.replace(/[^a-z0-9_]/g, '_'),
        monthlyImpactUsd: monthlyImpact,
        skill: {
          name: skillDetail.title,
          id: skillId
        }
      };
      
      insights.push(insight);
    });
  });
  
  return insights;
}

// Helper functions for response formatting

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function logError(event: string, data: Record<string, any>) {
  logger.error(event, data);
}

serve(async (req) => {
  console.log('🚀 NeedAgentIQ function called:', req.method, req.url);
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // --- Health check (GET ?health=1) ---
  const url = new URL(req.url);
  if (url.searchParams.get('health') === '1') {
    const kbProbe = {
      approved_claims: await fileExists('./kb/approved_claims.json'),
      services: await fileExists('./kb/services.json'),
    };
    return jsonOk({
      ok: true,
      health: {
        kb: kbProbe,
        sections_edge: Object.keys(ALLOWED_BY_SECTION || {}),
      },
    });
  }

  // No authentication required for public access

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    console.log('📥 Parsing request body...');
    // Parse and validate input
    const body = await req.json();
    console.log('📋 Body received:', JSON.stringify(body).slice(0, 200));
    const { vertical, sectionId, answers, language = 'en', moneyLostData = {} } = NeedAgentIQSimpleInputSchema.parse(body);
    console.log('✅ Input validated successfully');

    logger.info('Processing NeedAgentIQ request', { 
      sectionId, 
      vertical,
      answersCount: Object.keys(answers).length
    });

    // FASE 3: Determine section mode and policy
    const defaultSection = 'practice_profile';
    const policy = ALLOWED_BY_SECTION[sectionId ?? defaultSection] ?? ALLOWED_BY_SECTION[defaultSection];
    const mode = policy.mode || (policy.allowSkills ? 'skills' : 'foundational');
    
    console.log('🎯 Section policy determined:', {
      sectionId,
      mode,
      allowSkills: policy.allowSkills,
      allowROI: policy.allowROI,
      allowedServiceIds: policy.allowedServiceIds
    });

    // FASE 3: Conditional Pipeline - Skip deterministic mapping for foundational mode
    console.log('🔄 FASE 3: Starting conditional pipeline...');
    
    let finalInsights: any[] = [];
    let baseInsights: any[] = []; // Declare baseInsights for both modes

    if (mode === 'skills') {
      // SKILLS MODE: Use deterministic voice skill mapping
      console.log('💪 SKILLS MODE: Running deterministic signal extraction...');
      
      // Step 1: Extract signal tags from audit answers
      const signalTags = extractSignalTags(answers, vertical as 'dental' | 'hvac');
      console.log('📊 Signal tags extracted:', {
        count: signalTags.length,
        tags: signalTags
      });

      // Step 2: Map signal tags to skills with ROI calculations  
      baseInsights = mapSignalTagsToSkills(
        signalTags,
        moneyLostData as Record<string, number> | undefined, // Pass money lost data for accurate ROI calculations
        vertical as 'dental' | 'hvac'
      );
      
      console.log('💡 Base insights from deterministic mapping:', {
        count: baseInsights.length,
        insights: baseInsights.map(i => ({ key: i.key, title: i.title, monthlyImpact: i.monthlyImpactUsd }))
      });

      if (baseInsights.length > 0) {
        // Use deterministic insights - convert to NeedAgentIQ format
        finalInsights = baseInsights.map(insight => ({
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          priority: insight.priority,
          rationale: Array.isArray(insight.rationale) 
            ? insight.rationale.slice(0, 5) 
            : [],
          category: insight.category,
          key: insight.key,
          monthlyImpactUsd: insight.monthlyImpactUsd,
          skill: {
            name: insight.title,
            id: insight.skill?.id || ''
          },
          source: 'mapping'
        }));
        
        console.log('[ai_needagentiq] mapped_insights', finalInsights.length);
      }
    } else {
      // FOUNDATIONAL MODE: Skip deterministic mapping
      console.log('🏗️ FOUNDATIONAL MODE: Skipping deterministic mapping, going direct to AI...');
    }

    // Fallback to AI enhancement when no insights are available or in foundational mode
    if (finalInsights.length === 0 || mode === 'foundational') {
      console.log('⚠️ Using AI enhancement fallback...');
      
      const enhancedInsights = await enhanceWithAI(answers, vertical, sectionId, language, [], moneyLostData, mode, policy);
      finalInsights = enhancedInsights;
      
      console.log('🤖 AI enhanced insights:', {
        source: 'ai_enhanced',
        count: finalInsights.length
      });
    } else {
      console.log('✅ Using deterministic insights:', {
        source: 'voice_skill_mapping',
        count: finalInsights.length,
        totalMonthlyImpact: finalInsights.reduce((sum, i) => sum + (i.monthlyImpactUsd || 0), 0)
      });
    }

    // FASE 4: Filter insights based on section policy
    console.log('🔍 FASE 4: Applying section policy filter...');
    const preFilterCount = finalInsights.length;
    
    finalInsights = finalInsights.filter(insight => {
      const okSkill = policy.allowSkills ? true : !insight.skill?.id;
      const okService = insight.skill?.id ? policy.allowedServiceIds.includes(insight.skill.id) : true;
      const okROI = policy.allowROI ? true : (insight.monthlyImpactUsd || 0) === 0;
      
      const passed = okSkill && okService && okROI;
      if (!passed) {
        console.log('🚫 Filtered out insight:', {
          title: insight.title,
          skillId: insight.skill?.id,
          monthlyImpact: insight.monthlyImpactUsd,
          reasons: {
            skill: !okSkill ? 'skills not allowed in this section' : 'ok',
            service: !okService ? 'service not allowed in this section' : 'ok',
            roi: !okROI ? 'ROI not allowed in this section' : 'ok'
          }
        });
      }
      
      return passed;
    });
    
    console.log('✅ Policy filter applied:', {
      preFilter: preFilterCount,
      postFilter: finalInsights.length,
      filtered: preFilterCount - finalInsights.length
    });

    const processingTime = Date.now() - startTime;

    logger.info('NeedAgentIQ completed', { 
      sectionId, 
      vertical,
      insights: finalInsights.length,
      processingTime,
      source: baseInsights.length > 0 ? 'deterministic' : (mode === 'foundational' ? 'foundational' : 'ai_enhanced')
    });

    const resp = { ok: true, insights: finalInsights };
    return jsonOk(
      diagWrap(resp, isDiagMode() ? {
        sectionId,
        effectiveSectionId: (sectionId && ALLOWED_BY_SECTION[sectionId]) ? sectionId : defaultSection,
        policyUsed: policy
      } : undefined)
    );

  } catch (error) {
    console.error('❌ Error in NeedAgentIQ:', error);
    const errorObj = error as Error;
    
    logError('needagentiq_error', { 
      msg: errorObj?.message?.slice(0, 160),
      code: (errorObj as any)?.code,
      name: errorObj?.name
    });

    if (errorObj?.name === 'ZodError') {
      console.log('🔍 Zod validation error:', (errorObj as any).issues);
      return jsonError('Invalid input format', 400);
    }

    return jsonError('Internal server error', 500);
  }
});

/**
 * AI Enhancement fallback with KB-aware scoring (PLAN C ENHANCED)
 */
async function enhanceWithAI(
  answers: Record<string, unknown>,
  vertical: string, 
  sectionId: string,
  language: string,
  signalTags: string[] = [],
  moneyLost: any = {},
  mode: string = 'skills',
  policy: any = null
): Promise<any[]> {
  const startTime = Date.now();
  
  try {
    // Step 1: Load and validate KB data with shared helpers
    console.log('🔧 Loading KB data for enhanced fallback...');
    
    const [approvedClaimsText, servicesText] = await Promise.all([
      // Usa import.meta.url per risolvere il percorso alla KB condivisa.  Senza new URL
      // Deno risolve il percorso rispetto alla working directory, causando errori in deploy.
      Deno.readTextFile(new URL('../_shared/kb/approved_claims.json', import.meta.url)),
      Deno.readTextFile(new URL('../_shared/kb/services.json', import.meta.url)),
    ]);
    
    // Validate KB slice using shared helper
    const kbSlice: KBSlice = validateKBSlice({
      approved_claims: JSON.parse(approvedClaimsText),
      services: JSON.parse(servicesText)
    });
    
    console.log('📚 KB loaded and validated:', {
      claims: kbSlice.approved_claims.length,
      services: kbSlice.services.length
    });
    
    // Step 2: Filter services by vertical using shared helper
    const servicesForVertical = filterServicesByVertical(
      kbSlice.services as ExtendedKBService[], 
      vertical as 'dental' | 'hvac'
    );
    
    // Enhance services with inferred data if missing
    const enhancedServices = servicesForVertical.map(service => ({
      ...service,
      tags: service.tags || inferTagsFromId(service.id || ''),
      areaId: service.areaId || inferAreaFromId(service.id || ''),
      roiRangeMonthly: service.roiRangeMonthly || getDefaultROIRange(service.id || '')
    }));
    
    // Score and rank services
    const rankedServices = enhancedServices
      .map(service => ({
        service,
        score: scoreService(service, signalTags, moneyLost)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.service);
    
    console.log('🎯 Services ranked:', {
      candidates: rankedServices.map(s => ({ id: s.id || 'unknown', score: scoreService(s, signalTags, moneyLost) })),
      signalTags,
      moneyLostTotal: moneyLost?.monthlyUsd || 0
    });
    
    // Step 3: Build grounded prompt with KB context
    const claimsTop = kbSlice.approved_claims.slice(0, 5);
    const servicesForPrompt = rankedServices.map(s => ({
      id: s.id || 'unknown',
      name: s.name,
      areaId: s.areaId,
      problem: s.problem,
      how: s.how,
      roiRangeMonthly: s.roiRangeMonthly
    }));
    
    const grounding = {
      vertical,
      signalTags,
      moneylostSummary: {
        monthlyUsd: moneyLost?.monthlyUsd || 0,
        areas: (moneyLost?.areas || []).map((a: any) => ({ 
          id: a.id || a.key, 
          monthlyUsd: a.monthlyUsd 
        }))
      },
      services: servicesForPrompt,
      approvedClaims: claimsTop
    };
    
    // Enhanced system prompt with KB grounding and mode-specific instructions
    const basePrompt = Deno.env.get('NEEDAGENT_IQ_SYSTEM_PROMPT') ?? '';
    const modeInstructions = mode === 'foundational' 
      ? `
FOUNDATIONAL MODE (Sections 1-2):
- DO NOT assign specific voice skills or operational ROI estimates
- Focus on foundational business insights like web presence, basic CRM, contact methods
- Set monthlyImpactUsd to 0 for all insights
- Use only basic services from allowedServiceIds: ${policy?.allowedServiceIds?.join(', ') || 'none'}
- source must be "foundational"`
      : `
SKILLS MODE (Sections 3-7):
- Generate operational insights with specific voice skills and ROI calculations
- Limit to maximum 2 skills per section
- Use only services from allowedServiceIds: ${policy?.allowedServiceIds?.join(', ') || 'all'}
- Calculate realistic monthlyImpactUsd based on money lost data
- source must be "kb-fallback"`;

    const systemPrompt = `${basePrompt}

LANGUAGE INSTRUCTIONS:
${language === 'it' ? 'Respond in Italian' : 'Respond in English'}

${modeInstructions}

KB-GROUNDED CONTEXT:
- Respond in ${language === 'it' ? 'Italian' : 'English'}
- Use professional terminology appropriate for ${vertical} business contexts

KB-GROUNDED CONTEXT:
Available AI Services for ${vertical}:
${servicesForPrompt.map(s => `- ${s.id}: ${s.name} (Area: ${s.areaId}, Problem: ${s.problem})`).join('\n')}

Approved Claims to Reference:
${claimsTop.map(claim => `- "${claim}"`).join('\n')}

CRITICAL OUTPUT REQUIREMENTS:
- Generate EXACTLY 1-3 insights maximum
- Each insight MUST use skill.id from the available services list above
- skill.id MUST be one of: ${servicesForPrompt.map(s => s.id).join(', ')}
- Calculate monthlyImpactUsd based on the moneylost area data when possible
- source must be "kb-fallback"

JSON SCHEMA:
[
  {
    "title": "Specific actionable insight title",
    "description": "Clear explanation referencing approved claims",
    "impact": "high|medium|low",
    "priority": "high|medium|low",
    "rationale": ["Reason with approved claim", "Reason 2"],
    "category": "efficiency|revenue|customer_experience|operations",
    "monthlyImpactUsd": number,
    "skill": { "id": "service_id_from_list", "name": "service_name" },
    "source": "kb-fallback"
  }
]`;

    console.log('🎯 Enhanced prompt prepared:', {
      servicesCount: servicesForPrompt.length,
      claimsCount: claimsTop.length,
      promptLength: systemPrompt.length
    });
    
    // Step 4: Call AI with enhanced prompt
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }
    
    const contextualMessage = `Analyze this ${vertical} practice audit data and provide 1-3 KB-grounded actionable insights:

CONTEXT:
${JSON.stringify(grounding, null, 2)}

AUDIT ANSWERS:
${JSON.stringify({ sectionId, answers }, null, 2)}

Generate insights using ONLY the provided services and claims:`;

    const anthropicRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: contextualMessage }],
      system: systemPrompt
    };
    
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequest)
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      throw new Error(`AI processing failed: ${errorText.slice(0, 160)}`);
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from AI');
    }

    // Step 5: Parse and validate AI response with whitelist check
    const parsedInsights = parseAIResponseEnhanced(content, servicesForPrompt, moneyLost);
    
    // Step 6: Fallback to deterministic if AI fails validation
    if (parsedInsights.length === 0 && rankedServices.length > 0) {
      console.log('🔄 AI validation failed, using deterministic fallback...');
      const topService = rankedServices[0];
      const areaUsd = getAreaMonthlyUsd(moneyLost, topService.areaId || '');
      const roiRange = topService.roiRangeMonthly || [2000, 5000];
      const roiEstimate = areaUsd > 0 ? Math.min(areaUsd, roiRange[1])
                         : Math.round((roiRange[0] + roiRange[1]) / 2);
      
      parsedInsights.push({
        title: topService.name,
        description: topService.problem,
        impact: 'medium',
        priority: 'medium',
        rationale: [topService.how, 'Recommended based on audit analysis'],
        category: topService.areaId || 'operations',
        key: `${vertical}_${topService.areaId}_${topService.id}`,
        monthlyImpactUsd: roiEstimate,
        skill: { id: topService.id, name: topService.name },
        source: 'kb-fallback'
      });
    }

    // Step 7: Final telemetry and enhanced rationale
    const processingTime = Date.now() - startTime;
    
    // Enhance rationale with approved claims for better consultancy feel
    const enhancedInsights = parsedInsights.map(insight => ({
      ...insight,
      rationale: [
        ...insight.rationale.slice(0, 3),
        ...kbSlice.approved_claims.slice(0, 2).map(claim => `Proven benefit: ${claim}`)
      ].slice(0, 5)
    }));
    
    console.log('[IQ kb-fallback]', {
      vertical, 
      sectionId, 
      signalTags,
      candidates: servicesForPrompt.map(s => s.id),
      picked: enhancedInsights.map(i => i.skill?.id),
      money: {
        total: moneyLost?.monthlyUsd || 0,
        areas: (moneyLost?.areas || []).map((a: any) => ({ id: a.id || a.key, usd: a.monthlyUsd }))
      },
      processingTimeMs: processingTime
    });

    return enhancedInsights;
    
  } catch (error) {
    console.error('❌ Enhanced AI fallback error:', error);
    
    // KB-aware emergency fallback - use top ranked service if available
    try {
      const [approvedClaimsText, servicesText] = await Promise.all([
        // Usa import.meta.url per risolvere il percorso alla KB condivisa.  Senza new URL
        // Deno risolve il percorso rispetto alla working directory, causando errori in deploy.
        Deno.readTextFile(new URL('../_shared/kb/approved_claims.json', import.meta.url)),
        Deno.readTextFile(new URL('../_shared/kb/services.json', import.meta.url)),
      ]);
      
      const allServices: ExtendedKBService[] = JSON.parse(servicesText);
      const targetMap = { dental: 'Dental', hvac: 'HVAC' } as const;
      const target = targetMap[vertical as keyof typeof targetMap] || 'Both';
      
      const servicesForVertical = allServices.filter(service => 
        service.target === target || service.target === 'Both'
      );
      
      if (servicesForVertical.length > 0) {
        const topService = servicesForVertical[0];
        const areaUsd = getAreaMonthlyUsd(moneyLost, topService.areaId || '');
        const roiEstimate = areaUsd > 0 ? Math.min(areaUsd, (topService.roiRangeMonthly?.[1] || 5000)) 
                           : Math.round(((topService.roiRangeMonthly?.[0] || 2000) + (topService.roiRangeMonthly?.[1] || 5000)) / 2);
        
        return [{
          title: topService.name || `${vertical.charAt(0).toUpperCase() + vertical.slice(1)} Operations Enhancement`,
          description: topService.problem || `Improve your ${vertical} practice efficiency and customer experience`,
          impact: 'medium',
          priority: 'medium',
          rationale: [topService.how || 'Operational optimization drives growth', 'Recommended based on audit analysis'],
          category: topService.areaId || 'operations',
          key: `${vertical}_${topService.areaId}_${topService.id}_emergency`,
          monthlyImpactUsd: roiEstimate,
          skill: { id: topService.id || 'kb_emergency', name: topService.name || 'Operations Enhancement' },
          source: 'kb-emergency'
        }];
      }
    } catch (kbError) {
      console.error('❌ KB emergency fallback also failed:', kbError);
    }
    
    // Last resort fallback
    return [{
      title: `Optimize ${vertical.charAt(0).toUpperCase() + vertical.slice(1)} Operations`,
      description: `Enhance your ${vertical} practice efficiency and customer experience`,
      impact: 'medium',
      priority: 'medium',
      rationale: ['Operational optimization drives growth', 'Customer experience improvements increase retention'],
      category: 'operations',
      key: `${vertical}_${sectionId}_last_resort_fallback`,
      monthlyImpactUsd: 2500,
      skill: { id: 'operations_optimization', name: 'Operations Enhancement' },
      source: 'last-resort'
    }];
  }
  }

/**
 * Enhanced AI response parsing with KB validation (PLAN C)
 */
function parseAIResponseEnhanced(content: string, servicesForPrompt: any[], moneyLost: any): any[] {
  console.log('🔍 Enhanced parsing with KB validation:', {
    contentLength: content?.length || 0,
    servicesCount: servicesForPrompt.length,
    serviceIds: servicesForPrompt.map(s => s.id)
  });

  let insights = [];
  
  try {
    // Clean content
    let cleanContent = content.trim();
    if (cleanContent.toLowerCase().startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    cleanContent = cleanContent.replace(/^`+/, '').replace(/`+$/, '');
    
    if (!cleanContent || cleanContent === '[]' || cleanContent.length < 10) {
      console.log('🔍 Empty AI response, returning empty array for deterministic fallback');
      return [];
    }
    
    const parsed = JSON.parse(cleanContent);
    console.log('🔍 Parsed AI response:', { isArray: Array.isArray(parsed), length: Array.isArray(parsed) ? parsed.length : 0 });
    
    if (!Array.isArray(parsed)) {
      console.log('🔍 AI response not array, returning empty');
      return [];
    }
    
    // Whitelist validation - critical security check
    const serviceIdSet = new Set(servicesForPrompt.map(s => s.id));
    console.log('🔍 Validating against service whitelist:', Array.from(serviceIdSet));
    
    const sanitized = parsed
      .filter((insight: any) => {
        const hasValidSkillId = insight.skill?.id && serviceIdSet.has(insight.skill.id);
        console.log('🔍 Insight validation:', { 
          title: insight.title?.slice(0, 30), 
          skillId: insight.skill?.id, 
          valid: hasValidSkillId 
        });
        return hasValidSkillId;
      })
      .map((insight: any) => {
        // Calculate area-specific monthlyImpactUsd
        const service = servicesForPrompt.find(s => s.id === insight.skill.id);
        let monthlyImpactUsd = insight.monthlyImpactUsd || 0;
        
        if (!monthlyImpactUsd && service?.areaId) {
          const areaUsd = getAreaMonthlyUsd(moneyLost, service.areaId);
          if (areaUsd > 0) {
            monthlyImpactUsd = Math.min(areaUsd, service.roiRangeMonthly?.[1] || 5000);
          } else if (service.roiRangeMonthly) {
            monthlyImpactUsd = Math.round((service.roiRangeMonthly[0] + service.roiRangeMonthly[1]) / 2);
          }
        }
        
        return {
          ...insight,
          monthlyImpactUsd: Math.max(0, Math.round(monthlyImpactUsd)),
          source: 'kb-fallback',
          key: insight.key || `${insight.skill.id}_${Date.now()}`,
          skill: {
            id: insight.skill.id,
            name: service?.name || insight.skill.name
          }
        };
      });
    
    console.log('🔍 Final sanitized insights:', {
      count: sanitized.length,
      insights: sanitized.map((i: any) => ({ 
        title: i.title?.slice(0, 30), 
        skillId: i.skill?.id, 
        monthlyImpact: i.monthlyImpactUsd 
      }))
    });
    
    return sanitized;
    
  } catch (parseError) {
    const errorObj = parseError as Error;
    console.log('🔍 Enhanced parse error:', {
      error: errorObj.message,
      content: content?.slice(0, 200)
    });
    return [];
  }
}

/**
 * Robust AI response parsing with fallbacks (LEGACY - kept for compatibility)
 */
function parseAIResponse(content: string, vertical: string, sectionId: string): any[] {
  console.log('🐛 DEBUG: Raw Claude content:', {
    hasText: !!content,
    textLength: content?.length || 0,
    firstChars: content?.slice(0, 100),
    lastChars: content?.slice(-50),
    startsWithBackticks: content?.startsWith('```'),
    endsWithBackticks: content?.endsWith('```')
  });

  let insights: any[] = [];
  
  try {
    // 🐛 DEBUG: Content cleaning process
    console.log('🐛 DEBUG: Starting content cleaning:', {
      originalLength: content.length,
      startsWithJson: content.toLowerCase().startsWith('```json'),
      startsWithBackticks: content.startsWith('```'),
      hasBackticks: content.includes('```')
    });
    
    // Remove markdown backticks if present - Enhanced cleaning
    let cleanContent = content.trim();
    console.log('🐛 DEBUG: After trim:', {
      length: cleanContent.length,
      firstChars: cleanContent.slice(0, 50),
      lastChars: cleanContent.slice(-20)
    });
    
    // More robust backtick removal
    if (cleanContent.toLowerCase().startsWith('```json')) {
      console.log('🐛 DEBUG: Removing ```json wrapper');
      cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      console.log('🐛 DEBUG: Removing ``` wrapper');
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Fallback: remove any remaining backticks at start/end
    cleanContent = cleanContent.replace(/^`+/, '').replace(/`+$/, '');
    
    // If Claude returned empty content or just "[]", provide a fallback insight
    if (!cleanContent || cleanContent === '[]' || cleanContent.length < 10) {
      console.log('🐛 DEBUG: Empty response detected, using fallback insights');
      const fallbackInsight = [{
        title: `Optimize Your ${vertical.charAt(0).toUpperCase() + vertical.slice(1)} Practice Operations`,
        description: `Based on your ${vertical} practice profile for ${sectionId}, there are opportunities to enhance efficiency and growth.`,
        impact: "medium",
        priority: "medium", 
        rationale: ["Regular business optimization drives growth", "Technology adoption improves operational efficiency"],
        category: "operations"
      }];
      
      insights = fallbackInsight;
      console.log('🐛 DEBUG: Using fallback insights:', insights);
    } else {
      console.log('🐛 DEBUG: After cleaning:', {
        length: cleanContent.length,
        firstChars: cleanContent.slice(0, 100),
        lastChars: cleanContent.slice(-50),
        fullCleanContent: cleanContent
      });
      
      // 🐛 DEBUG: JSON parsing attempt
      console.log('🐛 DEBUG: Attempting JSON.parse...');
      const parsed = JSON.parse(cleanContent);
      console.log('🐛 DEBUG: JSON.parse successful:', {
        isArray: Array.isArray(parsed),
        length: Array.isArray(parsed) ? parsed.length : 0,
        type: typeof parsed,
        keys: typeof parsed === 'object' ? Object.keys(parsed) : [],
        parsed: parsed
      });
      
      // 🐛 DEBUG: Zod validation attempt
      console.log('🐛 DEBUG: Attempting Zod validation...');
      const validationResult = NeedAgentIQSimpleOutputSchema.safeParse(parsed);
      console.log('🐛 DEBUG: Zod validation result:', {
        success: validationResult.success,
        error: !validationResult.success ? validationResult.error.issues : null,
        data: validationResult.success ? validationResult.data : null
      });
      
      if (!validationResult.success) {
        throw new Error(`Zod validation failed: ${JSON.stringify(validationResult.error.issues)}`);
      }
      
      // Enrich and validate output
      insights = validationResult.data.map(insight => {
        // Auto-generate key if missing
        const key = insight.key || `${sectionId}_${insight.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}`;
        
        // Extract monthly impact from description if missing
        let monthlyImpactUsd = insight.monthlyImpactUsd || 0;
        if (!insight.monthlyImpactUsd && insight.description) {
          // Try to extract dollar amounts from description
          const dollarMatches = insight.description.match(/\$([0-9,]+)/g);
          if (dollarMatches) {
            const amounts = dollarMatches.map(m => parseInt(m.replace(/[\$,]/g, '')));
            monthlyImpactUsd = Math.max(...amounts) || 0;
          }
        }
        
        // Normalize priority to valid enum values
        const normalizedPriority = insight.priority === 'urgent' ? 'high' : insight.priority;
        
        return {
          ...insight,
          key,
          monthlyImpactUsd,
          priority: normalizedPriority,
          rationale: insight.rationale.map(s => s.slice(0, 240)), // hard cap to avoid PII spill
          skill: insight.skill || {
            name: insight.category || 'Business Optimization',
            id: key
          }
        };
      });
    }
    
    console.log('🐛 DEBUG: Final insights:', {
      count: insights.length,
      insights: insights
    });
    
  } catch (parseError) {
    const errorObj = parseError as Error;
    console.log('🐛 DEBUG: Parse error details:', {
      errorName: errorObj.name,
      errorMessage: errorObj.message,
      stack: errorObj.stack?.slice(0, 300),
      contentBeingParsed: content?.slice(0, 500) + (content?.length > 500 ? '...' : '')
    });
    
    // Fallback to empty array on parse error
    insights = [];
  }

  return insights;
}

async function fileExists(p: string) {
  try { const s = await Deno.stat(p); return s.isFile; } catch { return false; }
}