import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractRelevantKB } from '../_shared/kb/roibrain.ts'
import type { KBPayload } from '../_shared/kb/types.ts'
import { logger } from '../_shared/logger.ts'
import { ROIBrainInputSchema, VoiceFitOutputSchema } from '../_shared/validation.ts'
import { z } from 'https://esm.sh/zod@3.22.4'
import { corsHeaders } from '../_shared/env.ts'

// Type definitions for ROI Brain Business Context
interface BusinessContext {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary: {
    overall: number;
    sections: Array<{ sectionId: string; score: number }>;
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

// Note: KBPayload interface now imported from shared types

// Business Intelligence Extractor
class BusinessContextExtractor {
  static extractBusinessIntelligence(context: BusinessContext): {
    businessSize: 'small' | 'medium' | 'large';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    primaryPainPoints: string[];
    technicalReadiness: number;
    implementationComplexity: 'simple' | 'moderate' | 'complex';
  } {
    const { vertical, auditAnswers, scoreSummary, moneyLostSummary } = context;
    
    // Business Size Detection
    let businessSize: 'small' | 'medium' | 'large' = 'medium';
    if (vertical === 'dental') {
      const chairs = String(auditAnswers['dental_chairs_active_choice'] ?? '3_4');
      businessSize = chairs === '1_2' ? 'small' : chairs === '5_8' ? 'large' : 'medium';
    } else {
      const techs = String(auditAnswers['field_technicians_count_choice'] ?? '3_5');
      businessSize = techs === '1_2' ? 'small' : techs === '6_10' ? 'large' : 'medium';
    }

    // Urgency Level (based on money lost)
    const monthlyLoss = moneyLostSummary.total.monthlyUsd;
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (monthlyLoss > 50000) urgencyLevel = 'critical';
    else if (monthlyLoss > 25000) urgencyLevel = 'high';
    else if (monthlyLoss > 10000) urgencyLevel = 'medium';

    // Primary Pain Points Identification
    const primaryPainPoints = moneyLostSummary.areas
      .sort((a, b) => b.monthlyUsd - a.monthlyUsd)
      .slice(0, 3)
      .map(area => area.key);

    // Technical Readiness Score
    const technicalReadiness = Math.max(0, Math.min(100, scoreSummary.overall));

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

  static generateContextualPrompt(context: BusinessContext, intelligence: ReturnType<typeof BusinessContextExtractor.extractBusinessIntelligence>): string {
    const { vertical, moneyLostSummary } = context;
    const { businessSize, urgencyLevel, primaryPainPoints, technicalReadiness, implementationComplexity } = intelligence;

    return `
BUSINESS ANALYSIS CONTEXT:
- Vertical: ${vertical.toUpperCase()}
- Size: ${businessSize} (${businessSize === 'small' ? '<3 staff' : businessSize === 'large' ? '>8 staff' : '3-8 staff'})
- Monthly Revenue at Risk: $${moneyLostSummary.total.monthlyUsd.toLocaleString()}
- Urgency Level: ${urgencyLevel.toUpperCase()}
- Technical Readiness: ${technicalReadiness}%
- Implementation Complexity: ${implementationComplexity}

TOP LOSS AREAS:
${moneyLostSummary.areas.slice(0, 3).map((area, i) => 
  `${i + 1}. ${area.title}: $${area.monthlyUsd.toLocaleString()}/month`
).join('\n')}

STRATEGIC FOCUS:
- Primary Pain Points: ${primaryPainPoints.join(', ')}
- Recovery Potential: $${Math.round(moneyLostSummary.areas.reduce((sum, area) => 
  sum + (area.monthlyUsd * ((area.recoverablePctRange.min + area.recoverablePctRange.max) / 2)), 0
)).toLocaleString()}/month

RECOMMENDATION CRITERIA:
- Match ${urgencyLevel} urgency level with appropriate solutions
- Consider ${implementationComplexity} implementation for ${businessSize} business
- Focus on ${primaryPainPoints[0]} as primary area
- Technical readiness score: ${technicalReadiness}% - ${technicalReadiness > 70 ? 'high adoption potential' : technicalReadiness > 40 ? 'moderate training needed' : 'extensive onboarding required'}
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
    const validInput = ROIBrainInputSchema.parse(rawInput);

    const context: BusinessContext = validInput;
    
    // Extract business intelligence
    const intelligence = BusinessContextExtractor.extractBusinessIntelligence(context);
    logger.info('Business Intelligence extracted', intelligence);
    
    // Generate contextual prompt
    const contextualPrompt = BusinessContextExtractor.generateContextualPrompt(context, intelligence);
    
    // Extract relevant KB data based on business context
    const kbPayload = extractRelevantKB(context);

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
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `${contextualPrompt}

IMPORTANT: You are generating a VoiceFit report for a ${context.vertical} business. Respond with valid JSON matching this structure:

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
  }
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

    // Parse Claude's JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (error) {
      logger.error('Failed to parse Claude response as JSON', { error: error.message, content: aiContent });
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the parsed response
    const validatedResponse = VoiceFitOutputSchema.parse(parsedContent);

    // Enhanced response with business context and Claude integration
    const totalTime = Date.now() - startTime;
    const response = {
      success: true,
      sessionId: `roi_brain_${Date.now()}`,
      voiceFitReport: validatedResponse,
      needAgentIQInsights: [{
        category: intelligence.primaryPainPoints[0] || 'operational_efficiency',
        insight: `Based on your ${intelligence.businessSize} business profile, immediate focus on ${intelligence.primaryPainPoints.join(' and ')} could yield ${intelligence.urgencyLevel === 'high' ? 'significant' : 'moderate'} ROI improvements.`,
        priority: intelligence.urgencyLevel,
        actionable: true,
        estimatedImpact: intelligence.urgencyLevel === 'critical' ? 'high' : 'medium'
      }],
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
      metadata: {
        version: '2.0',
        kbVersion: 'roibrain-centralized-v1',
        businessContext: {
          vertical: validInput.vertical,
          businessSize: intelligence.businessSize,
          urgencyLevel: intelligence.urgencyLevel,
          technicalReadiness: intelligence.technicalReadiness
        },
        phase: 'Claude Integration - Phase 2 Complete'
      }
    };

    logger.info('ROI Brain computation completed', {
      vertical: validInput.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      processingTime: totalTime,
      aiTime: claudeTime
    });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('ROI Brain processing failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: { message: error.message || 'Internal server error' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});