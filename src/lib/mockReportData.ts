import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { calculateMockLosses, formatCurrency } from './mockCalculations'

export interface BusinessScore {
  score: number
  band: 'crisis' | 'optimization' | 'growth' | 'optimized'
  label: string
  color: string
}

export interface DiagnosisItem {
  finding: string
  severity: 'high' | 'medium' | 'low'
}

export interface Solution {
  title: string
  benefit: string
  icon: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface RecommendedPlan {
  tier: string
  price: string
  period: string
  inclusions: string[]
  addOns: string[]
}

// Calculate business score based on mock criteria
export function calculateBusinessScore(industry: 'dental' | 'hvac'): BusinessScore {
  // Mock scoring algorithm - in real app would be based on audit answers
  const baseScore = 35 + Math.floor(Math.random() * 40) // 35-75 range for demo
  
  let band: BusinessScore['band']
  let label: string
  let color: string
  
  if (baseScore <= 25) {
    band = 'crisis'
    label = 'Crisis'
    color = 'hsl(0, 84%, 60%)'
  } else if (baseScore <= 50) {
    band = 'optimization'
    label = 'Optimization Needed'
    color = 'hsl(32, 95%, 44%)'
  } else if (baseScore <= 75) {
    band = 'growth'
    label = 'Growth Ready'
    color = 'hsl(45, 93%, 47%)'
  } else {
    band = 'optimized'
    label = 'AI-Optimized'
    color = 'hsl(120, 60%, 50%)'
  }
  
  return { score: baseScore, band, label, color }
}

export function generateDiagnosis(industry: 'dental' | 'hvac'): DiagnosisItem[] {
  if (industry === 'dental') {
    return [
      { finding: "Patient communication gaps identified in after-hours coverage", severity: 'high' },
      { finding: "Appointment scheduling inefficiencies causing revenue loss", severity: 'medium' },
      { finding: "Treatment plan follow-up system needs automation", severity: 'medium' },
      { finding: "Insurance verification process slowing patient flow", severity: 'low' }
    ]
  } else {
    return [
      { finding: "Emergency call response delays costing potential revenue", severity: 'high' },
      { finding: "Maintenance contract renewals falling through cracks", severity: 'medium' },
      { finding: "Service scheduling coordination needs improvement", severity: 'medium' },
      { finding: "Customer follow-up communications inconsistent", severity: 'low' }
    ]
  }
}

export function generateConsequences(industry: 'dental' | 'hvac'): string[] {
  const lossData = calculateMockLosses(industry)
  
  if (industry === 'dental') {
    return [
      `Losing ${formatCurrency(lossData.areas[0].losses.annual)} annually from inactive patients`,
      `Missing ${formatCurrency(lossData.areas[1].losses.annual)} in uncompleted treatment plans`,
      "Patient satisfaction declining due to communication gaps",
      "Competitive disadvantage as other practices adopt AI solutions"
    ]
  } else {
    return [
      `Losing ${formatCurrency(lossData.areas[0].losses.annual)} annually from missed emergency calls`,
      `Missing ${formatCurrency(lossData.areas[1].losses.annual)} in lost maintenance contracts`,
      "Customer retention suffering due to poor follow-up",
      "Market share declining as competitors improve service efficiency"
    ]
  }
}

export function generateSolutions(industry: 'dental' | 'hvac'): Solution[] {
  if (industry === 'dental') {
    return [
      {
        title: "AI Dental Receptionist",
        benefit: "24/7 appointment scheduling and patient inquiries",
        icon: "Phone"
      },
      {
        title: "Treatment Plan Follow-up",
        benefit: "Automated reminders for pending treatments",
        icon: "Calendar"
      },
      {
        title: "Insurance Verification",
        benefit: "Instant insurance coverage confirmation",
        icon: "Shield"
      },
      {
        title: "Patient Reactivation",
        benefit: "Smart outreach to inactive patients",
        icon: "Users"
      }
    ]
  } else {
    return [
      {
        title: "24/7 Emergency Dispatch",
        benefit: "Never miss another emergency service call",
        icon: "Phone"
      },
      {
        title: "Smart Service Scheduling",
        benefit: "Optimize technician routes and availability",
        icon: "Calendar"
      },
      {
        title: "Maintenance Contract Automation",
        benefit: "Automated renewals and service reminders",
        icon: "Settings"
      },
      {
        title: "Customer Follow-up System",
        benefit: "Ensure every job gets proper closure",
        icon: "CheckCircle"
      }
    ]
  }
}

export function generateFAQ(industry: 'dental' | 'hvac'): FAQItem[] {
  if (industry === 'dental') {
    return [
      {
        question: "How does AI handle patient privacy and HIPAA compliance?",
        answer: "Our AI system is fully HIPAA compliant with end-to-end encryption and secure data handling protocols."
      },
      {
        question: "Can it integrate with our existing practice management software?",
        answer: "Yes, we offer seamless integration with major PMS platforms including Dentrix, Eaglesoft, and Open Dental."
      },
      {
        question: "What happens if the AI can't handle a complex patient question?",
        answer: "The system intelligently escalates complex cases to your staff while handling routine inquiries automatically."
      },
      {
        question: "How long does implementation typically take?",
        answer: "Most practices are fully operational within 2-3 weeks, including staff training and system customization."
      }
    ]
  } else {
    return [
      {
        question: "How does the AI handle technical HVAC questions?",
        answer: "Our AI is trained on HVAC-specific knowledge and escalates complex technical issues to your technicians."
      },
      {
        question: "Can it prioritize emergency calls appropriately?",
        answer: "Yes, the system uses intelligent routing to identify and prioritize true emergencies based on your criteria."
      },
      {
        question: "What about integration with our dispatch software?",
        answer: "We integrate with popular dispatch systems like ServiceTitan, Housecall Pro, and FieldEdge."
      },
      {
        question: "How does it handle seasonal demand fluctuations?",
        answer: "The AI adapts to seasonal patterns and can automatically adjust availability and messaging based on demand."
      }
    ]
  }
}

export function generateRecommendedPlan(score: number): RecommendedPlan {
  if (score <= 25) {
    return {
      tier: "Emergency Response Package",
      price: "$497",
      period: "per month",
      inclusions: [
        "24/7 AI Call Handling",
        "Emergency Prioritization",
        "Basic CRM Integration",
        "Monthly Performance Reports"
      ],
      addOns: [
        "Advanced Analytics (+$97/month)",
        "Multi-location Support (+$197/month)",
        "Custom Voice Training (+$297 setup)"
      ]
    }
  } else if (score <= 50) {
    return {
      tier: "Growth Accelerator Package",
      price: "$797",
      period: "per month",
      inclusions: [
        "Full AI Assistant Suite",
        "Advanced Scheduling & Follow-up",
        "Performance Analytics",
        "Staff Training & Support",
        "CRM Integration"
      ],
      addOns: [
        "Industry-Specific Customization (+$197/month)",
        "Priority Support (+$97/month)",
        "Additional Phone Lines (+$47/line)"
      ]
    }
  } else {
    return {
      tier: "Enterprise Optimization Package",
      price: "$1,297",
      period: "per month",
      inclusions: [
        "Complete AI Business Suite",
        "Multi-Channel Communication",
        "Advanced Analytics & Insights",
        "Dedicated Success Manager",
        "Custom Integrations",
        "White-Label Options"
      ],
      addOns: [
        "API Access (+$297/month)",
        "Custom Development Hours (+$197/hour)",
        "Additional Locations (+$97/location)"
      ]
    }
  }
}