import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractRelevantKB } from '../_shared/kb/roibrain.ts'
import type { KBPayload } from '../_shared/kb/types.ts'
import { logger } from '../_shared/logger.ts'
import { ROIBrainInputSchema, VoiceFitOutputSchema } from '../_shared/validation.ts'
import { z } from 'https://esm.sh/zod@3.22.4'
import { corsHeaders } from '../_shared/env.ts'

// Initialize Supabase for L2 cache
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate cache key based on input
function generateCacheKey(input: any): string {
  const keyData = {
    vertical: input.vertical,
    auditAnswers: input.auditAnswers,
    scoreSummary: input.scoreSummary,
    moneyLostSummary: input.moneyLostSummary || input.moneylost
  };
  
  // Create a deterministic hash of the input
  const jsonStr = JSON.stringify(keyData, Object.keys(keyData).sort());
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Check L2 cache for existing results
async function checkCache(cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('roi_brain_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Update access count
    await supabase
      .from('roi_brain_cache')
      .update({ access_count: data.access_count + 1 })
      .eq('id', data.id);

    return data.ai_response;
  } catch (error) {
    logger.warn('Cache check failed', { error: error.message, cacheKey });
    return null;
  }
}

// Store result in L2 cache
async function storeInCache(cacheKey: string, businessContext: any, aiResponse: any, processingTime: number, costs: any): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    await supabase
      .from('roi_brain_cache')
      .insert({
        cache_key: cacheKey,
        business_context: businessContext,
        kb_payload: {}, // Could store KB payload if needed
        ai_response: aiResponse,
        processing_time: processingTime,
        input_tokens: costs.inputTokens || 0,
        output_tokens: costs.outputTokens || 0,
        total_cost: costs.totalCost || 0,
        expires_at: expiresAt.toISOString()
      });

    logger.info('Result cached successfully', { cacheKey });
  } catch (error) {
    logger.warn('Failed to cache result', { error: error.message, cacheKey });
  }
}

// Schema for what Claude AI should return (matches the prompt format)
// Parts status schema for granular failure tracking
const PartsStatusSchema = z.object({
  iq: z.boolean(),        // needAgentIQInsights generation success
  report: z.boolean(),    // voiceFitReport generation success  
  skills: z.boolean()     // skillScopeContext generation success
});

const AIResponseSchema = z.object({
  score: z.number(),
  band: z.string(),
  diagnosis: z.array(z.string()),
  consequences: z.array(z.string()),
  solutions: z.array(z.object({
    skillId: z.string(),
    title: z.string(),
    rationale: z.string(),
    estimatedRecoveryPct: z.tuple([z.number(), z.number()])
  })),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string()
  })),
  plan: z.object({
    name: z.string(),
    priceMonthlyUsd: z.number(),
    inclusions: z.array(z.string())
  }),
  skillScopeContext: z.object({
    recommendedSkills: z.array(z.object({
      id: z.string(),
      name: z.string(),
      target: z.enum(["Dental", "HVAC", "Both"]),
      problem: z.string(),
      how: z.string(),
      roiRangeMonthly: z.tuple([z.number(), z.number()]).optional(),
      implementation: z.object({
        time_weeks: z.number().optional(),
        phases: z.array(z.string()).optional()
      }).optional(),
      integrations: z.array(z.string()).optional(),
      priority: z.enum(["high", "medium", "low"]),
      rationale: z.string()
    })),
    contextSummary: z.string(),
    implementationReadiness: z.number() // 1-100 scale
  }).optional(),
  needAgentIQInsights: z.array(z.object({
    title: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    priority: z.enum(["high", "medium", "low"]),
    category: z.string(),
    rationale: z.array(z.string()),
    monthlyImpactUsd: z.number(),
    actionable: z.boolean()
  })).optional(),
  parts: PartsStatusSchema.optional()
});

