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
    // Monthly financial impact in USD - optional as backend may not always provide this value
    monthlyImpactUsd?: number;
  }>;
  // FASE 2.2: SkillScope Context from ROI Brain
  skillScopeContext?: {
    recommendedSkills: Array<{
      id: string;
      name: string;
      target: "Dental" | "HVAC" | "Both";
      problem: string;
      how: string;
      roiRangeMonthly?: [number, number];
      implementation?: {
        time_weeks?: number;
        phases?: string[];
      };
      integrations?: string[];
      priority: "high" | "medium" | "low";
      rationale: string;
    }>;
    contextSummary: string;
    implementationReadiness: number; // 1-100 scale
  };
  // FASE 4.3: Money Lost Summary - NON opzionale nel client
  moneyLostSummary: MoneyLostSummary;
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

export async function requestROIBrain(
  context: ROIBrainBusinessContext,
  signal?: AbortSignal,
  language: string = 'en' // Prepare for multilingual support
): Promise<ROIBrainOutput> {
  const startTime = Date.now();
  const maxRetries = 2;
  let lastError: any;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.info('ROI Brain request initiated', { 
        vertical: context.vertical,
        hasScores: !!context.scoreSummary,
        hasMoneyLost: !!context.moneylost,
        sessionId: context.sessionId,
        attempt: attempt + 1
      });

      const { data, error } = await supabase.functions.invoke('ai_roi_brain', {
        body: { ...context, language }, // Pass language parameter for future multilingual support
      });

      const processingTime = Date.now() - startTime;

      if (error) {
        logger.error('ROI Brain API error', { error: error.message, processingTime, attempt: attempt + 1 });
        
        if (error.message?.includes('401')) {
        return {
          success: false,
          sessionId: context.sessionId || 'unknown',
          error: { message: "Authentication required. Please log in and try again." },
          processingTime,
          cacheHit: false,
          voiceFitReport: getEmptyVoiceFitReport(),
          moneyLostSummary: { monthlyUsd: 0, areas: [], source: 'roi_brain_fallback' as const }
        };
        }
        
        if (error.message?.includes('422')) {
        return {
          success: false,
          sessionId: context.sessionId || 'unknown',
          error: { message: "Invalid request data. Please try again." },
          processingTime,
          cacheHit: false,
          voiceFitReport: getEmptyVoiceFitReport(),
          moneyLostSummary: { monthlyUsd: 0, areas: [], source: 'roi_brain_fallback' as const }
        };
        }
        
        // Store error for potential retry
        lastError = error;
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          logger.info(`Retrying ROI Brain request in ${backoffMs}ms`, { attempt: attempt + 1 });
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        
        // Last attempt failed, try fallback
        logger.warn('ROI Brain failed, attempting legacy VoiceFit fallback', { attempts: maxRetries + 1 });
        return await fallbackToLegacyVoiceFit(context, processingTime);
      }

      // Success - log and return
      logger.info('ROI Brain response received', {
        sessionId: data.sessionId,
        processingTime: data.processingTime,
        cacheHit: data.cacheHit,
        costs: data.costs,
        attempt: attempt + 1
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
          voiceFitReport: getEmptyVoiceFitReport(),
          moneyLostSummary: { monthlyUsd: 0, areas: [], source: 'roi_brain_fallback' as const }
        };
      }

      lastError = error;
      logger.error('ROI Brain request failed', { error: error.message, attempt: attempt + 1 });
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        logger.info(`Retrying ROI Brain request in ${backoffMs}ms`, { attempt: attempt + 1 });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }

  // All attempts failed, try fallback
  logger.warn('All ROI Brain attempts failed, using legacy VoiceFit fallback');
  return await fallbackToLegacyVoiceFit(context, Date.now() - startTime);
}

