import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { NeedAgentIQSimpleInputSchema, NeedAgentIQSimpleOutputSchema } from '../_shared/validation.ts';

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

  // No authentication required for public access

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    console.log('📥 Parsing request body...');
    // Parse and validate input
    const body = await req.json();
    console.log('📋 Body received:', JSON.stringify(body).slice(0, 200));
    const { vertical, sectionId, answersSection, language = 'en', moneyLostData = {} } = NeedAgentIQSimpleInputSchema.parse(body);
    console.log('✅ Input validated successfully');

    logger.info('Processing NeedAgentIQ request', { 
      sectionId, 
      vertical,
      answersCount: Object.keys(answersSection).length
    });

    // FASE 3: Deterministic Pipeline - Use voice skill mapping first
    console.log('🔄 FASE 3: Starting deterministic signal extraction...');
    
    // Step 1: Extract signal tags from audit answers
    const signalTags = extractSignalTags(answersSection, vertical as 'dental' | 'hvac');
    console.log('📊 Signal tags extracted:', {
      count: signalTags.length,
      tags: signalTags
    });

    // Step 2: Map signal tags to skills with ROI calculations  
    const baseInsights = mapSignalTagsToSkills(
      signalTags,
      moneyLostData, // Pass money lost data for accurate ROI calculations
      vertical as 'dental' | 'hvac',
      'medium' // Default business size
    );
    
    console.log('💡 Base insights from deterministic mapping:', {
      count: baseInsights.length,
      insights: baseInsights.map(i => ({ key: i.key, title: i.title, monthlyImpact: i.monthlyImpactUsd }))
    });

    let finalInsights: any[] = [];

    if (baseInsights.length > 0) {
      // Use deterministic insights - convert to NeedAgentIQ format
      finalInsights = baseInsights.map(insight => ({
        title: insight.title,
        description: insight.description,
        impact: insight.priority, // Map priority to impact
        priority: insight.priority,
        rationale: [insight.impact, `Category: ${insight.category}`],
        category: insight.category,
        key: insight.key,
        monthlyImpactUsd: insight.monthlyImpactUsd,
        source: 'mapping',
        skill: {
          name: insight.title,
          id: insight.skill?.id || ''
        }
      }));
      
      console.log('[ai_needagentiq] mapped_insights', finalInsights.length);
      console.log('✅ Using deterministic insights:', {
        source: 'voice_skill_mapping',
        count: finalInsights.length,
        totalMonthlyImpact: finalInsights.reduce((sum, i) => sum + i.monthlyImpactUsd, 0)
      });
      
    } else {
      // Fallback to AI enhancement when no deterministic mapping available
      console.log('⚠️ No deterministic insights found, falling back to AI enhancement...');
      
      const enhancedInsights = await enhanceWithAI(answersSection, vertical, sectionId, language);
      finalInsights = enhancedInsights;
      
      console.log('🤖 AI enhanced insights:', {
        source: 'ai_enhanced',
        count: finalInsights.length
      });
    }

    const processingTime = Date.now() - startTime;

    logger.info('NeedAgentIQ completed', { 
      sectionId, 
      vertical,
      insights: finalInsights.length,
      processingTime,
      source: baseInsights.length > 0 ? 'deterministic' : 'ai_enhanced'
    });

    return jsonOk(finalInsights);

/**
 * AI Enhancement fallback when deterministic mapping produces no results
 */
