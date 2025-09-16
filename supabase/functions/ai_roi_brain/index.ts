import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractRelevantKB } from '../_shared/kb/roibrain.ts'
import type { KBPayload } from '../_shared/kb/types.ts'
import { logger } from '../_shared/logger.ts'
import { ROIBrainInputSchema, VoiceFitOutputSchema } from '../_shared/validation.ts'
import { z } from 'https://esm.sh/zod@3.22.4'
import { corsHeaders } from '../_shared/env.ts'

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

    // Validate the parsed response with better error handling
    let validatedResponse;
    try {
      validatedResponse = VoiceFitOutputSchema.parse(parsedContent);
    } catch (aiValidationError) {
      logger.error('AI output validation failed', { 
        error: aiValidationError instanceof z.ZodError ? aiValidationError.errors : aiValidationError.message,
        aiContent: aiContent.substring(0, 500)
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
          vertical: normalizedContext.vertical,
          businessSize: intelligence.businessSize,
          urgencyLevel: intelligence.urgencyLevel,
          technicalReadiness: intelligence.technicalReadiness
        },
        phase: 'Claude Integration - Phase 2 Complete'
      }
    };

    logger.info('ROI Brain computation completed', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      processingTime: totalTime,
      aiTime: claudeTime,
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