// Fallback to legacy VoiceFit system
async function fallbackToLegacyVoiceFit(context: ROIBrainBusinessContext, processingTime: number): Promise<ROIBrainOutput> {
  try {
    // Import the legacy VoiceFit client
    const { requestVoiceFitReport } = await import('../../ai/voicefit/report.client');
    
    logger.info('Attempting legacy VoiceFit fallback', { vertical: context.vertical });
    
    // Convert ROI Brain context to VoiceFit format
    const legacyReport = await requestVoiceFitReport(
      context.vertical,
      context.auditAnswers,
      context.scoreSummary,
      context.moneylost,
      context.benchmarks
    );
    
    // Convert legacy format to ROI Brain output format
    return {
      success: true,
      sessionId: context.sessionId || `fallback_${Date.now()}`,
      voiceFitReport: {
        header: {
          score: legacyReport.score,
          scoreBand: legacyReport.band,
          title: `${context.vertical.charAt(0).toUpperCase() + context.vertical.slice(1)} AI Readiness Report`,
          subtitle: 'Generated via legacy system'
        },
        diagnosis: {
          title: 'Identified Issues',
          items: legacyReport.diagnosis
        },
        consequences: legacyReport.consequences.map(c => ({
          title: 'Business Impact',
          description: c,
          impact: 'medium',
          severity: 'medium' as const
        })),
        solutions: legacyReport.solutions.map(s => ({
          title: s.title,
          description: s.rationale,
          expectedROI: `${s.estimatedRecoveryPct[0]}-${s.estimatedRecoveryPct[1]}%`,
          timeframe: '3-6 months',
          difficulty: 'medium' as const,
          priority: 'medium' as const
        })),
        plan: {
          title: legacyReport.plan.name,
          description: 'Recommended AI solution package',
          monthlyPrice: legacyReport.plan.priceMonthlyUsd,
          features: legacyReport.plan.inclusions,
          estimatedROI: '200-400%'
        },
        faq: legacyReport.faq.map(f => ({
          question: f.q,
          answer: f.a
        }))
      },
      moneyLostSummary: context.moneylost ? {
        monthlyUsd: (context.moneylost as any).total?.monthlyUsd || (context.moneylost as any).monthlyUsd || 0,
        dailyUsd: (context.moneylost as any).total?.dailyUsd || (context.moneylost as any).dailyUsd,
        annualUsd: (context.moneylost as any).total?.annualUsd || (context.moneylost as any).annualUsd,
        areas: (context.moneylost as any).areas?.map((area: any) => ({
          id: area.key || area.id || 'unknown',
          title: area.title || 'Unknown Area',
          monthlyUsd: area.monthlyUsd || 0
        })) || [],
        source: 'legacy' as const,
        confidence: 75
      } : { monthlyUsd: 0, areas: [], source: 'roi_brain_fallback' as const },
      processingTime,
      cacheHit: false,
      costs: {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      },
      error: {
        message: 'Used legacy fallback system',
        code: 'FALLBACK_USED'
      }
    };
    
  } catch (fallbackError) {
    logger.error('Legacy fallback also failed', { 
      error: fallbackError.message,
      fallbackErrorCode: (fallbackError as any).code,
      processingTime
    });
    
    // Extract structured error code from fallback error if available
    let fallbackErrorCode: string = 'BOTH_SYSTEMS_FAILED';
    
    // Check if fallback error contains structured error info
    try {
      if (fallbackError && typeof fallbackError === 'object' && 'error' in fallbackError) {
        const structuredError = (fallbackError as any).error;
        if (structuredError?.code) {
          fallbackErrorCode = structuredError.code;
        }
      }
    } catch (e) {
      // Use default code
    }
    
    // PLAN D: Enhanced error messaging with specific diagnostic information
    let finalErrorMessage = "Both ROI Brain and legacy systems failed. Please try again later.";
    
    if (fallbackError.message?.includes('AI service configuration required') || fallbackErrorCode === 'MISSING_API_KEY') {
      finalErrorMessage = "AI service configuration required. Please contact support.";
      fallbackErrorCode = 'MISSING_API_KEY';
    } else if (fallbackError.message?.includes('timeout') || fallbackErrorCode === 'TIMEOUT_ERROR') {
      finalErrorMessage = "Report generation is taking longer than expected. Please try again.";
      fallbackErrorCode = 'TIMEOUT_ERROR';
    } else if (fallbackError.message?.includes('Invalid request data') || fallbackErrorCode === 'VALIDATION_ERROR') {
      finalErrorMessage = "Invalid request data. Please try again with different inputs.";
      fallbackErrorCode = 'VALIDATION_ERROR';
    } else if (fallbackError.message?.includes('Connection')) {
      finalErrorMessage = "Connection issue detected. Please check your internet connection and try again.";
      fallbackErrorCode = 'INTERNAL_ERROR';
    }
    
    return {
      success: false,
      sessionId: context.sessionId || 'unknown',
      error: { 
        message: finalErrorMessage,
        code: fallbackErrorCode
      },
      processingTime,
      cacheHit: false,
      voiceFitReport: getEmptyVoiceFitReport(),
      moneyLostSummary: { monthlyUsd: 0, areas: [], source: 'roi_brain_fallback' as const }
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
  
  // Handle both new simple format and legacy complex format
  const score = typeof report === 'object' && 'score' in report ? report.score : 
                (typeof report === 'object' && 'header' in report ? report.header.score : 0);
  
  const band = typeof report === 'object' && 'band' in report ? report.band :
               (typeof report === 'object' && 'header' in report ? report.header.scoreBand : 'Unknown');

  const diagnosis = typeof report === 'object' && 'diagnosis' in report && Array.isArray(report.diagnosis) ? report.diagnosis :
                   (typeof report === 'object' && 'diagnosis' in report && typeof report.diagnosis === 'object' ? report.diagnosis.items : []);

  const consequences = typeof report === 'object' && 'consequences' in report && Array.isArray(report.consequences) ? 
                      (typeof report.consequences[0] === 'string' ? report.consequences : report.consequences.map(c => c.description || c)) :
                      [];

  // Safe property access with fallbacks
  const solutions = typeof report === 'object' && 'solutions' in report && Array.isArray(report.solutions) ?
                   report.solutions.map((s: any) => ({
                     skillId: s.skillId || `skill_${s.title?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'unknown'}`,
                     title: s.title || 'AI Enhancement',
                     rationale: s.rationale || s.description || 'Improves operational efficiency',
                     estimatedRecoveryPct: s.estimatedRecoveryPct || [25, 45] as [number, number]
                   })) : [];

  const plan = typeof report === 'object' && 'plan' in report && report.plan ? {
    name: (report.plan as any).name || (report.plan as any).title || 'Standard',
    priceMonthlyUsd: (report.plan as any).priceMonthlyUsd || (report.plan as any).monthlyPrice || 197,
    inclusions: (report.plan as any).inclusions || (report.plan as any).features || ['AI Call Handling'],
    addons: (report.plan as any).addons || []
  } : {
    name: 'Standard',
    priceMonthlyUsd: 197,
    inclusions: ['AI Call Handling'],
    addons: []
  };

  const faq = typeof report === 'object' && 'faq' in report && Array.isArray(report.faq) ?
             report.faq.map((f: any) => ({ 
               q: f.q || f.question || 'How does this work?', 
               a: f.a || f.answer || 'AI optimizes your business operations.' 
             })) : [];
  
  return {
    score,
    band,
    diagnosis,
    consequences,
    solutions,
    benchmarks: (report as any).benchmarks || [],
    plan,
    faq,
    
    // FASE 2.2: Pass through skillScopeContext from ROI Brain
    skillScopeContext: roiResponse.skillScopeContext || undefined,
    
    // Metadata for debugging
    processingTime: roiResponse.processingTime,
    cacheHit: roiResponse.cacheHit,
    sessionId: roiResponse.sessionId,
    
    // FASE 4.3: Pass through moneyLostSummary for unified data flow
    moneyLost: roiResponse.moneyLostSummary,
    
    _roiBrainMetadata: {
      sessionId: roiResponse.sessionId,
      processingTime: roiResponse.processingTime,
      cacheHit: roiResponse.cacheHit,
      costs: roiResponse.costs,
      needAgentIQInsights: roiResponse.needAgentIQInsights,
      moneyLostSummary: roiResponse.moneyLostSummary
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