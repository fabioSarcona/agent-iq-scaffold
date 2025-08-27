import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shared types - duplicated for edge function self-containment
type Vertical = 'dental' | 'hvac'
type Confidence = 'low' | 'medium' | 'high'

interface LossArea {
  id: string
  title: string
  dailyUsd: number
  monthlyUsd: number
  annualUsd: number
  recoverablePctRange: [number, number]
  confidence: Confidence
  notes?: string
}

interface MoneyLostSummary {
  dailyUsd: number
  monthlyUsd: number
  annualUsd: number
  areas: LossArea[]
}

interface RecommendedSolution {
  skillId: string
  title: string
  rationale: string
  estimatedRecoveryPct?: [number, number]
}

interface RecommendedPlan {
  name: string
  priceMonthlyUsd: number
  inclusions: string[]
  addons?: string[]
}

interface VoiceFitReportData {
  score: number
  band: 'Crisis' | 'Optimization Needed' | 'Growth Ready' | 'AI-Optimized'
  diagnosis: string[]
  consequences: string[]
  solutions: RecommendedSolution[]
  faq: Array<{ q: string; a: string }>
  plan: RecommendedPlan
  benchmarks?: string[]
}

interface GenerateReportRequest {
  vertical: Vertical
  answers: Record<string, unknown>
  moneylost?: MoneyLostSummary
  kb?: any
}

// MoneyLost calculator - duplicated for edge function
function computeMoneyLost(vertical: Vertical, answers: Record<string, unknown>): MoneyLostSummary {
  const workdays = vertical === 'dental' ? 22 : 26
  const areas: LossArea[] = vertical === 'dental' 
    ? computeDentalAreas(answers, workdays)
    : computeHvacAreas(answers, workdays)

  const dailyUsd = round2(areas.reduce((s, a) => s + a.dailyUsd, 0))
  const monthlyUsd = round0(dailyUsd * workdays)
  const annualUsd = round0(monthlyUsd * 12)

  return { 
    dailyUsd, 
    monthlyUsd, 
    annualUsd, 
    areas: areas.sort((a, b) => b.dailyUsd - a.dailyUsd) 
  }
}

function computeDentalAreas(ans: Record<string, unknown>, workdays: number): LossArea[] {
  const avgAppt = num(ans['avg_fee_standard_treatment_usd'], 180)
  const missedCallsDaily = mapDentalMissedCalls(ans['daily_unanswered_calls_choice'])
  const weeklyNoShows = mapDentalWeeklyNoShows(ans['weekly_no_shows_choice'])
  const monthlyColdPlans = num(ans['monthly_cold_treatment_plans'], 10)
  const avgUnacceptedPlan = num(ans['avg_unaccepted_plan_value_usd'], 800)
  const convRate = mapDentalNewPatientConv(ans['new_patient_conversion_rate_choice']) ?? 0.35

  const mcDaily = USD(missedCallsDaily * avgAppt * convRate)
  const mcMonthly = mcDaily * workdays
  const areaMissedCalls: LossArea = {
    id: 'missed_calls',
    title: 'Missed Calls Revenue Loss',
    dailyUsd: round0(mcDaily),
    monthlyUsd: round0(mcMonthly),
    annualUsd: round0(mcMonthly * 12),
    recoverablePctRange: [0.35, 0.60],
    confidence: conf([missedCallsDaily, avgAppt], [true, isProvided(ans['avg_fee_standard_treatment_usd'])]),
    notes: 'Estimated using your average appointment value and conversion rate.'
  }

  const nsDaily = USD((weeklyNoShows * avgAppt) / 5)
  const nsMonthly = nsDaily * workdays
  const areaNoShows: LossArea = {
    id: 'no_shows',
    title: 'No-Shows Revenue Loss',
    dailyUsd: round0(nsDaily),
    monthlyUsd: round0(nsMonthly),
    annualUsd: round0(nsMonthly * 12),
    recoverablePctRange: [0.30, 0.50],
    confidence: conf([weeklyNoShows, avgAppt], [isProvided(ans['weekly_no_shows_choice']), isProvided(ans['avg_fee_standard_treatment_usd'])]),
    notes: 'Assumes weekdays operations; reminders & deposits typically mitigate 30–50%.'
  }

  const tpMonthly = USD(monthlyColdPlans * avgUnacceptedPlan)
  const tpDaily = USD(tpMonthly / workdays)
  const areaPlans: LossArea = {
    id: 'treatment_plans',
    title: 'Treatment Plans Revenue Loss',
    dailyUsd: round0(tpDaily),
    monthlyUsd: round0(tpMonthly),
    annualUsd: round0(tpMonthly * 12),
    recoverablePctRange: [0.25, 0.45],
    confidence: conf([monthlyColdPlans, avgUnacceptedPlan], [isProvided(ans['monthly_cold_treatment_plans']), isProvided(ans['avg_unaccepted_plan_value_usd'])]),
    notes: 'Cold plans treated as leakage potential; follow-ups typically recover 25–45%.'
  }

  return [areaMissedCalls, areaNoShows, areaPlans]
}

