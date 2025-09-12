import { supabase } from "@/integrations/supabase/client";
import { featureFlags } from "@/env";
import { logger } from '@/lib/logger';
import type { MoneyLostSummary } from '../../moneylost/types';

// ROI Brain Types
export interface ROIBrainBusinessContext {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary?: { overall: number; sections: Array<{ name: string; score: number }> };
  moneylost?: MoneyLostSummary;
  benchmarks?: string[];
  sessionId?: string;
}

export interface ROIBrainOutput {
  success: boolean;
  sessionId: string;
  voiceFitReport: {
    header: {
      score: number;
      scoreBand: string;
      title: string;
      subtitle: string;
    };
    diagnosis: {
      title: string;
      items: string[];
    };
    consequences: Array<{
      title: string;
      description: string;
      impact: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    solutions: Array<{
      title: string;
      description: string;
      expectedROI: string;
      timeframe: string;
      difficulty: 'easy' | 'medium' | 'hard';
      priority: 'low' | 'medium' | 'high';
    }>;
    plan: {
      title: string;
      description: string;
      monthlyPrice: number;
      features: string[];
      estimatedROI: string;
    };
    faq: Array<{
      question: string;
      answer: string;
    }>;
  };
  needAgentIQInsights?: Array<{
    key: string;
    title: string;
    description: string;
    impact: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    actionable: boolean;
  }>;
  processingTime: number;
  cacheHit: boolean;
  costs?: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * ROI Brain Client - Single Brain + Claude Orchestrator
 * Replaces multiple AI calls with one unified, intelligent orchestrator
 */
export async function requestROIBrain(
  context: ROIBrainBusinessContext,
  signal?: AbortSignal
): Promise<ROIBrainOutput> {
  const startTime = Date.now();
  
  try {
    logger.info('ROI Brain request initiated', { 
      vertical: context.vertical,
      hasScores: !!context.scoreSummary,
      hasMoneyLost: !!context.moneylost,
      sessionId: context.sessionId 
    });

    const { data, error } = await supabase.functions.invoke('ai_roi_brain', {
      body: context,
    });

    const processingTime = Date.now() - startTime;

    if (error) {
      logger.error('ROI Brain API error', { error: error.message, processingTime });
      
      if (error.message?.includes('401')) {
        return {
          success: false,
          sessionId: context.sessionId || 'unknown',
          error: { message: "Authentication required. Please log in and try again." },
          processingTime,
          cacheHit: false,
          voiceFitReport: getEmptyVoiceFitReport()
        };
      }
      
      if (error.message?.includes('422')) {
        return {
          success: false,
          sessionId: context.sessionId || 'unknown',
          error: { message: "Invalid request data. Please try again." },
          processingTime,
          cacheHit: false,
          voiceFitReport: getEmptyVoiceFitReport()
        };
      }
      
      return {
        success: false,
        sessionId: context.sessionId || 'unknown',
        error: { message: "Failed to generate ROI Brain analysis. Please try again later." },
        processingTime,
        cacheHit: false,
        voiceFitReport: getEmptyVoiceFitReport()
      };
    }

    // Log successful processing
    logger.info('ROI Brain response received', {
      sessionId: data.sessionId,
      processingTime: data.processingTime,
      cacheHit: data.cacheHit,
      costs: data.costs
    });

    return data as ROIBrainOutput;

  } catch (error) {
    if (signal?.aborted) {
      return {
        success: false,
        sessionId: context.sessionId || 'unknown',
        error: { message: "Request was cancelled." },
        processingTime: Date.now() - startTime,
        cacheHit: false,
        voiceFitReport: getEmptyVoiceFitReport()
      };
    }

    logger.error('ROI Brain request failed', { error: error.message });
    return {
      success: false,
      sessionId: context.sessionId || 'unknown',
      error: { message: "Network error. Please check your connection and try again." },
      processingTime: Date.now() - startTime,
      cacheHit: false,
      voiceFitReport: getEmptyVoiceFitReport()
    };
  }
}

/**
 * Adapter Function - Converts ROI Brain to Legacy VoiceFit Format
 * Maintains backward compatibility with existing UI components
 */
export function roiBrainToVoiceFitAdapter(roiResponse: ROIBrainOutput) {
  if (!roiResponse.success || !roiResponse.voiceFitReport) {
    return null;
  }

  const report = roiResponse.voiceFitReport;
  
  return {
    score: report.header.score,
    band: report.header.scoreBand,
    diagnosis: report.diagnosis.items, // Convert from {title, items} to array
    consequences: report.consequences.map(c => c.description), // Convert to string array
    solutions: report.solutions.map(s => ({
      skillId: `skill_${s.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, // Generate skillId
      title: s.title,
      rationale: s.description,
      estimatedRecoveryPct: [0.25, 0.45] as [number, number] // Default range
    })),
    benchmarks: [], // ROI Brain doesn't have benchmarks in this format
    plan: {
      name: report.plan.title,
      priceMonthlyUsd: report.plan.monthlyPrice,
      inclusions: report.plan.features,
      addons: []
    },
    faq: report.faq.map(f => ({ q: f.question, a: f.answer })), // Convert format
    
    // Metadata for debugging
    processingTime: roiResponse.processingTime,
    cacheHit: roiResponse.cacheHit,
    sessionId: roiResponse.sessionId,
    _roiBrainMetadata: {
      sessionId: roiResponse.sessionId,
      processingTime: roiResponse.processingTime,
      cacheHit: roiResponse.cacheHit,
      costs: roiResponse.costs,
      needAgentIQInsights: roiResponse.needAgentIQInsights
    }
  };
}

/**
 * Feature Flag Helper - Determine if ROI Brain should be used
 */
export function shouldUseROIBrain(): boolean {
  return featureFlags.shouldUseRoiBrain();
}

/**
 * Empty VoiceFit Report for error cases
 */
function getEmptyVoiceFitReport() {
  return {
    header: {
      score: 0,
      scoreBand: 'Unknown',
      title: 'Analysis Unavailable',
      subtitle: 'Please try again later'
    },
    diagnosis: {
      title: 'Unable to Generate Diagnosis',
      items: []
    },
    consequences: [],
    solutions: [],
    plan: {
      title: 'Plan Unavailable',
      description: 'Please contact support',
      monthlyPrice: 0,
      features: [],
      estimatedROI: 'Unknown'
    },
    faq: []
  };
}