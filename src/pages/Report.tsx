import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, AlertTriangle, TrendingDown, Loader2, Zap, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { logger } from '@/lib/logger'

// Import from audit and AI modules
import { useAuditProgressStore } from '@modules/audit'
import { 
  ScoreGauge, 
  BenchmarkNote, 
  FAQAccordion, 
  PlanCard,
  requestVoiceFitReport,
  type VoiceFitReportData
} from '@modules/ai/voicefit'
import { SolutionCard } from '../../modules/ai/voicefit/components/SolutionCard'

// ROI Brain Integration
import { 
  requestROIBrain,
  roiBrainToVoiceFitAdapter,
  shouldUseROIBrain,
  type ROIBrainBusinessContext
} from '../../modules/ai/roibrain'

// Import SkillScope components and utils  
import { SkillScopeOverlay } from '@modules/skillscope/components/SkillScopeOverlay'
// KB utilities are now handled by edge functions
import type { SkillScopePayload } from '@modules/skillscope/types'

// Import Revenue Simulator
import { RevenueSimulator, mapSolutionToInsight, distributeSmartImpacts, extractTelemetryData } from '../../modules/revenue'
import type { MoneyLostSummary } from '../../modules/moneylost/types'
import { Badge } from '@/components/ui/badge'
import { ConsultationSummaryCard } from '@/components/ConsultationSummaryCard'

// PLAN D: Error message mapping function for structured error handling
function getErrorMessage(errorCode?: string): { title: string; description: string } {
  switch (errorCode) {
    case 'MISSING_API_KEY':
      return {
        title: 'Configuration Required',
        description: 'AI service needs to be configured. Please contact support for assistance.'
      };
    case 'TIMEOUT_ERROR':
      return {
        title: 'Processing Timeout',
        description: 'Report generation is taking longer than expected. Please try again in a few minutes.'
      };
    case 'VALIDATION_ERROR':
      return {
        title: 'Data Validation Error',
        description: 'There was an issue with your audit data. Please try completing the audit again.'
      };
    case 'INTERNAL_ERROR':
      return {
        title: 'System Error',
        description: 'An internal error occurred. Please try again later.'
      };
    default:
      return {
        title: 'Connection Issue',
        description: 'Unable to connect to our services. Please check your internet connection and try again.'
      };
  }
}