function computeHvacAreas(ans: Record<string, unknown>, workdays: number): LossArea[] {
  const valuePerMissed = num(ans['missed_call_estimated_value_usd'], 250)
  const missedCallsDaily = mapHvacMissedCalls(ans['daily_unanswered_calls_choice'])
  const weeklyCancels = mapHvacWeeklyCancels(ans['weekly_job_cancellations_choice'])
  const avgCanceledJob = num(ans['avg_canceled_job_value_usd'], 350)
  const monthlyPendingQuotes = num(ans['monthly_pending_quotes'], 12)
  const avgPendingQuote = num(ans['average_pending_quote_value_usd'], 1500)
  const callbackSpeed = str(ans['missed_call_response_time_choice'])

  const baseClose = 0.35
  const closeMod = (() => {
    switch (callbackSpeed) {
      case 'immediate': return 1.0
      case '2h': return 0.9
      case 'same_day': return 0.8
      case 'next_day': return 0.6
      default: return 0.85
    }
  })()
  const effectiveClose = clamp(baseClose * closeMod, 0.2, 0.6)

  const mcDaily = USD(missedCallsDaily * valuePerMissed * effectiveClose)
  const mcMonthly = mcDaily * workdays
  const areaMissedCalls: LossArea = {
    id: 'missed_calls',
    title: 'Missed Service Calls Loss',
    dailyUsd: round0(mcDaily),
    monthlyUsd: round0(mcMonthly),
    annualUsd: round0(mcMonthly * 12),
    recoverablePctRange: [0.35, 0.60],
    confidence: conf([missedCallsDaily, valuePerMissed], [isProvided(ans['daily_unanswered_calls_choice']), isProvided(ans['missed_call_estimated_value_usd'])]),
    notes: 'Close-rate adjusted using your callback speed.'
  }

  const cancDaily = USD((weeklyCancels * avgCanceledJob) / 5)
  const cancMonthly = cancDaily * workdays
  const areaCancels: LossArea = {
    id: 'cancellations',
    title: 'Last-Minute Cancellations Loss',
    dailyUsd: round0(cancDaily),
    monthlyUsd: round0(cancMonthly),
    annualUsd: round0(cancMonthly * 12),
    recoverablePctRange: [0.30, 0.50],
    confidence: conf([weeklyCancels, avgCanceledJob], [isProvided(ans['weekly_job_cancellations_choice']), isProvided(ans['avg_canceled_job_value_usd'])]),
    notes: 'Deposits & reminder flows typically recover 30–50%.'
  }

  const monthlyPendingValue = USD(monthlyPendingQuotes * avgPendingQuote)
  const pendMonthlyLeak = USD(monthlyPendingValue * 0.25)
  const pendDaily = USD(pendMonthlyLeak / workdays)
  const areaPending: LossArea = {
    id: 'pending_quotes',
    title: 'Pending Quotes Revenue Loss',
    dailyUsd: round0(pendDaily),
    monthlyUsd: round0(pendMonthlyLeak),
    annualUsd: round0(pendMonthlyLeak * 12),
    recoverablePctRange: [0.25, 0.45],
    confidence: conf([monthlyPendingQuotes, avgPendingQuote], [isProvided(ans['monthly_pending_quotes']), isProvided(ans['average_pending_quote_value_usd'])]),
    notes: 'Assumes 25% stall leakage; follow-ups typically recover 25–45%.'
  }

  return [areaMissedCalls, areaCancels, areaPending]
}

// Utility functions
function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN)
  return Number.isFinite(n) ? n : fallback
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function isProvided(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).length > 0
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function round0(n: number) { return Math.round(n) }
function round2(n: number) { return Math.round(n * 100) / 100 }

function USD(n: number) { return Math.max(0, Number.isFinite(n) ? n : 0) }

function conf(values: Array<number>, providedFlags: Array<boolean>): 'low'|'medium'|'high' {
  const provided = providedFlags.filter(Boolean).length
  const nonZero = values.filter(x => x > 0).length
  if (provided === providedFlags.length && nonZero > 0) return 'high'
  if (provided > 0) return 'medium'
  return 'low'
}

function mapDentalMissedCalls(v: unknown): number {
  switch (str(v)) {
    case '0': return 0
    case '1_3': return 2
    case '4_10': return 7
    case '11_20': return 15
    case '21_plus': return 25
    default: return 2
  }
}

function mapDentalWeeklyNoShows(v: unknown): number {
  switch (str(v)) {
    case '0': return 0
    case '1_3': return 2
    case '4_6': return 5
    case '7_10': return 8
    case '11_plus': return 12
    default: return 2
  }
}

function mapDentalNewPatientConv(v: unknown): number | undefined {
  switch (str(v)) {
    case '0_2': return 0.15
    case '3_5': return 0.35
    case '6_10': return 0.65
    default: return undefined
  }
}