async function enhanceWithAI(
  answersSection: Record<string, unknown>,
  vertical: string, 
  sectionId: string,
  language: string
): Promise<any[]> {
  // 🐛 DEBUG: Enhanced system prompt validation
  const basePrompt = Deno.env.get('NEEDAGENT_IQ_SYSTEM_PROMPT') ?? '';
  
  // Enhanced system prompt that explicitly requests insights
  const systemPrompt = `${basePrompt}

LANGUAGE INSTRUCTIONS:
- Respond in ${language === 'it' ? 'Italian' : 'English'}
- Use professional ${language === 'it' ? 'Italian' : 'English'} terminology appropriate for business contexts
- Maintain the same JSON structure regardless of language

CRITICAL OUTPUT REQUIREMENTS:
- You MUST generate at least 1-3 actionable insights based on the provided data
- NEVER return an empty array []
- Focus on identifying specific opportunities for improvement based on the audit answers
- Each insight must include: title, description, impact, priority, rationale, and category
- If no major issues are found, provide optimization opportunities or best practices

OUTPUT FORMAT (JSON Array):
[
  {
    "title": "Specific actionable insight title",
    "description": "Clear explanation of the opportunity or issue",
    "impact": "high|medium|low",
    "priority": "urgent|high|medium|low", 
    "rationale": ["Reason 1", "Reason 2"],
    "category": "efficiency|revenue|customer_experience|technology|operations"
  }
]

EXAMPLE INSIGHTS:
- For dental practices with 1-2 chairs: "Scale Operations with Additional Treatment Rooms"
- For practices without online scheduling: "Implement Online Appointment Booking System" 
- For practices with high unanswered calls: "Deploy AI Phone Assistant for Call Management"

ALWAYS provide valuable, actionable insights that help businesses grow and improve.`;

  console.log('🐛 DEBUG: Enhanced system prompt check:', {
    exists: !!systemPrompt,
    length: systemPrompt.length,
    preview: systemPrompt.slice(0, 200) + (systemPrompt.length > 200 ? '...' : '')
  });
  
  if (!systemPrompt) {
    throw new Error('Missing system prompt');
  }

  // Load Anthropic API key
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('Missing API key');
  }

  // 🐛 DEBUG: Enhanced user message preparation
  const contextualMessage = `Please analyze this ${vertical} practice audit data for section "${sectionId}" and provide 1-3 actionable insights:

AUDIT DATA:
${JSON.stringify({ vertical, sectionId, answersSection }, null, 2)}

REQUIREMENTS:
- Identify specific opportunities for improvement
- Focus on actionable recommendations that can drive business value
- Consider the practice size and current setup from the answers provided
- Each insight should be practical and implementable
- Return insights in the specified JSON format

Generate meaningful business insights now:`;

  console.log('🐛 DEBUG: Enhanced user message:', {
    vertical,
    sectionId,
    answersCount: Object.keys(answersSection).length,
    answerKeys: Object.keys(answersSection),
    messageLength: contextualMessage.length
  });

  // 🐛 DEBUG: Anthropic request body
  const anthropicRequest = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000, // Increased for better insight generation
    messages: [
      {
        role: 'user',
        content: contextualMessage
      }
    ],
    system: systemPrompt
  };
  
  console.log('🐛 DEBUG: Anthropic request:', {
    model: anthropicRequest.model,
    max_tokens: anthropicRequest.max_tokens,
    messageLength: anthropicRequest.messages[0].content.length,
    systemPromptLength: anthropicRequest.system.length
  });

  // Call Anthropic API
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
    console.log('🐛 DEBUG: Anthropic API error:', {
      status: anthropicResponse.status,
      statusText: anthropicResponse.statusText,
      errorText: errorText.slice(0, 500)
    });
    
    throw new Error(`AI processing failed: ${errorText.slice(0, 160)}`);
  }

  const anthropicData = await anthropicResponse.json();
  console.log('🐛 DEBUG: Anthropic response structure:', {
    hasContent: !!anthropicData.content,
    contentLength: anthropicData.content?.length || 0,
    contentType: Array.isArray(anthropicData.content) ? 'array' : typeof anthropicData.content,
    usage: anthropicData.usage,
    model: anthropicData.model
  });
  
  const content = anthropicData.content?.[0]?.text;
  
  if (!content) {
    throw new Error('No content received from AI');
  }

  // Enhanced parsing with fallback
  return parseAIResponse(content, vertical, sectionId);
}

/**
 * Robust AI response parsing with fallbacks
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

  let insights = [];
  
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
    console.log('🐛 DEBUG: Parse error details:', {
      errorName: parseError.name,
      errorMessage: parseError.message,
      stack: parseError.stack?.slice(0, 300),
      contentBeingParsed: content?.slice(0, 500) + (content?.length > 500 ? '...' : '')
    });
    
    // Fallback to empty array on parse error
    insights = [];
  }

  return insights;
}

  } catch (error) {
    console.error('❌ Error in NeedAgentIQ:', error);
    logError('needagentiq_error', { 
      msg: error?.message?.slice(0, 160),
      code: error?.code,
      name: error?.name
    });

    if (error.name === 'ZodError') {
      console.log('🔍 Zod validation error:', error.issues);
      return jsonError('Invalid input format', 400);
    }

    return jsonError('Internal server error', 500);
  }
});