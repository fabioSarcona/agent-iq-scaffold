import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportInput {
  sector: 'dental' | 'hvac'
  answers: Record<string, string | number>
  moneyLostSummary: {
    total: { daily: number, monthly: number, annual: number }
    areas: Array<{
      title: string
      losses: { daily: number, monthly: number, annual: number }
      recoverableRange: { min: number, max: number }
    }>
  }
  kbSlices: {
    brandTone: any
    voiceSkills: any
    painPoints: any
    pricing: any
  }
}

interface ReportOutput {
  score: number
  diagnosis: Array<{ finding: string, severity: 'high' | 'medium' | 'low' }>
  consequences: string[]
  solutions: Array<{
    skillId: string
    title: string
    rationale: string
    icon: string
  }>
  faqIds: string[]
  plan: {
    name: string
    price: string
    period: string
    inclusions: string[]
    addons: string[]
  }
  benchmarks: {
    notes: string[]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const input: ReportInput = await req.json()
    console.log('Processing report for sector:', input.sector)
    
    const report = generateReport(input)
    
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

function generateReport(input: ReportInput): ReportOutput {
  const { sector, answers, moneyLostSummary } = input
  
  // Calculate business score based on audit answers and money lost
  const score = calculateBusinessScore(sector, answers, moneyLostSummary)
  
  // Generate personalized diagnosis
  const diagnosis = generatePersonalizedDiagnosis(sector, answers, moneyLostSummary)
  
  // Generate consequences based on actual losses
  const consequences = generatePersonalizedConsequences(sector, moneyLostSummary)
  
  // Generate intelligent solution recommendations
  const solutions = generateIntelligentSolutions(sector, answers, score)
  
  // Select relevant FAQ topics based on industry and issues
  const faqIds = generateRelevantFAQs(sector, diagnosis)
  
  // Generate dynamic pricing plan based on score and needs
  const plan = generateDynamicPlan(score, sector)
  
  // Generate industry benchmarks and insights
  const benchmarks = generateBenchmarks(sector, score, moneyLostSummary)
  
  return {
    score,
    diagnosis,
    consequences,
    solutions,
    faqIds,
    plan,
    benchmarks
  }
}

function calculateBusinessScore(
  sector: 'dental' | 'hvac',
  answers: Record<string, string | number>,
  moneyLostSummary: any
): number {
  let score = 50 // Base score
  
  // Adjust based on sector-specific factors
  if (sector === 'dental') {
    const newPatients = Number(answers.dental_new_patients) || 0
    const missedAppointments = Number(answers.dental_missed_appointments) || 15
    
    // Score adjustments
    if (newPatients > 50) score += 15
    else if (newPatients > 20) score += 5
    else if (newPatients < 10) score -= 20
    
    if (missedAppointments > 25) score -= 25
    else if (missedAppointments > 15) score -= 15
    else if (missedAppointments < 5) score += 15
  } else {
    const serviceCalls = Number(answers.hvac_service_calls) || 0
    const afterHoursPercent = Number(answers.hvac_after_hours_calls) || 20
    
    if (serviceCalls > 100) score += 15
    else if (serviceCalls > 50) score += 5
    else if (serviceCalls < 20) score -= 20
    
    if (afterHoursPercent > 40) score -= 20
    else if (afterHoursPercent < 10) score += 10
  }
  
  // Factor in money lost severity
  const annualLoss = moneyLostSummary.total.annual
  if (annualLoss > 100000) score -= 30
  else if (annualLoss > 50000) score -= 15
  else if (annualLoss < 10000) score += 10
  
  return Math.max(1, Math.min(100, Math.round(score)))
}

function generatePersonalizedDiagnosis(
  sector: 'dental' | 'hvac',
  answers: Record<string, string | number>,
  moneyLostSummary: any
): Array<{ finding: string, severity: 'high' | 'medium' | 'low' }> {
  const diagnosis = []
  
  if (sector === 'dental') {
    const missedAppointments = Number(answers.dental_missed_appointments) || 15
    const communicationChallenge = answers.dental_communication_challenge as string
    
    if (missedAppointments > 20) {
      diagnosis.push({
        finding: `${missedAppointments}% no-show rate is significantly above industry average (8-12%)`,
        severity: 'high' as const
      })
    }
    
    if (communicationChallenge?.includes('All of the above') || communicationChallenge?.includes('phone')) {
      diagnosis.push({
        finding: "Phone communication inefficiencies identified across multiple touchpoints",
        severity: 'high' as const
      })
    }
    
    if (moneyLostSummary.total.annual > 75000) {
      diagnosis.push({
        finding: `Annual revenue loss of $${(moneyLostSummary.total.annual / 1000).toFixed(0)}K requires immediate attention`,
        severity: 'high' as const
      })
    }
  } else {
    const operationalChallenge = answers.hvac_operational_challenge as string
    const afterHours = Number(answers.hvac_after_hours_calls) || 20
    
    if (operationalChallenge?.includes('Customer communication')) {
      diagnosis.push({
        finding: "Customer communication gaps identified as primary operational bottleneck",
        severity: 'high' as const
      })
    }
    
    if (afterHours > 30) {
      diagnosis.push({
        finding: `${afterHours}% after-hours calls suggest missed revenue opportunities`,
        severity: 'medium' as const
      })
    }
    
    if (operationalChallenge?.includes('Scheduling')) {
      diagnosis.push({
        finding: "Dispatch and scheduling inefficiencies impacting service delivery",
        severity: 'medium' as const
      })
    }
  }
  
  return diagnosis
}

function generatePersonalizedConsequences(
  sector: 'dental' | 'hvac',
  moneyLostSummary: any
): string[] {
  const consequences = []
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0 
  }).format(amount)
  