function mapHvacMissedCalls(v: unknown): number {
  switch (str(v)) {
    case 'none': return 0
    case '1_3': return 2
    case '4_6': return 5
    case 'gt_6': return 8
    default: return 2
  }
}

function mapHvacWeeklyCancels(v: unknown): number {
  switch (str(v)) {
    case 'none': return 0
    case '1_2': return 1
    case '3_5': return 4
    case 'gt_5': return 6
    default: return 1
  }
}

// Main report generation
function generateReport(request: GenerateReportRequest): VoiceFitReportData {
  const { vertical, answers, kb } = request
  
  // Compute money lost if not provided
  const moneylost = request.moneylost || computeMoneyLost(vertical, answers)
  
  // Calculate score based on daily loss
  const score = scoreFromDailyLoss(vertical, moneylost.dailyUsd)
  const band = getBand(score)
  
  // Get top 3 areas by daily loss
  const topAreas = moneylost.areas.slice(0, 3)
  
  // Generate diagnosis from top areas
  const diagnosis = topAreas.map(area => `${area.title}: elevated impact observed.`)
  
  // Generate consequences
  const consequences = [
    `Estimated daily loss: $${moneylost.dailyUsd.toFixed(0)}`,
    `Monthly impact: $${moneylost.monthlyUsd.toFixed(0)} (conservative)`,
    `Annualized leakage: $${moneylost.annualUsd.toFixed(0)}`
  ]
  
  // Map areas to solutions
  const solutions: RecommendedSolution[] = topAreas.map(area => ({
    skillId: mapLossAreaToSkill(area.title),
    title: mapLossAreaToSkill(area.title),
    rationale: `Address ${area.title.toLowerCase()} with intelligent automation`,
    estimatedRecoveryPct: [
      Math.round(area.recoverablePctRange[0] * 100),
      Math.round(area.recoverablePctRange[1] * 100)
    ]
  }))
  
  // Generate FAQ from KB or fallback
  const faq = kb?.faq?.common ? Object.entries(kb.faq.common).slice(0, 3).map(([q, a]) => ({ q, a: String(a) })) : [
    { q: "How quickly can AI be implemented?", a: "Most implementations complete within 2-4 weeks with minimal disruption to daily operations." },
    { q: "Will AI replace our staff?", a: "AI enhances your team's capabilities, handling routine tasks so staff can focus on high-value patient/customer interactions." },
    { q: "What about data security?", a: "Our platform uses enterprise-grade encryption and complies with all relevant industry regulations including HIPAA." }
  ]
  
  // Generate plan from KB or fallback
  const plan: RecommendedPlan = kb?.pricing?.plans?.Command ? {
    name: kb.pricing.plans.Command.name || "Command",
    priceMonthlyUsd: kb.pricing.plans.Command.price || 199,
    inclusions: kb.pricing.plans.Command.inclusions || ["AI Call Handling", "Smart Scheduling", "Performance Analytics"],
    addons: kb.pricing.plans.Command.addons
  } : {
    name: "Command",
    priceMonthlyUsd: 199,
    inclusions: ["24/7 AI Call Handling", "Smart Appointment Scheduling", "Performance Analytics Dashboard"],
    addons: ["Advanced Integrations (+$97/month)", "Multi-location Support (+$197/month)"]
  }
  
  // Generate benchmarks
  const benchmarks = [
    vertical === 'dental' 
      ? `Dental practices typically see 40-60% reduction in no-shows with AI implementation`
      : `HVAC companies report 35-50% improvement in emergency response times with AI automation`
  ]
  
  return {
    score,
    band,
    diagnosis,
    consequences,
    solutions,
    faq,
    plan,
    benchmarks
  }
}

function scoreFromDailyLoss(vertical: Vertical, daily: number): number {
  const denom = vertical === 'dental' ? 1200 : 1600
  return Math.round(clamp(100 - daily / denom, 1, 100))
}

function getBand(score: number): 'Crisis' | 'Optimization Needed' | 'Growth Ready' | 'AI-Optimized' {
  if (score <= 25) return 'Crisis'
  if (score <= 50) return 'Optimization Needed'
  if (score <= 75) return 'Growth Ready'
  return 'AI-Optimized'
}

function mapLossAreaToSkill(lossAreaTitle: string): string {
  const mapping: Record<string, string> = {
    "Missed Calls Revenue Loss": "Reception 24/7 Agent",
    "No-Shows Revenue Loss": "Appointment Reminder System", 
    "Treatment Plans Revenue Loss": "Treatment Plan Presenter",
    "Missed Service Calls Loss": "Emergency Response System",
    "Last-Minute Cancellations Loss": "Lead Follow-up Assistant",
    "Pending Quotes Revenue Loss": "Quote Follow-up System"
  }
  return mapping[lossAreaTitle] || "AI Assistant"
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: GenerateReportRequest = await req.json()
    console.log('Processing report for vertical:', request.vertical)
    
    const report = generateReport(request)
    
    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate report', details: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})