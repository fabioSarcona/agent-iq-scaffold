import { supabase } from '@/integrations/supabase/client'
import type { LLMOutput, VoiceFitReportData } from './report.types'  
import type { MoneyLostSummary } from 'supabase/functions/_shared/types'
import { logger } from '@/lib/logger'

export async function requestVoiceFitReport(
  vertical: string, 
  answers: Record<string, unknown>,
  scoreSummary?: { overall: number; sections: Array<{ name: string; score: number }> },
  moneylost?: MoneyLostSummary,
  benchmarks?: string[]
): Promise<VoiceFitReportData> {
  const { data, error } = await supabase.functions.invoke('ai_generate_report', {
    body: { vertical, answers, scoreSummary, moneylost, benchmarks }
  })

  if (error) {
    logger.error('Error generating VoiceFit report', { error: error.message })
    throw new Error(`Failed to generate report: ${error.message}`)
  }

  const llmOutput = data as LLMOutput
  return mapLLMToUI(llmOutput)
}

// Adapter function to map LLM output to existing UI format
export function mapLLMToUI(llmOutput: LLMOutput): VoiceFitReportData {
  if (!llmOutput.success || !llmOutput.report) {
    throw new Error(llmOutput.error?.message || 'Report generation failed')
  }

  const { report, calculations } = llmOutput

  // Map bleeding money to consequences
  const consequences = report.bleeding_money.map(item => 
    `${item.area}: $${item.estimate_monthly.toFixed(0)}/month (${item.confidence}% confidence)`
  )

  // Map voice skills to solutions  
  const solutions = report.recommendations.voice_skills.map(skill => ({
    skillId: skill.name,
    title: skill.name,
    rationale: skill.why,
    estimatedRecoveryPct: [
      Math.round((skill.expected_roi_monthly / calculations.total_estimated_recovery_monthly) * 100 * 0.8),
      Math.round((skill.expected_roi_monthly / calculations.total_estimated_recovery_monthly) * 100 * 1.2)
    ] as [number, number]
  }))

  // Map plan (Elite -> Command for UI compatibility)
  const planName = report.recommendations.plan === 'Elite' ? 'Command' : report.recommendations.plan
  const plan = {
    name: planName,
    priceMonthlyUsd: planName === 'Starter' ? 97 : planName === 'Growth' ? 197 : 297,
    inclusions: [
      "24/7 AI Call Handling",
      "Smart Appointment Scheduling", 
      "Performance Analytics Dashboard"
    ],
    addons: ["Advanced Integrations (+$97/month)", "Multi-location Support (+$197/month)"]
  }

  // Generate diagnosis from bleeding money areas
  const diagnosis = report.bleeding_money.slice(0, 3).map(item => 
    `${item.area}: Revenue leakage identified with ${item.confidence}% confidence`
  )

  // Default FAQ (could be enhanced from KB)
  const faq = [
    { q: "How quickly can AI be implemented?", a: "Most implementations complete within 2-4 weeks with minimal disruption." },
    { q: "Will AI replace our staff?", a: "AI enhances your team's capabilities, handling routine tasks so staff can focus on high-value interactions." },
    { q: "What about data security?", a: "Enterprise-grade encryption and compliance with industry regulations including HIPAA." }
  ]

  // Band calculation from score
  const getBand = (score: number) => {
    if (score <= 25) return 'Crisis'
    if (score <= 50) return 'Optimization Needed' 
    if (score <= 75) return 'Growth Ready'
    return 'AI-Optimized'
  }

  return {
    score: report.ai_readiness_score,
    band: getBand(report.ai_readiness_score),
    diagnosis,
    consequences,
    solutions,
    faq,
    plan,
    benchmarks: [`AI readiness: ${report.quadrant}`, ...calculations.logic_notes.slice(0, 2)]
  }
}