  consequences.push(`Currently losing ${formatCurrency(moneyLostSummary.total.annual)} annually due to operational inefficiencies`)
  
  if (moneyLostSummary.areas.length > 0) {
    const topLoss = moneyLostSummary.areas[0]
    consequences.push(`${topLoss.title} alone costs ${formatCurrency(topLoss.losses.annual)} per year`)
  }
  
  if (sector === 'dental') {
    consequences.push("Patient satisfaction declining due to communication delays and missed appointments")
    consequences.push("Competitive disadvantage as modern practices adopt AI-powered patient engagement")
  } else {
    consequences.push("Customer retention at risk due to delayed emergency response and poor follow-up")
    consequences.push("Market share declining as competitors implement advanced dispatch automation")
  }
  
  return consequences
}

function generateIntelligentSolutions(
  sector: 'dental' | 'hvac',
  answers: Record<string, string | number>,
  score: number
): Array<{ skillId: string, title: string, rationale: string, icon: string }> {
  const solutions = []
  
  if (sector === 'dental') {
    const communicationChallenge = answers.dental_communication_challenge as string
    const missedAppointments = Number(answers.dental_missed_appointments) || 15
    
    if (communicationChallenge?.includes('phone') || score < 50) {
      solutions.push({
        skillId: 'ai_receptionist',
        title: 'AI Dental Receptionist',
        rationale: 'Address phone communication challenges with 24/7 intelligent call handling',
        icon: 'Phone'
      })
    }
    
    if (missedAppointments > 15) {
      solutions.push({
        skillId: 'appointment_automation',
        title: 'Smart Appointment Management',
        rationale: `Reduce ${missedAppointments}% no-show rate with intelligent reminders and scheduling`,
        icon: 'Calendar'
      })
    }
    
    solutions.push({
      skillId: 'patient_reactivation',
      title: 'Patient Reactivation System',
      rationale: 'Convert inactive patients into revenue with personalized outreach campaigns',
      icon: 'Users'
    })
  } else {
    const operationalChallenge = answers.hvac_operational_challenge as string
    const afterHours = Number(answers.hvac_after_hours_calls) || 20
    
    if (afterHours > 25 || operationalChallenge?.includes('Customer')) {
      solutions.push({
        skillId: 'emergency_dispatch',
        title: '24/7 Emergency Dispatch AI',
        rationale: `Capture ${afterHours}% after-hours calls with intelligent emergency routing`,
        icon: 'Phone'
      })
    }
    
    if (operationalChallenge?.includes('Scheduling')) {
      solutions.push({
        skillId: 'smart_scheduling',
        title: 'Intelligent Service Scheduling',
        rationale: 'Optimize technician routes and availability for maximum efficiency',
        icon: 'Calendar'
      })
    }
    
    solutions.push({
      skillId: 'maintenance_automation',
      title: 'Maintenance Contract Automation',
      rationale: 'Automate renewals and service reminders to prevent contract lapses',
      icon: 'Settings'
    })
  }
  
  return solutions
}