// Type definitions for ROI Brain Business Context (normalized)
interface BusinessContextNormalized {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary: {
    overall: number;
    sections: Array<{ sectionId?: string; name?: string; score: number }>;
  };
  moneyLostSummary: {
    total: {
      dailyUsd: number;
      monthlyUsd: number;
      annualUsd: number;
    };
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

// Input Normalizer Class - Centralized Architecture Component
class InputNormalizer {
  static normalize(rawInput: any): BusinessContextNormalized {
    const vertical = rawInput.vertical || 'dental';
    const auditAnswers = rawInput.auditAnswers || {};
    
    // Normalize scoreSummary with defaults
    const scoreSummary = {
      overall: rawInput.scoreSummary?.overall || 50,
      sections: rawInput.scoreSummary?.sections || []
    };
    
    // Ensure sections have required fields
    if (scoreSummary.sections.length === 0) {
      // Create default sections based on vertical
      const defaultSections = vertical === 'dental' 
        ? [
            { sectionId: 'patient_communication', name: 'Patient Communication', score: 50 },
            { sectionId: 'appointment_management', name: 'Appointment Management', score: 50 },
            { sectionId: 'follow_up', name: 'Follow Up', score: 50 }
          ]
        : [
            { sectionId: 'customer_service', name: 'Customer Service', score: 50 },
            { sectionId: 'scheduling', name: 'Scheduling', score: 50 },
            { sectionId: 'emergency_response', name: 'Emergency Response', score: 50 }
          ];
      scoreSummary.sections = defaultSections;
    } else {
      // Ensure existing sections have name field
      scoreSummary.sections = scoreSummary.sections.map((section: any, index: number) => ({
        sectionId: section.sectionId || `section_${index}`,
        name: section.name || `Section ${index + 1}`,
        score: section.score || 50
      }));
    }
    
    // Normalize moneyLostSummary - handle both formats
    let moneyLostSummary;
    
    if (rawInput.moneyLostSummary) {
      // Already in correct format
      moneyLostSummary = rawInput.moneyLostSummary;
    } else if (rawInput.moneylost) {
      // Convert from legacy moneylost format
      const moneylost = rawInput.moneylost;
      moneyLostSummary = {
        total: {
          dailyUsd: moneylost.monthlyUsd ? moneylost.monthlyUsd / 30 : 1000,
          monthlyUsd: moneylost.monthlyUsd || 30000,
          annualUsd: moneylost.monthlyUsd ? moneylost.monthlyUsd * 12 : 360000
        },
        areas: moneylost.areas || [
          {
            key: 'missed_calls',
            title: 'Missed Calls',
            dailyUsd: 100,
            monthlyUsd: 3000,
            annualUsd: 36000,
            recoverablePctRange: { min: 70, max: 90 },
            rationale: ['Automated call handling can capture most missed calls']
          }
        ]
      };
    } else {
      // Create default moneyLostSummary
      moneyLostSummary = {
        total: {
          dailyUsd: 1000,
          monthlyUsd: 30000,
          annualUsd: 360000
        },
        areas: [
          {
            key: 'missed_calls',
            title: 'Missed Calls',
            dailyUsd: 500,
            monthlyUsd: 15000,
            annualUsd: 180000,
            recoverablePctRange: { min: 70, max: 90 },
            rationale: ['Automated call handling can capture most missed calls']
          },
          {
            key: 'scheduling_inefficiency',
            title: 'Scheduling Inefficiency',
            dailyUsd: 300,
            monthlyUsd: 9000,
            annualUsd: 108000,
            recoverablePctRange: { min: 60, max: 80 },
            rationale: ['AI scheduling can optimize appointment slots']
          }
        ]
      };
    }
    
    return {
      vertical,
      auditAnswers,
      scoreSummary,
      moneyLostSummary
    };
  }
}

// Note: KBPayload interface now imported from shared types

// Business Intelligence Extractor - Enhanced with Null Safety
class BusinessContextExtractor {
  static extractBusinessIntelligence(context: BusinessContextNormalized): {
    businessSize: 'small' | 'medium' | 'large';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    primaryPainPoints: string[];
    technicalReadiness: number;
    implementationComplexity: 'simple' | 'moderate' | 'complex';
  } {
    const { vertical, auditAnswers, scoreSummary, moneyLostSummary } = context;
    
    // Business Size Detection with null safety
    let businessSize: 'small' | 'medium' | 'large' = 'medium';
    if (vertical === 'dental') {
      const chairs = String(auditAnswers?.['dental_chairs_active_choice'] ?? '3_4');
      businessSize = chairs === '1_2' ? 'small' : chairs === '5_8' ? 'large' : 'medium';
    } else {
      const techs = String(auditAnswers?.['field_technicians_count_choice'] ?? '3_5');
      businessSize = techs === '1_2' ? 'small' : techs === '6_10' ? 'large' : 'medium';
    }

    // Urgency Level (based on money lost) with null safety
    const monthlyLoss = moneyLostSummary?.total?.monthlyUsd ?? 30000;
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (monthlyLoss > 50000) urgencyLevel = 'critical';
    else if (monthlyLoss > 25000) urgencyLevel = 'high';
    else if (monthlyLoss > 10000) urgencyLevel = 'medium';

    // Primary Pain Points Identification with null safety
    const areas = moneyLostSummary?.areas ?? [];
    const primaryPainPoints = areas
      .sort((a, b) => (b?.monthlyUsd ?? 0) - (a?.monthlyUsd ?? 0))
      .slice(0, 3)
      .map(area => area?.key ?? 'operational_efficiency')
      .filter(Boolean);
    
    // Ensure at least one pain point
    if (primaryPainPoints.length === 0) {
      primaryPainPoints.push('operational_efficiency');
    }

    // Technical Readiness Score with null safety
    const technicalReadiness = Math.max(0, Math.min(100, scoreSummary?.overall ?? 50));

    // Implementation Complexity Assessment
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

  static generateContextualPrompt(context: BusinessContextNormalized, intelligence: ReturnType<typeof BusinessContextExtractor.extractBusinessIntelligence>): string {
    const { vertical, moneyLostSummary } = context;
    const { businessSize, urgencyLevel, primaryPainPoints, technicalReadiness, implementationComplexity } = intelligence;

    // Null-safe access to moneyLostSummary
    const totalLoss = moneyLostSummary?.total?.monthlyUsd ?? 30000;
    const areas = moneyLostSummary?.areas ?? [];
    const topAreas = areas.slice(0, 3);

    return `
BUSINESS ANALYSIS CONTEXT:
- Vertical: ${vertical.toUpperCase()}
- Size: ${businessSize} (${businessSize === 'small' ? '<3 staff' : businessSize === 'large' ? '>8 staff' : '3-8 staff'})
- Monthly Revenue at Risk: $${totalLoss.toLocaleString()}
- Urgency Level: ${urgencyLevel.toUpperCase()}
- Technical Readiness: ${technicalReadiness}%
- Implementation Complexity: ${implementationComplexity}

TOP LOSS AREAS:
${topAreas.length > 0 ? topAreas.map((area, i) => 
  `${i + 1}. ${area?.title ?? 'Unknown Area'}: $${(area?.monthlyUsd ?? 0).toLocaleString()}/month`
).join('\n') : '1. General Operational Inefficiency: $10,000/month'}

STRATEGIC FOCUS:
- Primary Pain Points: ${primaryPainPoints.join(', ')}
- Recovery Potential: $${Math.round(areas.reduce((sum, area) => 
  sum + ((area?.monthlyUsd ?? 0) * (((area?.recoverablePctRange?.min ?? 50) + (area?.recoverablePctRange?.max ?? 80)) / 200)), 0
)).toLocaleString()}/month

RECOMMENDATION CRITERIA:
- Match ${urgencyLevel} urgency level with appropriate solutions
- Consider ${implementationComplexity} implementation for ${businessSize} business
- Focus on ${primaryPainPoints[0] ?? 'operational_efficiency'} as primary area
- Technical readiness score: ${technicalReadiness}% - ${technicalReadiness > 70 ? 'high adoption potential' : technicalReadiness > 40 ? 'moderate training needed' : 'extensive onboarding required'}

NEEDAGENTIQ_INSIGHTS_REQUIREMENTS:

🎯 PERSONA & ROLE:
You are Fabio Sarcona an expert AI consultant with deep understanding of ${vertical} business operations, Founder & Strategic Advisor at NeedAgent.AI. You are NOT a generic AI.
You are the voice of NeedAgentIQ™, our proprietary real-time intelligence system.
Generate 1 targeted insight per audit section where specific problems are identified - be natural, consultative, and vary your approach
Use a professional yet approachable tone that's data-driven but conversational, avoiding technical jargon
For basic business issues (sections 1-2): Provide strategic business consulting insights
For ${vertical} specific sections, recommend the appropriate VoiceSkill when problems are detected
Your mission: Act like a consultant in a live strategy call - analyze, expose money leaks, recommend exact Voice Skills with realistic ROI.

🧩 ACTIVATION LOGIC:
- Only trigger insights when ≥3 meaningful answers are available in a section that form a clear pattern
- Each section (3-7) can produce maximum 1 strong insight
- Do NOT repeat the same Voice Skill across multiple insights unless absolutely necessary
- If the same Skill applies to multiple problems → consolidate into single insight showing combined impact

📊 MANDATORY KB ALIGNMENT:
- Use ONLY Voice Skills and ROI ranges from the official NeedAgent.AI Knowledge Base
- Never invent new services, names, promises, or numbers outside the KB
- Keep estimates realistic, not hyped
- Reference approved benchmarks and proof points

🗂️ SECTION → VOICE SKILL MAPPING (STRICT):
${vertical === 'dental' ? `
DENTAL VERTICAL:
• Section 3 → "Reception 24/7 Agent" (call handling problems)
• Section 4 → "Prevention & No-Show Agent" (scheduling/no-show issues)  
• Section 5 → "Treatment Plan Closer Agent" (case acceptance problems)
• Section 6 → "Recall & Reactivation Agent" (patient retention issues)
• Section 7 → "Review Booster Agent" (reputation/review issues)` : `
HVAC VERTICAL:
• Section 3 → "Reception 24/7 Agent and Emergency Management" (call/emergency handling)
• Section 4 → "Quote Follow-Up Agent" (quote follow-up issues)
• Section 5 → "Reception 24/7 Agent and Emergency Management" (service delivery issues)
• Section 6 → "Contract Closer Agent" (maintenance contract issues)
• Section 7 → "Review Booster Agent" (reputation/review issues)`}

🔄 ANTI-DUPLICATION SYSTEM:
Maintain internal Coverage Ledger: track {section, recommended_skill, problems_solved[], est_monthly_recovery$}
Rules:
- No duplicates. If same skill is relevant again, DO NOT create new insight
- Instead: update existing insight (expand scope) or create short addendum
- Rotate categories for diversity across insights
- Merge policy: combine problems solved by same skill into "Combined Impact"

📋 OUTPUT STRUCTURE for section 3,4,5,6,7:
Each insight must follow this flow:

1. TITLE (urgent, money-focused)
2. DIAGNOSIS (evidence-based)
3. ESTIMATED RECOVERY (realistic from KB)
4. VOICE SKILL TO ACTIVATE (exact name from mapping)
5. MINI-PLAN (1-3 actionable steps)
6. BENCHMARK/PROOF (from KB)
7. SOFT CTA:
   Example: "Start here — it's the fastest win to stop the bleeding."

📋 OUTPUT STRUCTURE for section 1-2:
For basic business issues: Provide strategic business consulting insights. 
If, on the other hand, the customer says they don't have a website, you should tell them that NeedAgent AI can also help them create a professional website tailored to their needs and integrated with all AI systems.

🎨 TONE GUIDELINES:
- Speak as Fabio: sharp, consultative, empathetic
- Focus on money lost and money recovered
- Be clear, simple, non-technical
- Add urgency but avoid being pushy  
- Each insight should feel like a revelation, not a generic report
- American English, warm and ROI-focused

🎯 CURRENT BUSINESS CONTEXT:
- Primary loss areas: ${topAreas.map(area => area?.title || 'Unknown').join(', ')}
- Total monthly bleeding: $${totalLoss.toLocaleString()}
- Technical readiness: ${technicalReadiness}%
- Urgency level: ${urgencyLevel}

Each insight must include: title, description, impact level ('high'/'medium'/'low'), priority, category, rationale, monthlyImpactUsd, actionable status

SKILLSCOPE_GENERATION_REQUIREMENTS:
- Generate comprehensive skill context for the most relevant voice skill based on primary pain point: ${primaryPainPoints[0] ?? 'operational_efficiency'}
- Include: skill name, vertical, business size, summary, what it does, how it works, revenue impact, key benefits
- Calculate realistic implementation timeline (weeks) based on business size and technical readiness
- Provide proven results with stats typical for ${businessSize} ${vertical} businesses
- Include specific requirements: prerequisites, data needed for implementation
- Connect directly to business context with ${totalLoss.toLocaleString()}/month loss potential
`;
  }
}

// CORS headers imported from shared env

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const startTime = Date.now();
    logger.info('ROI Brain function started - Claude Integration Phase');
    
    const rawInput = await req.json();
    
    // Generate cache key for L2 caching
    const cacheKey = generateCacheKey(rawInput);
    
    // Check L2 cache first
    const cachedResult = await checkCache(cacheKey);
    if (cachedResult) {
      logger.info('Cache hit - returning cached result', { cacheKey });
      return new Response(JSON.stringify({
        ...cachedResult,
        cacheHit: true,
        processingTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step 1: Validate raw input with flexible schema
    let validInput;
    try {
      validInput = ROIBrainInputSchema.parse(rawInput);
    } catch (validationError) {
      logger.error('Input validation failed', { 
        error: validationError instanceof z.ZodError ? validationError.errors : validationError.message,
        rawInput: JSON.stringify(rawInput, null, 2).substring(0, 1000)
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input format', 
        details: validationError instanceof z.ZodError ? validationError.errors : [validationError.message],
        hint: 'Check that vertical, auditAnswers are provided. scoreSummary and money data are optional and will be defaulted.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Normalize input to consistent format (Centralized Architecture Component)
    const normalizedContext = InputNormalizer.normalize(validInput);
    logger.info('Input normalized successfully', {
      vertical: normalizedContext.vertical,
      sectionsCount: normalizedContext.scoreSummary.sections.length,
      hasMoneyData: !!normalizedContext.moneyLostSummary,
      totalMonthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd
    });
    
    // Step 3: Extract business intelligence from normalized context
    const intelligence = BusinessContextExtractor.extractBusinessIntelligence(normalizedContext);
    logger.info('Business Intelligence extracted', intelligence);
    
    // Step 4: Generate contextual prompt
    const contextualPrompt = BusinessContextExtractor.generateContextualPrompt(normalizedContext, intelligence);
    
    // Step 5: Extract relevant KB data based on business context
    const kbPayload = extractRelevantKB(normalizedContext);
    
    // Enhanced logging for debugging data quality
    logger.info('Business context extracted', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      technicalReadiness: intelligence.technicalReadiness,
      auditResponsesCount: Object.keys(normalizedContext.auditAnswers).length,
      aiReadinessScore: normalizedContext.scoreSummary.overall,
      moneyLostItems: normalizedContext.moneyLostSummary?.areas?.length || 0,
      totalMonthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd,
      primaryPainPoints: intelligence.primaryPainPoints
    });
    
    // Log KB payload structure for debugging
    if (kbPayload) {
      logger.info('KB payload structure', {
        voiceSkillsCount: kbPayload.voiceSkills?.length || 0,
        painPointsCount: kbPayload.painPoints?.length || 0,
        pricingTiersCount: kbPayload.pricing?.length || 0,
        faqItemsCount: kbPayload.faq?.length || 0,
        hasResponseModels: !!kbPayload.responseModels,
        brandDataPresent: !!kbPayload.brand
      });
    }

    // Make Claude API call with enhanced prompt
    const claudeStart = Date.now();
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000, // Increased from 4000 to prevent truncation
        messages: [{
          role: 'user',
          content: `${contextualPrompt}

CRITICAL: Return ONLY raw JSON. Do not include markdown code fences (\`\`\`json), backticks, or any explanations before or after the JSON.

You are generating a VoiceFit report for a ${normalizedContext.vertical} business. Respond with valid JSON matching this exact structure:

{
  "score": <number 1-100>,
  "band": "<Crisis|Optimization Needed|Growth Ready|AI-Optimized>",
  "diagnosis": ["<specific issues found>"],
  "consequences": ["<business impact statements>"],
  "solutions": [
    {
      "skillId": "<skill_identifier>",
      "title": "<solution name>",
      "rationale": "<why this helps>",
      "estimatedRecoveryPct": [<min_pct>, <max_pct>]
    }
  ],
  "faq": [
    {
      "q": "<common question>",
      "a": "<helpful answer>"
    }
  ],
  "plan": {
    "name": "<plan name>",
    "priceMonthlyUsd": <number>,
    "inclusions": ["<feature 1>", "<feature 2>"]
  },
  "skillScopeContext": {
    "recommendedSkills": [
      {
        "id": "<unique_skill_id>",
        "name": "<skill name>",
        "target": "${normalizedContext.vertical === 'dental' ? 'Dental' : 'HVAC'}",
        "problem": "<specific problem this skill solves>",
        "how": "<how the skill works>",
        "roiRangeMonthly": [<min_monthly_roi>, <max_monthly_roi>],
        "implementation": {
          "time_weeks": <number>,
          "phases": ["<phase 1>", "<phase 2>"]
        },
        "integrations": ["<integration 1>", "<integration 2>"],
        "priority": "<high|medium|low>",
        "rationale": "<why this skill is recommended for this business>"
      }
    ],
    "contextSummary": "<brief summary of why these skills were selected>",
    "implementationReadiness": <number 1-100>
  },
  "needAgentIQInsights": [
    {
      "title": "<specific insight title>",
      "description": "<detailed description of the insight>",
      "impact": "<specific business impact>",
      "priority": "<high|medium|low>",
      "category": "<category based on pain points: ${intelligence.primaryPainPoints.join('|')}>",
      "rationale": ["<reason 1>", "<reason 2>"],
      "monthlyImpactUsd": <estimated monthly impact in USD>,
      "actionable": true
    }
  ]
}

Use this KB data for context: ${JSON.stringify(kbPayload, null, 2)}`
        }]
      })
    });

    const claudeTime = Date.now() - claudeStart;

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.statusText}`);
    }

    const claudeData = await claudeResponse.json();
    const aiContent = claudeData.content[0]?.text;

    if (!aiContent) {
      throw new Error('No content returned from Claude API');
    }

    // Enhanced logging for Claude's raw response
    logger.info('Claude raw response received', {
      responseLength: aiContent.length,
      tokensUsed: {
        input: claudeData.usage?.input_tokens,
        output: claudeData.usage?.output_tokens
      },
      isTruncated: aiContent.length >= 7500,
      contentPreview: aiContent.substring(0, 200) // First 200 chars for debugging
    });

    // Log response length and check for truncation
    logger.info('Claude response received', { 
      contentLength: aiContent.length,
      isTruncated: aiContent.length >= 7500, // Close to max_tokens limit
      tokenUsage: claudeData.usage
    });

    // Helper function to extract JSON from markdown-wrapped text
    function extractJsonFromText(text: string): any {
      // First, try to find JSON within markdown code blocks
      const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
      const match = text.match(jsonBlockRegex);
      
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (error) {
          logger.warn('Found markdown block but failed to parse JSON', { error: error.message });
        }
      }
      
      // Try direct parsing
      try {
        return JSON.parse(text);
      } catch (error) {
        // Last resort: try to extract balanced braces
        const braceStart = text.indexOf('{');
        const braceEnd = text.lastIndexOf('}');
        
        if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
          const extracted = text.substring(braceStart, braceEnd + 1);
          try {
            return JSON.parse(extracted);
          } catch (extractError) {
            logger.error('All JSON extraction methods failed', { 
              originalError: error.message,
              extractError: extractError.message,
              contentPreview: text.substring(0, 200) 
            });
          }
        }
        
        throw new Error(`Unable to extract valid JSON. Content: ${text.substring(0, 200)}...`);
      }
    }

    // Parse Claude's JSON response with robust extraction
    let parsedContent;
    try {
      parsedContent = extractJsonFromText(aiContent);
      logger.info('Successfully extracted JSON from AI response');
    } catch (error) {
      logger.error('Failed to parse Claude response as JSON', { 
        error: error.message, 
        contentPreview: aiContent.substring(0, 300),
        contentLength: aiContent.length
      });
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the parsed response with AIResponseSchema first
    let validatedAIResponse;
    try {
      validatedAIResponse = AIResponseSchema.parse(parsedContent);
      
      // Data quality validation
      const diagnosisLength = validatedAIResponse.diagnosis?.join(' ').length || 0;
      const consequencesCount = validatedAIResponse.consequences?.length || 0;
      const solutionsCount = validatedAIResponse.solutions?.length || 0;
      
      // Log data quality metrics
      logger.info('Data quality metrics', {
        diagnosisLength,
        consequencesCount,
        solutionsCount,
        hasVerticalSpecificContent: diagnosisLength > 100 && consequencesCount > 2,
        dataQuality: diagnosisLength > 200 && consequencesCount > 3 ? 'high' : 
                     diagnosisLength > 100 && consequencesCount > 2 ? 'medium' : 'low',
        vertical: normalizedContext.vertical,
        businessSize: intelligence.businessSize
      });
      
      // Validation for vertical-specific content
      const isVerticalSpecific = validatedAIResponse.diagnosis.some(d => 
        d.toLowerCase().includes(normalizedContext.vertical.toLowerCase()) ||
        (normalizedContext.vertical === 'dental' && (d.toLowerCase().includes('patient') || d.toLowerCase().includes('appointment'))) ||
        (normalizedContext.vertical === 'hvac' && (d.toLowerCase().includes('customer') || d.toLowerCase().includes('service')))
      );
      
      if (!isVerticalSpecific) {
        logger.warn('Low vertical personalization detected', {
          vertical: normalizedContext.vertical,
          diagnosisPreview: validatedAIResponse.diagnosis[0]?.substring(0, 100) + '...',
          businessName: normalizedContext.auditAnswers?.business_name
        });
      }
      
      logger.info('AI response validated successfully');
    } catch (aiValidationError) {
      logger.error('AI output validation failed', { 
        error: aiValidationError instanceof z.ZodError ? aiValidationError.errors : aiValidationError.message,
        aiContent: aiContent.substring(0, 1000) // Show more content for debugging
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI generated invalid response format', 
        details: aiValidationError instanceof z.ZodError ? aiValidationError.errors : [aiValidationError.message],
        phase: 'AI Output Validation'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parts validation function to determine section success
    function validateParts(aiResponse: z.infer<typeof AIResponseSchema>): { iq: boolean; report: boolean; skills: boolean } {
      // IQ validation: Check if needAgentIQInsights is valid and complete
      const iqSuccess = !!(aiResponse.needAgentIQInsights && 
        aiResponse.needAgentIQInsights.length >= 1 && 
        aiResponse.needAgentIQInsights.every(insight => 
          insight.title && insight.description && insight.impact &&
          insight.priority && insight.category && insight.rationale?.length > 0
        ));

      // Report validation: Check if core VoiceFit fields are present and valid
      const reportSuccess = !!(aiResponse.score && 
        aiResponse.band && 
        aiResponse.diagnosis?.length >= 2 && 
        aiResponse.consequences?.length >= 2 && 
        aiResponse.solutions?.length >= 1 &&
        aiResponse.faq?.length >= 2 &&
        aiResponse.plan?.name && aiResponse.plan?.priceMonthlyUsd);

      // Skills validation: Check if skillScopeContext is valid and complete
      const skillsSuccess = !!(aiResponse.skillScopeContext && 
        aiResponse.skillScopeContext.recommendedSkills?.length >= 1 && 
        aiResponse.skillScopeContext.contextSummary &&
        aiResponse.skillScopeContext.recommendedSkills.every(skill => 
          skill.id && skill.name && skill.rationale && skill.priority
        ));

      return { iq: iqSuccess, report: reportSuccess, skills: skillsSuccess };
    }

    // Map AI response to VoiceFit format
    function mapAIToVoiceFit(aiResponse: z.infer<typeof AIResponseSchema>): z.infer<typeof VoiceFitOutputSchema> {
      return {
        success: true,
        score: aiResponse.score,
        band: aiResponse.band,
        diagnosis: aiResponse.diagnosis,
        consequences: aiResponse.consequences,
        solutions: aiResponse.solutions.map(sol => ({
          skillId: sol.skillId,
          title: sol.title,
          rationale: sol.rationale,
          estimatedRecoveryPct: sol.estimatedRecoveryPct
        })),
        faq: aiResponse.faq,
        plan: aiResponse.plan
      };
    }

    const voiceFitResponse = mapAIToVoiceFit(validatedAIResponse);

    // Enhanced response with business context and Claude integration
    const totalTime = Date.now() - startTime;
    
    // Calculate data quality score
    const diagnosisLength = validatedAIResponse.diagnosis?.join(' ').length || 0;
    const consequencesCount = validatedAIResponse.consequences?.length || 0;
    const dataQuality = diagnosisLength > 200 && consequencesCount > 3 ? 'high' : 
                       diagnosisLength > 100 && consequencesCount > 2 ? 'medium' : 'low';
    
    // Validate parts and create fallbacks
    const partsStatus = validateParts(validatedAIResponse);
    
    // Generate fallback IQ insights if needed
    const fallbackIQInsights = [{
      title: "Business Intelligence Analysis",
      description: `Based on your ${intelligence.businessSize} business profile, immediate focus on ${intelligence.primaryPainPoints.join(' and ')} could yield ${intelligence.urgencyLevel === 'high' ? 'significant' : 'moderate'} ROI improvements.`,
      impact: `Potential monthly recovery: $${Math.round((normalizedContext.moneyLostSummary?.total?.monthlyUsd || 30000) * 0.4).toLocaleString()}`,
      priority: intelligence.urgencyLevel as 'high' | 'medium' | 'low',
      category: intelligence.primaryPainPoints[0] || 'operational_efficiency',
      rationale: [
        `Current monthly loss: $${(normalizedContext.moneyLostSummary?.total?.monthlyUsd || 30000).toLocaleString()}`,
        `Technical readiness score: ${intelligence.technicalReadiness}%`,
        `Implementation complexity: ${intelligence.implementationComplexity}`
      ],
      monthlyImpactUsd: Math.round((normalizedContext.moneyLostSummary?.total?.monthlyUsd || 30000) * 0.4),
      actionable: true
    }];

    // Log parts status for monitoring
    logger.info('Parts validation completed', {
      partsStatus,
      totalPartsSuccessful: Object.values(partsStatus).filter(Boolean).length,
      failedParts: Object.entries(partsStatus).filter(([_, success]) => !success).map(([part, _]) => part)
    });

    // Determine overall success - at least one part must succeed
    const overallSuccess = partsStatus.iq || partsStatus.report || partsStatus.skills;

    const response = {
      success: overallSuccess,
      parts: partsStatus,
      sessionId: `roi_brain_${Date.now()}`,
      voiceFitReport: partsStatus.report ? voiceFitResponse : null,
      needAgentIQInsights: partsStatus.iq ? validatedAIResponse.needAgentIQInsights : fallbackIQInsights,
      skillScopeContext: partsStatus.skills ? validatedAIResponse.skillScopeContext : null,
      businessIntelligence: intelligence,
      contextualPrompt: contextualPrompt.substring(0, 500) + '...',
      processingTime: {
        total: totalTime,
        ai: claudeTime,
        cache: 0
      },
      costs: {
        inputTokens: claudeData.usage?.input_tokens || 0,
        outputTokens: claudeData.usage?.output_tokens || 0,
        totalCost: ((claudeData.usage?.input_tokens || 0) * 0.000003) + ((claudeData.usage?.output_tokens || 0) * 0.000015)
      },
      cacheHit: false,
      metadata: {
        version: '2.0',
        kbVersion: 'roibrain-centralized-v1',
        dataQuality,
        businessContext: {
          vertical: normalizedContext.vertical,
          businessSize: intelligence.businessSize,
          urgencyLevel: intelligence.urgencyLevel,
          technicalReadiness: intelligence.technicalReadiness
        },
        qualityMetrics: {
          diagnosisLength,
          consequencesCount,
          solutionsCount: validatedAIResponse.solutions?.length || 0,
          verticalPersonalization: validatedAIResponse.diagnosis.some(d => 
            d.toLowerCase().includes(normalizedContext.vertical.toLowerCase())
          )
        },
        phase: 'Claude Integration - Phase 2 Complete'
      }
    };

    // Store in L2 cache for future requests
    await storeInCache(cacheKey, normalizedContext, response, totalTime, response.costs);

    logger.info('ROI Brain computation completed', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      processingTime: totalTime,
      aiTime: claudeTime,
      cacheKey,
      dataQuality,
      qualityMetrics: {
        diagnosisLength,
        consequencesCount,
        verticalPersonalization: validatedAIResponse.diagnosis.some(d => 
          d.toLowerCase().includes(normalizedContext.vertical.toLowerCase())
        )
      },
      normalizedInput: {
        sectionsCount: normalizedContext.scoreSummary.sections.length,
        monthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd
      }
    });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('ROI Brain processing failed', { 
      error: error.message,
      stack: error.stack,
      phase: 'Runtime Error'
    });
    
    // This should not happen as we handle Zod errors above
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unexpected validation error', 
        details: error.errors,
        phase: 'Unexpected Validation'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Runtime errors (500)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal processing error',
        message: error.message || 'Unknown error occurred',
        phase: 'Runtime Processing'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});