export default function Report() {
  const { vertical, answers } = useAuditProgressStore()
  const currentVertical = (vertical || 'dental') as 'dental' | 'hvac'
  const { t } = useTranslation('report')
  
  // SkillScope overlay state
  const [selectedSkill, setSelectedSkill] = React.useState<{ skillId: string; title: string } | null>(null)
  const [isSkillScopeOpen, setIsSkillScopeOpen] = React.useState(false)
  
  // ROI Brain Integration - Single source of truth for all AI analysis
  const useROIBrain = shouldUseROIBrain();
  
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['voicefit-report', currentVertical, JSON.stringify(answers), useROIBrain],
    queryFn: async () => {
      if (useROIBrain) {
        // Use ROI Brain - Single Brain + Claude Orchestrator
        const roiContext: ROIBrainBusinessContext = {
          vertical: currentVertical,
          auditAnswers: answers || {},
          sessionId: `report_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };

        console.log('🧠 Using ROI Brain for unified analysis', {
          vertical: currentVertical,
          sessionId: roiContext.sessionId,
          answerKeys: Object.keys(answers || {})
        });

        const roiResponse = await requestROIBrain(roiContext);
        
        if (!roiResponse.success) {
          throw new Error(roiResponse.error?.message || 'ROI Brain analysis failed');
        }

        // Convert ROI Brain response to VoiceFit format for UI compatibility
        const adaptedReport = roiBrainToVoiceFitAdapter(roiResponse);
        
        if (!adaptedReport) {
          throw new Error('Failed to adapt ROI Brain response');
        }

        console.log('🧠 ROI Brain analysis completed', {
          sessionId: roiResponse.sessionId,
          processingTime: roiResponse.processingTime,
          cacheHit: roiResponse.cacheHit,
          costs: roiResponse.costs,
          hasNeedAgentIQInsights: !!roiResponse.needAgentIQInsights?.length
        });

        // FASE 2.1: Populate NeedAgentIQ insights from ROI Brain
        if (roiResponse.needAgentIQInsights?.length) {
          // Import store only when needed to avoid circular deps
          const { useAuditProgressStore } = await import('@modules/audit/AuditProgressStore');
          const { populateInsightsFromROIBrain } = useAuditProgressStore.getState();
          
          // Transform ROI Brain insights to NeedAgentIQ format
          const transformedInsights = roiResponse.needAgentIQInsights.map(insight => ({
            key: insight.key || `roi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: insight.title,
            description: insight.description,
            impact: insight.impact,
            priority: insight.priority,
            category: insight.category,
            actionable: insight.actionable,
            sectionId: 'roi_brain_generated' // Mark as ROI Brain generated
          }));
          
          console.log('🧠 DEBUG: Populating ROI Brain insights into NeedAgentIQ:', {
            originalCount: roiResponse.needAgentIQInsights.length,
            transformedCount: transformedInsights.length
          });
          
          populateInsightsFromROIBrain(transformedInsights);
        }

        return adaptedReport;
      } else {
        // Legacy VoiceFit Report (fallback)
        console.log('📊 Using legacy VoiceFit report');
        return requestVoiceFitReport(currentVertical, answers || {});
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  })

  // Type guard for ROI Brain enhanced reports
  const isROIBrainReport = (report: any): report is typeof reportData & { _roiBrainMetadata: any } => {
    return useROIBrain && report && '_roiBrainMetadata' in report;
  };

  // Create audit context for SkillScope
  const auditContext = React.useMemo(() => ({
    auditId: `audit-${Date.now()}`,
    auditType: currentVertical,
    business: {
      // Extract business info from answers if available
      name: (answers as any)?.business_name || "Your Business",
      location: (answers as any)?.business_location,
      size: {
        chairs: currentVertical === 'dental' ? ((answers as any)?.chair_count || 3) : undefined,
        techs: currentVertical === 'hvac' ? ((answers as any)?.tech_count || 2) : undefined,
      },
    },
    settings: {
      currency: "USD" as const,
      locale: "en-US" as const,
    },
  }), [currentVertical, answers])

  // FASE 2.2: Create SkillScope payload using ROI Brain skillScopeContext or fallback to hardcoded
  const createSkillScopePayload = React.useCallback((skillId: string, skillTitle: string): SkillScopePayload => {
    const solution = reportData?.solutions?.find(s => s.skillId === skillId)
    
    // FASE 2.2: Try to get skill from ROI Brain skillScopeContext first
    const roiBrainSkill = isROIBrainReport(reportData) && 
      (reportData as any).skillScopeContext?.recommendedSkills?.find(
        (skill: any) => skill.id === skillId || skill.name === skillTitle
      )
    
    // Use ROI Brain data if available, otherwise fallback to hardcoded
    const skillData = roiBrainSkill ? {
      id: roiBrainSkill.id,
      name: roiBrainSkill.name,
      target: roiBrainSkill.target,
      problem: roiBrainSkill.problem,
      how: roiBrainSkill.how,
      roiRangeMonthly: roiBrainSkill.roiRangeMonthly,
      implementation: roiBrainSkill.implementation,
      integrations: roiBrainSkill.integrations
    } : {
      id: skillId,
      name: skillTitle,
      target: (currentVertical === 'dental' ? "Dental" : "HVAC") as "Dental" | "HVAC",
      problem: solution?.rationale || "Identified business challenge",
      how: "AI-powered automation that integrates with your existing systems",
      roiRangeMonthly: solution?.estimatedRecoveryPct ? 
        [solution.estimatedRecoveryPct[0] * 100, solution.estimatedRecoveryPct[1] * 100] as [number, number] :
        undefined,
    }
    
    // Enhanced KB slices with ROI Brain context or fallback
    const contextSummary = isROIBrainReport(reportData) && (reportData as any).skillScopeContext?.contextSummary
    const kbSlices = {
      approved_claims: contextSummary ? [
        contextSummary,
        "Increase revenue by 15-40% through better patient retention",
        "Reduce no-shows by up to 80% with automated reminders", 
        "Save 2-4 hours daily on administrative tasks"
      ] : [
        "Increase revenue by 15-40% through better patient retention",
        "Reduce no-shows by up to 80% with automated reminders", 
        "Save 2-4 hours daily on administrative tasks"
      ],
      services: []
    }
    
    console.log('🎯 DEBUG: createSkillScopePayload:', {
      skillId,
      skillTitle,
      roiBrainSkillFound: !!roiBrainSkill,
      contextSummary: !!contextSummary,
      skillData,
      source: roiBrainSkill ? 'ROI_BRAIN' : 'FALLBACK'
    });
    
    return {
      context: auditContext,
      skill: skillData,
      audit: {
        responses: Object.entries(answers || {}).map(([key, value]) => ({ key, value })),
        aiReadinessScore: reportData?.score,
      },
      kb: {
        approved_claims: [...kbSlices.approved_claims],
        services: kbSlices.services.map(s => ({ ...s })),
      },
    }
  }, [reportData, currentVertical, auditContext, answers])

  // Handle learn more click
  const handleLearnMore = React.useCallback((skillId: string, skillTitle: string) => {
    setSelectedSkill({ skillId, title: skillTitle })
    setIsSkillScopeOpen(true)
  }, [])

  // Current skill scope payload
  const skillScopePayload = React.useMemo(() => {
    if (!selectedSkill || !reportData) return null
    const solution = reportData.solutions?.find(s => s.skillId === selectedSkill.skillId)
    return solution ? createSkillScopePayload(selectedSkill.skillId, selectedSkill.title) : null
  }, [selectedSkill, reportData, createSkillScopePayload])

  // FASE 4.3: Revenue Simulator data preparation - USE REAL DATA FROM ROI BRAIN
  const revenueSimulatorData = React.useMemo(() => {
    if (!reportData) return null

    // Feature flag per rollout graduale
    const useStrictROIBrain = (import.meta.env.VITE_ROIBRAIN_MONEYLOST_STRICT as string) === 'true';
    
    // Type assertion per gestire il union type
    const roiBrainReport = reportData as any;
    
    // Ordine di priorità per money lost data
    const moneyLost = (() => {
      if (useStrictROIBrain) {
        // Modalità strict: solo ROI Brain
        return roiBrainReport._roiBrainMetadata?.moneyLostSummary || {
          monthlyUsd: 0,
          areas: [],
          source: 'roi_brain_fallback' as const
        };
      }
      
      // Modalità compatibilità: ordine priorità
      return roiBrainReport._roiBrainMetadata?.moneyLostSummary
        ?? roiBrainReport.moneyLost  // legacy voicefit
        ?? { monthlyUsd: 0, areas: [], source: 'roi_brain_fallback' as const };
    })();

    // FASE 4.3.1: Enhanced telemetry with area mapping and versions
    const telemetry = extractTelemetryData(moneyLost, roiBrainReport._roiBrainMetadata)
    console.log('💰 Revenue Simulator - Enhanced telemetry:', {
      ...telemetry,
      strictMode: useStrictROIBrain,
      hasROIBrainData: !!roiBrainReport._roiBrainMetadata?.moneyLostSummary,
      hasLegacyData: !!roiBrainReport.moneyLost,
      monthlyUsd: moneyLost.monthlyUsd,
      solutionsCount: reportData.solutions.length
    });

    // FASE 4.3.1: Smart impact distribution based on area-to-skill mapping
    const solutionsWithImpacts = distributeSmartImpacts(
      reportData.solutions,
      moneyLost.areas || [],
      moneyLost.monthlyUsd
    )
    
    const insights = solutionsWithImpacts.map(solution => 
      mapSolutionToInsight(solution, solution.monthlyImpact)
    )

    return {
      insights,
      moneyLost, // Dati reali dal server, non più mock
      pricing: { setup: 2500, monthly: 299 },
      vertical: (currentVertical === 'dental' ? 'dental' : 'hvac') as 'dental' | 'hvac',
      businessSize: 'Medium' as const,
    }
  }, [reportData, currentVertical])
  
  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    // PLAN D: Enhanced error handling and logging with structured error codes
    const errorMessage = error instanceof Error ? error.message : t('error.message')
    
    // Extract error code from structured error responses
    let errorCode: string | undefined;
    try {
      // Try to parse error code from structured backend responses
      if (errorMessage.includes('MISSING_API_KEY')) errorCode = 'MISSING_API_KEY';
      else if (errorMessage.includes('TIMEOUT_ERROR')) errorCode = 'TIMEOUT_ERROR';
      else if (errorMessage.includes('VALIDATION_ERROR')) errorCode = 'VALIDATION_ERROR';
      else if (errorMessage.includes('INTERNAL_ERROR')) errorCode = 'INTERNAL_ERROR';
    } catch (e) {
      // Fallback to legacy error message parsing
    }
    
    // PLAN D: Use structured logging instead of console.error
    logger.error('Report generation failed', {
      error: errorMessage,
      errorCode,
      useROIBrain,
      vertical: currentVertical,
      timestamp: new Date().toISOString(),
      answerKeys: Object.keys(answers || {})
    });
    
    // PLAN D: Use structured error message mapping
    const { title: errorTitle, description: errorDescription } = getErrorMessage(errorCode)
    const ErrorIcon = AlertTriangle
    
    return (
      <div className="max-w-[900px] mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <ErrorIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{errorTitle}</h2>
            <p className="text-muted-foreground mb-4">
              {errorDescription}
            </p>
            {/* PLAN D: Add diagnostic information for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer">
                  Debug Information
                </summary>
                <pre className="text-xs bg-muted p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify({
                    error: errorMessage,
                    useROIBrain,
                    vertical: currentVertical,
                    timestamp: new Date().toISOString()
                  }, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!reportData) return null

  return (
    <div className="max-w-[900px] mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">{t('header.title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('header.subtitle')}
        </p>
      </div>

      {/* Business Score Section with ROI Brain indicator */}
      <Card className="text-center">
        <CardHeader className="pb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <CardTitle className="text-2xl">{t('score.title')}</CardTitle>
            {useROIBrain && isROIBrainReport(reportData) && reportData._roiBrainMetadata?.cacheHit && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Cached
              </Badge>
            )}
            {useROIBrain && isROIBrainReport(reportData) && !reportData._roiBrainMetadata?.cacheHit && (
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                ROI Brain™
              </Badge>
            )}
          </div>
          <ScoreGauge score={reportData.score as number} band={reportData.band as string} />
        </CardHeader>
      </Card>

      {/* Consultation Summary */}
      {revenueSimulatorData && (
        <ConsultationSummaryCard 
          reportData={reportData as VoiceFitReportData} 
          moneyLost={revenueSimulatorData.moneyLost} 
        />
      )}

      {/* Benchmark Note */}
      <BenchmarkNote notes={reportData.benchmarks || []} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Diagnosis Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{t('sections.diagnosis')}</CardTitle>
            </div>
            <CardDescription>{t('sections.diagnosis_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {(Array.isArray(reportData.diagnosis) ? reportData.diagnosis : []).map((finding, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{finding}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Consequences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle>{t('sections.consequences')}</CardTitle>
            </div>
            <CardDescription>{t('sections.consequences_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {reportData.consequences.map((consequence, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                  <p className="text-sm text-foreground">{consequence}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Solutions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('sections.solutions')}</CardTitle>
          <CardDescription>{t('sections.solutions_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(() => {
              // Get enhanced solutions data with monthly impact and priority
              const roiBrainReport = reportData as any;
              const moneyLost = roiBrainReport._roiBrainMetadata?.moneyLostSummary
                ?? roiBrainReport.moneyLost  
                ?? { monthlyUsd: 0, areas: [], source: 'fallback' as const };
              
              const solutionsWithImpacts = distributeSmartImpacts(
                reportData.solutions,
                moneyLost.areas || [],
                moneyLost.monthlyUsd
              );
              
              return solutionsWithImpacts.map((solutionWithImpact, index) => {
                // Find the original solution by skillId to get estimatedRecoveryPct
                const originalSolution = reportData.solutions
                  .find(s => s.skillId === solutionWithImpact.skillId);
                
                // Simple priority logic based on monthly impact with safe fallback
                const mi = solutionWithImpact.monthlyImpact ?? 0;
                const priority = mi > 2000 ? 'high' : mi > 500 ? 'medium' : 'low';
                
                return (
                  <SolutionCard 
                    key={index} 
                    skillId={solutionWithImpact.skillId}
                    title={solutionWithImpact.title}
                    rationale={solutionWithImpact.rationale}
                    estimatedRecoveryPct={originalSolution?.estimatedRecoveryPct}
                    monthlyImpact={solutionWithImpact.monthlyImpact}
                    priority={priority as 'high' | 'medium' | 'low'}
                    onLearnMore={() => handleLearnMore(solutionWithImpact.skillId, solutionWithImpact.title)}
                  />
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Simulator Section */}
      {revenueSimulatorData && (
        <RevenueSimulator {...revenueSimulatorData} />
      )}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('sections.faq')}</CardTitle>
          <CardDescription>{t('sections.faq_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FAQAccordion items={reportData.faq || []} />
        </CardContent>
      </Card>

      {/* Recommended Plan Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('sections.plan')}</h2>
        <PlanCard 
          name={reportData.plan.name}
          priceMonthlyUsd={reportData.plan.priceMonthlyUsd}
          inclusions={reportData.plan.inclusions}
          addons={reportData.plan.addons}
        />
      </div>

      {/* SkillScope Overlay - ROI Brain First (Phase 5.3) */}
      {selectedSkill?.skillId && (
        <SkillScopeOverlay
          isOpen={isSkillScopeOpen}
          skillId={selectedSkill.skillId}
          context={(reportData as any)?.skillScopeContext}
          fallbackPayload={skillScopePayload || undefined}
          onClose={() => {
            setIsSkillScopeOpen(false)
            setSelectedSkill(null)
          }}
        />
      )}
    </div>
  )
}