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
          voiceFitReport: getEmptyVoiceFitReport()
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
    logger.error('Legacy fallback also failed', { error: fallbackError.message });
    
    return {
      success: false,
      sessionId: context.sessionId || 'unknown',
      error: { message: "Both ROI Brain and legacy systems failed. Please try again later." },
      processingTime,
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