function generateRelevantFAQs(
  sector: 'dental' | 'hvac',
  diagnosis: Array<{ finding: string, severity: string }>
): string[] {
  const faqs = []
  
  // Always include implementation timeline
  faqs.push('implementation_timeline')
  
  if (sector === 'dental') {
    faqs.push('hipaa_compliance')
    faqs.push('pms_integration')
    
    const hasComplexIssues = diagnosis.some(d => d.severity === 'high')
    if (hasComplexIssues) {
      faqs.push('ai_escalation')
    }
  } else {
    faqs.push('technical_questions')
    faqs.push('emergency_prioritization')
    faqs.push('dispatch_integration')
    
    const hasSeasonalConcerns = diagnosis.some(d => d.finding.includes('after-hours'))
    if (hasSeasonalConcerns) {
      faqs.push('seasonal_demand')
    }
  }
  
  return faqs
}

function generateDynamicPlan(score: number, sector: 'dental' | 'hvac'): {
  name: string
  price: string
  period: string
  inclusions: string[]
  addons: string[]
} {
  if (score <= 30) {
    return {
      name: "Crisis Recovery Package",
      price: "$497",
      period: "per month",
      inclusions: [
        "24/7 AI Call Handling",
        "Emergency Prioritization System",
        "Basic Performance Analytics",
        "Dedicated Implementation Support"
      ],
      addons: [
        "Advanced CRM Integration (+$97/month)",
        "Multi-location Support (+$197/month)",
        "Custom Voice Training (+$297 setup)"
      ]
    }
  } else if (score <= 60) {
    return {
      name: "Growth Optimization Package",
      price: "$797",
      period: "per month",
      inclusions: [
        "Complete AI Assistant Suite",
        "Advanced Scheduling & Follow-up",
        "Real-time Performance Dashboard",
        "Industry-specific Customization",
        "Staff Training Program"
      ],
      addons: [
        "Premium Analytics Suite (+$197/month)",
        "Priority Technical Support (+$97/month)",
        "Additional Phone Lines (+$47/line/month)"
      ]
    }
  } else {
    return {
      name: "Enterprise Excellence Package",
      price: "$1,297",
      period: "per month",
      inclusions: [
        "Full AI Business Automation Suite",
        "Multi-channel Communication Hub",
        "Advanced Analytics & Insights",
        "Dedicated Success Manager",
        "Custom API Integration",
        "White-label Capabilities"
      ],
      addons: [
        "Advanced API Access (+$297/month)",
        "Custom Development Hours (+$197/hour)",
        "Additional Business Locations (+$97/location)"
      ]
    }
  }
}

function generateBenchmarks(
  sector: 'dental' | 'hvac',
  score: number,
  moneyLostSummary: any
): { notes: string[] } {
  const notes = []
  
  if (sector === 'dental') {
    notes.push(`Your current AI readiness score of ${score}/100 is ${score > 50 ? 'above' : 'below'} the dental industry average of 52`)
    notes.push("Top-performing practices see 40-60% reduction in no-shows with AI implementation")
    
    if (moneyLostSummary.total.annual > 50000) {
      notes.push("Practices similar to yours typically recover 45-75% of identified losses within 6 months")
    }
  } else {
    notes.push(`Your current AI readiness score of ${score}/100 compares to HVAC industry average of 48`)
    notes.push("Leading HVAC companies report 35-50% improvement in emergency response times")
    
    if (moneyLostSummary.total.annual > 75000) {
      notes.push("Similar-sized HVAC businesses typically see ROI within 3-4 months of AI implementation")
    }
  }
  
  notes.push(`Businesses in your score range typically see ${score < 40 ? '15-25%' : score < 70 ? '10-20%' : '5-15%'} revenue increase in first year`)
  
  return { notes }
}