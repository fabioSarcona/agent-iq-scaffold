// Industry-specific pain points and challenges with AI solutions

export interface PainPoint {
  id: string
  title: string
  impact: string
  monthlyImpact: number
  solution: string
  source: string
  category: 'operational' | 'financial' | 'marketing' | 'patient' | 'seasonal' | 'customer' | 'technical'
}

export interface PainPointsModule {
  purpose: {
    description: string
    usage: string[]
  }
  dental: PainPoint[]
  hvac: PainPoint[]
}

export const painPoints: PainPointsModule = {
  purpose: {
    description: "Defines the Top 10 pain points for each niche — Dental Practices and HVAC Companies — with business problems, estimated financial impact, AI solutions from NeedAgent.AI, and source/benchmark references.",
    usage: [
      "Backbone for the Audit tool",
      "ROI simulations and calculations", 
      "Solution mapping and recommendations",
      "Personalized business assessments"
    ]
  },

  dental: [
    {
      id: "dental_no_shows",
      title: "No-Shows and Late Cancellations",
      impact: "Up to $66,000 lost annually (~$5,500/month) from two missed hygiene slots/day",
      monthlyImpact: 5500,
      solution: "Dental-Helper 24/7 — Appointment Recovery AI",
      source: "Dentistry Today 2025",
      category: "operational"
    },
    {
      id: "dental_insurance_verification",
      title: "Time-Consuming Insurance Verification",
      impact: "~$3,600/month in staff wages for insurance checks",
      monthlyImpact: 3600,
      solution: "Insurance Verify Agent",
      source: "Veritas Dental Resources 2025",
      category: "operational"
    },
    {
      id: "dental_low_value_slots",
      title: "Low-Value Appointments in Prime Slots",
      impact: "~$5,500/month in lost revenue due to poor scheduling",
      monthlyImpact: 5500,
      solution: "Smart Scheduling Assistant",
      source: "Productive Dentist Academy 2025",
      category: "operational"
    },
    {
      id: "dental_front_desk_overwhelm",
      title: "Front Desk Overwhelmed by Routine Calls",
      impact: "~$13,000/month in lost productivity",
      monthlyImpact: 13000,
      solution: "Virtual Receptionist AI",
      source: "Dental Economics 2024",
      category: "operational"
    },
    {
      id: "dental_post_op_compliance",
      title: "Patients Forgetting Post-Op Instructions",
      impact: "Up to 40% non-compliance; ~$1,000/month in repeat visits & complications",
      monthlyImpact: 1000,
      solution: "Post-Op Follow-Up Agent",
      source: "King's College London Study (2013)",
      category: "patient"
    },
    {
      id: "dental_cancellation_backfill",
      title: "Last-Minute Cancellations Not Backfilled",
      impact: "Up to $10,000/month lost from unfilled canceled slots",
      monthlyImpact: 10000,
      solution: "Auto Waitlist Caller",
      source: "Dental Economics 2024",
      category: "operational"
    },
    {
      id: "dental_treatment_plans",
      title: "Unaccepted Treatment Plans (Case Presentation Leakage)",
      impact: "$500K–$1M in unscheduled treatments; ~$40K/month lost",
      monthlyImpact: 40000,
      solution: "Voice Deal Closer",
      source: "ADA via Drilldown Solution",
      category: "financial"
    },
    {
      id: "dental_repetitive_questions",
      title: "Repetitive Questions About Costs & Insurance",
      impact: "60% call abandonment when on hold; ~$4,000/month lost",
      monthlyImpact: 4000,
      solution: "Dynamic FAQ Voice Agent",
      source: "CallRail/Spectrio 2021",
      category: "patient"
    },
    {
      id: "dental_new_patient_inflow",
      title: "Low Inflow of New Patients (Cash-Pay)",
      impact: "~$5,000/month lost from missed opportunities",
      monthlyImpact: 5000,
      solution: "New Patient Lead Agent",
      source: "DentistryIQ 2020",
      category: "marketing"
    },
    {
      id: "dental_online_reputation",
      title: "Insufficient Online Reviews & Reputation",
      impact: "~70% of prospects lost; ~$3,000/month impact",
      monthlyImpact: 3000,
      solution: "Review Booster Agent",
      source: "Patient News 2024",
      category: "marketing"
    }
  ],

  hvac: [
    {
      id: "hvac_emergency_calls",
      title: "Missed Emergency Calls After Hours",
      impact: "~$3,800/month lost (27% call miss rate)",
      monthlyImpact: 3800,
      solution: "HVAC-Helper 24/7",
      source: "Invoca/EVS7 2023",
      category: "operational"
    },
    {
      id: "hvac_dispatcher_overload",
      title: "Dispatcher Overload in Peak Season",
      impact: "~$5,000/month lost from abandoned calls",
      monthlyImpact: 5000,
      solution: "HVAC Call Triage Agent",
      source: "Forrester/Moneypenny 2023",
      category: "seasonal"
    },
    {
      id: "hvac_eta_updates",
      title: "Technicians Not Updating Customers on ETA",
      impact: "55% of complaints; ~$2,000/month revenue loss",
      monthlyImpact: 2000,
      solution: "Automated Tech ETA Caller",
      source: "Workyard HVAC Report 2024",
      category: "customer"
    },
    {
      id: "hvac_old_systems",
      title: "Not Filtering Out Very Old Systems",
      impact: "~$6,000/month lost replacement opportunities",
      monthlyImpact: 6000,
      solution: "Replacement Qualifier IVR",
      source: "Workyard HVAC Statistics 2024",
      category: "operational"
    },
    {
      id: "hvac_payment_collection",
      title: "Difficulty Collecting Payments After Service",
      impact: "~$3,000/month tied in late payments (81% past due)",
      monthlyImpact: 3000,
      solution: "Pay-By-Voice Agent",
      source: "Inc.com Late Payments Survey 2023",
      category: "financial"
    },
    {
      id: "hvac_preventative_maintenance",
      title: "Unsold Preventative Maintenance/Tune-Ups",
      impact: "~$2,000/month lost seasonal work",
      monthlyImpact: 2000,
      solution: "Seasonal Outreach Agent",
      source: "Energy.gov via Workyard 2024",
      category: "seasonal"
    },
    {
      id: "hvac_quote_followup",
      title: "Quotes & Proposals Not Followed Up",
      impact: "~$25,000/month missed in unclosed proposals",
      monthlyImpact: 25000,
      solution: "Follow-Up Sales Agent",
      source: "ServiceTitan HVAC Report 2023",
      category: "financial"
    },
    {
      id: "hvac_nuisance_calls",
      title: "Technicians Wasting Time on 'Nuisance' Calls",
      impact: "~$1,600/month lost (20% of calls = truck rolls)",
      monthlyImpact: 1600,
      solution: "Virtual Troubleshooter IVR",
      source: "XOi HVAC Report 2023",
      category: "technical"
    },
    {
      id: "hvac_online_reviews",
      title: "Lack of Online Reviews After Service",
      impact: "~$3,000/month lost due to weak reputation",
      monthlyImpact: 3000,
      solution: "HVAC Review Booster",
      source: "BrightLocal 2023",
      category: "marketing"
    },
    {
      id: "hvac_communication_gaps",
      title: "Communication Gaps & Mis-Routed Calls",
      impact: "Indirect revenue loss from inefficiency & churn",
      monthlyImpact: 2500,
      solution: "Intelligent Call Router",
      source: "Industry Best Practice (Internal Data)",
      category: "operational"
    }
  ]
}

// Helper functions for accessing pain points data
export function getAllPainPoints(): PainPoint[] {
  return [...painPoints.dental, ...painPoints.hvac]
}

export function getPainPointsByVertical(vertical: 'dental' | 'hvac'): PainPoint[] {
  return painPoints[vertical]
}

export function getPainPointsByCategory(category: PainPoint['category']): PainPoint[] {
  return getAllPainPoints().filter(point => point.category === category)
}

export function findPainPointById(id: string): PainPoint | undefined {
  return getAllPainPoints().find(point => point.id === id)
}

export function calculateTotalMonthlyImpact(vertical?: 'dental' | 'hvac'): number {
  const points = vertical ? getPainPointsByVertical(vertical) : getAllPainPoints()
  return points.reduce((total, point) => total + point.monthlyImpact, 0)
}

export function getPainPointsBySolution(solutionName: string): PainPoint[] {
  return getAllPainPoints().filter(point => 
    point.solution.toLowerCase().includes(solutionName.toLowerCase())
  )
}

export default painPoints