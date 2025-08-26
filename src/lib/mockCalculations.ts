import { useAuditProgressStore } from '@/stores/auditProgressStore'

export interface LossCalculation {
  daily: number
  monthly: number
  annual: number
}

export interface LossArea {
  title: string
  subtitle: string
  losses: LossCalculation
}

export interface TotalLosses extends LossCalculation {}

// Mock calculation helper functions
export function calculateMockLosses(industry: 'dental' | 'hvac'): {
  total: TotalLosses
  areas: LossArea[]
} {
  if (industry === 'dental') {
    return calculateDentalLosses()
  } else {
    return calculateHVACLosses()
  }
}

function calculateDentalLosses(): { total: TotalLosses; areas: LossArea[] } {
  const areas: LossArea[] = [
    {
      title: "Inactive Patients",
      subtitle: "Revenue from patients who haven't returned in 6+ months",
      losses: {
        daily: 420,
        monthly: 12600,
        annual: 151200
      }
    },
    {
      title: "Lost Treatment Plans",
      subtitle: "Proposed treatments that were never completed",
      losses: {
        daily: 280,
        monthly: 8400,
        annual: 100800
      }
    }
  ]

  const total: TotalLosses = {
    daily: areas.reduce((sum, area) => sum + area.losses.daily, 0),
    monthly: areas.reduce((sum, area) => sum + area.losses.monthly, 0),
    annual: areas.reduce((sum, area) => sum + area.losses.annual, 0)
  }

  return { total, areas }
}

function calculateHVACLosses(): { total: TotalLosses; areas: LossArea[] } {
  const areas: LossArea[] = [
    {
      title: "Missed Emergency Calls",
      subtitle: "Revenue lost from unanswered after-hours emergency calls",
      losses: {
        daily: 380,
        monthly: 11400,
        annual: 136800
      }
    },
    {
      title: "Poor Follow-up",
      subtitle: "Lost maintenance contracts and repeat business opportunities",
      losses: {
        daily: 220,
        monthly: 6600,
        annual: 79200
      }
    }
  ]

  const total: TotalLosses = {
    daily: areas.reduce((sum, area) => sum + area.losses.daily, 0),
    monthly: areas.reduce((sum, area) => sum + area.losses.monthly, 0),
    annual: areas.reduce((sum, area) => sum + area.losses.annual, 0)
  }

  return { total, areas }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}