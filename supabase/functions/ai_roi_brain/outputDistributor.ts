// Output Distributor Module
// Distributes and formats final ROI Brain outputs

import { z } from 'https://esm.sh/zod@3.22.4';
import { VoiceFitOutputSchema } from '../_shared/validation.ts';
import type { BusinessIntelligence } from './businessExtractor.ts';

// Parts status schema for granular failure tracking
export const PartsStatusSchema = z.object({
  iq: z.boolean(),        // needAgentIQInsights generation success
  report: z.boolean(),    // voiceFitReport generation success  
  skills: z.boolean()     // skillScopeContext generation success
});

// AI Response Schema for Claude output validation
export const AIResponseSchema = z.object({
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
  benchmarks: z.array(z.string()),
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

export type AIResponseType = z.infer<typeof AIResponseSchema>;
export type PartsStatusType = z.infer<typeof PartsStatusSchema>;

/**
 * Validates different parts of the AI response for granular failure tracking
 * @param aiResponse - Validated AI response from Claude
 * @returns Parts status indicating which sections succeeded
 */
export function validateParts(aiResponse: AIResponseType): PartsStatusType {
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

/**
 * Maps AI response to VoiceFit format
 * @param aiResponse - Validated AI response
 * @returns VoiceFit-compatible response object
 */
export function mapAIToVoiceFit(aiResponse: AIResponseType): z.infer<typeof VoiceFitOutputSchema> {
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
    benchmarks: aiResponse.benchmarks,
    faq: aiResponse.faq,
    plan: aiResponse.plan
  };
}

/**
 * Generates fallback IQ insights when AI generation fails
 * @param intelligence - Business intelligence data
 * @param moneyLostSummary - Money lost summary data
 * @returns Fallback IQ insights array
 */
export function generateFallbackIQInsights(
  intelligence: BusinessIntelligence,
  moneyLostSummary: any
): Array<{
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  rationale: string[];
  monthlyImpactUsd: number;
  actionable: boolean;
}> {
  return [{
    title: "Business Intelligence Analysis",
    description: `Based on your ${intelligence.businessSize} business profile, immediate focus on ${intelligence.primaryPainPoints.join(' and ')} could yield ${intelligence.urgencyLevel === 'high' ? 'significant' : 'moderate'} ROI improvements.`,
    impact: `Potential monthly recovery: $${Math.round((moneyLostSummary?.total?.monthlyUsd || 30000) * 0.4).toLocaleString()}`,
    priority: intelligence.urgencyLevel as 'high' | 'medium' | 'low',
    category: intelligence.primaryPainPoints[0] || 'operational_efficiency',
    rationale: [
      `Current monthly loss: $${(moneyLostSummary?.total?.monthlyUsd || 30000).toLocaleString()}`,
      `Technical readiness score: ${intelligence.technicalReadiness}%`,
      `Implementation complexity: ${intelligence.implementationComplexity}`
    ],
    monthlyImpactUsd: Math.round((moneyLostSummary?.total?.monthlyUsd || 30000) * 0.4),
    actionable: true
  }];
}

/**
 * Distributes final output with all components and metadata
 * @param aiResponse - Validated AI response
 * @param intelligence - Business intelligence
 * @param processingMetrics - Processing time and cost metrics
 * @param contextualPrompt - Original contextual prompt (truncated for response)
 * @param businessContext - Normalized business context
 * @returns Complete ROI Brain response object
 */
export function distributeOutput(
  aiResponse: AIResponseType,
  intelligence: BusinessIntelligence,
  processingMetrics: {
    totalTime: number;
    aiTime: number;
    claudeData: any;
  },
  contextualPrompt: string,
  businessContext: any
): any {
  const partsStatus = validateParts(aiResponse);
  const voiceFitResponse = mapAIToVoiceFit(aiResponse);
  
  // Calculate data quality score
  const diagnosisLength = aiResponse.diagnosis?.join(' ').length || 0;
  const consequencesCount = aiResponse.consequences?.length || 0;
  const dataQuality = diagnosisLength > 200 && consequencesCount > 3 ? 'high' : 
                     diagnosisLength > 100 && consequencesCount > 2 ? 'medium' : 'low';

  // Determine overall success - at least one part must succeed
  const overallSuccess = partsStatus.iq || partsStatus.report || partsStatus.skills;

  const response = {
    success: overallSuccess,
    parts: partsStatus,
    sessionId: `roi_brain_${Date.now()}`,
    voiceFitReport: partsStatus.report ? voiceFitResponse : null,
    needAgentIQInsights: partsStatus.iq ? aiResponse.needAgentIQInsights : generateFallbackIQInsights(intelligence, businessContext.moneyLostSummary),
    skillScopeContext: partsStatus.skills ? aiResponse.skillScopeContext : null,
    businessIntelligence: intelligence,
    
    // FASE 4.3: Always include moneyLostSummary - deterministic fallback if missing
    moneyLostSummary: businessContext.moneyLostSummary || {
      monthlyUsd: 0,
      areas: [],
      source: 'roi_brain_fallback' as const,
      confidence: 0
    },
    
    contextualPrompt: contextualPrompt.substring(0, 500) + '...',
    processingTime: {
      total: processingMetrics.totalTime,
      ai: processingMetrics.aiTime,
      cache: 0
    },
    costs: {
      inputTokens: processingMetrics.claudeData.usage?.input_tokens || 0,
      outputTokens: processingMetrics.claudeData.usage?.output_tokens || 0,
      totalCost: ((processingMetrics.claudeData.usage?.input_tokens || 0) * 0.000003) + ((processingMetrics.claudeData.usage?.output_tokens || 0) * 0.000015)
    },
    cacheHit: false,
    metadata: {
      version: '2.0',
      kbVersion: 'roibrain-centralized-v1',
      dataQuality,
      businessContext: {
        vertical: businessContext.vertical,
        businessSize: intelligence.businessSize,
        urgencyLevel: intelligence.urgencyLevel,
        technicalReadiness: intelligence.technicalReadiness
      },
      qualityMetrics: {
        diagnosisLength,
        consequencesCount,
        solutionsCount: aiResponse.solutions?.length || 0,
        verticalPersonalization: aiResponse.diagnosis.some(d => 
          d.toLowerCase().includes(businessContext.vertical.toLowerCase())
        )
      },
      consistency: {
        moneyLostSource: businessContext.moneyLostSummary?.source ?? 'roi_brain_fallback',
        versions: {
          kb: 'v1',
          prompt: 'v2.0',
          signalRules: 'v1',
          voiceSkillMapping: 'v1'
        }
      },
      phase: 'Claude Integration - Phase 4.3 Complete'
    }
  };

  return response;
}