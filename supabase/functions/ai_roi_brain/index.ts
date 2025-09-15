import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// Unified KB Payload Structure
interface KBPayload {
  brand: any;
  voiceSkills: any;
  painPoints: any;
  pricing: any;
  responseModels: any;
  faq: any;
  approvedClaims: string[];
  services: Array<{
    name: string;
    target: string;
    problem: string;
    how: string;
    roiRangeMonthly?: [number, number];
  }>;
}

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    console.log('ROI Brain function started - Business Context Extractor v1.0');
    
    const input = await req.json();
    console.log('Input received:', JSON.stringify(input, null, 2));

    const context: BusinessContext = input as BusinessContext;
    
    // Extract business intelligence
    const intelligence = BusinessContextExtractor.extractBusinessIntelligence(context);
    console.log('Business Intelligence:', intelligence);
    
    // Generate contextual prompt
    const contextualPrompt = BusinessContextExtractor.generateContextualPrompt(context, intelligence);
    console.log('Generated Contextual Prompt Preview:', contextualPrompt.substring(0, 300) + '...');

    // Enhanced response with real business context
    const response = {
      success: true,
      sessionId: `roi_brain_${Date.now()}`,
      voiceFitReport: {
        overall: {
          score: intelligence.technicalReadiness,
          recommendation: `${context.vertical.toUpperCase()} ${intelligence.businessSize} business with ${intelligence.urgencyLevel} urgency level. Monthly revenue at risk: $${context.moneyLostSummary.total.monthlyUsd.toLocaleString()}. Primary focus: ${intelligence.primaryPainPoints[0] || 'optimization'}.`,
          band: intelligence.technicalReadiness > 70 ? 'HIGH' : intelligence.technicalReadiness > 40 ? 'MEDIUM' : 'LOW'
        },
        sections: context.scoreSummary.sections.map(section => ({
          id: section.sectionId,
          score: section.score,
          impact: section.score < 50 ? 'high' : section.score < 70 ? 'medium' : 'low'
        })),
        recommendations: context.moneyLostSummary.areas.slice(0, 3).map((area, index) => ({
          id: `rec_${index + 1}`,
          title: `Address ${area.title}`,
          description: `Recover $${Math.round(area.monthlyUsd * ((area.recoverablePctRange.min + area.recoverablePctRange.max) / 2)).toLocaleString()}/month from ${area.key}`,
          monthly_impact_usd: Math.round(area.monthlyUsd * ((area.recoverablePctRange.min + area.recoverablePctRange.max) / 2)),
          implementation_effort: intelligence.implementationComplexity,
          roi_timeframe: intelligence.urgencyLevel === 'critical' ? '1-2 months' : '2-4 months',
          skills: [`${area.key}_automation`]
        })),
        caseStudies: [
          {
            title: `${intelligence.businessSize.toUpperCase()} ${context.vertical} Success Story`,
            problem: `Similar ${intelligence.primaryPainPoints[0]} challenges`,
            solution: `${intelligence.implementationComplexity} implementation approach`,
            result: `Average 40% improvement in ${intelligence.primaryPainPoints[0]} efficiency`
          }
        ]
      },
      needAgentIQInsights: intelligence.primaryPainPoints.map((point, index) => ({
        area: point,
        urgency: intelligence.urgencyLevel,
        potential_monthly_savings: context.moneyLostSummary.areas[index]?.monthlyUsd || 0,
        implementation_complexity: intelligence.implementationComplexity
      })),
      processingTime: {
        total: Date.now() - Date.now(),
        ai: 0, // Will be populated when Claude integration is added
        cache: 0
      },
      costs: {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      },
      metadata: {
        business_intelligence: intelligence,
        contextual_prompt_preview: contextualPrompt.substring(0, 200) + '...',
        phase: 'Business Context Extractor - Phase 2 Active'
      }
    };

    console.log('ROI Brain response generated with business context intelligence');
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('ROI Brain error:', error);
    
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