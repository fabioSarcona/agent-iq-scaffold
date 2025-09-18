import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, AlertTriangle, TrendingDown, Loader2, Zap, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { useTranslation } from '@/hooks/useTranslation'

// Import from audit and AI modules
import { useAuditProgressStore } from '@modules/audit'
import { 
  ScoreGauge, 
  BenchmarkNote, 
  SolutionCard,
  FAQAccordion, 
  PlanCard,
  requestVoiceFitReport,
  type VoiceFitReportData
} from '@modules/ai/voicefit'

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
import { RevenueSimulator, mapSolutionToInsight } from '../../modules/revenue'
import type { MoneyLostSummary } from '../../modules/moneylost/types'
import { Badge } from '@/components/ui/badge'

export default function Report() {
  const { vertical, answers } = useAuditProgressStore()
  const currentVertical = (vertical || 'dental') as 'dental' | 'hvac'
  const { t } = useTranslation('report')
  
  // SkillScope overlay state
  const [selectedSkill, setSelectedSkill] = React.useState<string | null>(null)
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
          costs: roiResponse.costs
        });

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
    setSelectedSkill(skillId)
    setIsSkillScopeOpen(true)
  }, [])

  // Current skill scope payload
  const skillScopePayload = React.useMemo(() => {
    if (!selectedSkill || !reportData) return null
    const solution = reportData.solutions?.find(s => s.skillId === selectedSkill)
    return solution ? createSkillScopePayload(selectedSkill, solution.title) : null
  }, [selectedSkill, reportData, createSkillScopePayload])

  // Revenue Simulator data preparation
  const revenueSimulatorData = React.useMemo(() => {
    if (!reportData) return null

    // Create mock money lost data structure for simulator
    const mockMoneyLost = {
      dailyUsd: 250,
      monthlyUsd: 5500,
      annualUsd: 66000,
      areas: []
    }

    // Convert solutions to insights with base monthly impact
    const baseMonthlyImpact = mockMoneyLost.monthlyUsd / reportData.solutions.length
    const insights = reportData.solutions.map(solution => 
      mapSolutionToInsight(solution, baseMonthlyImpact)
    )

    return {
      insights,
      moneyLost: mockMoneyLost,
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
    return (
      <div className="max-w-[900px] mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('error.title')}</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : t('error.message')}
            </p>
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
            {reportData.solutions?.map((solution, index) => (
              <SolutionCard 
                key={index} 
                skillId={solution.skillId}
                title={solution.title}
                rationale={solution.rationale}
                estimatedRecoveryPct={solution.estimatedRecoveryPct}
                {...({ onLearnMore: () => handleLearnMore(solution.skillId, solution.title) } as any)}
              />
            ))}
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

      {/* SkillScope Overlay */}
      {skillScopePayload && (
        <SkillScopeOverlay
          isOpen={isSkillScopeOpen}
          onClose={() => {
            setIsSkillScopeOpen(false)
            setSelectedSkill(null)
          }}
          payload={skillScopePayload}
        />
      )}
    </div>
  )
}