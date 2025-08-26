export interface LossCalculation {
  daily: number
  monthly: number
  annual: number
}

export interface RecoverableRange {
  min: number // percentage
  max: number // percentage
}

export interface LossArea {
  title: string
  subtitle: string
  losses: LossCalculation
  recoverableRange: RecoverableRange
}

export interface TotalLosses extends LossCalculation {}

export interface CalculationInputs {
  [questionId: string]: string | number | undefined
}

// Industry business metrics (conservative estimates)
const DENTAL_METRICS = {
  averagePatientValue: 350, // per visit
  treatmentPlanValues: {
    'Cleanings and preventive care': 200,
    'Cosmetic procedures': 1200,
    'Orthodontics': 800,
    'Oral surgery': 600
  },
  defaultTreatmentValue: 400,
  workingDaysPerMonth: 22,
  workingDaysPerYear: 252
}

const HVAC_METRICS = {
  emergencyCallValue: 300, // average emergency call
  maintenanceContractValue: 800, // annual contract
  averageServiceCall: 180,
  workingDaysPerMonth: 22,
  workingDaysPerYear: 252
}

export function calculateRealLosses(
  industry: 'dental' | 'hvac',
  auditAnswers: CalculationInputs
): { total: TotalLosses; areas: LossArea[] } {
  if (industry === 'dental') {
    return calculateDentalRealLosses(auditAnswers)
  } else {
    return calculateHVACRealLosses(auditAnswers)
  }
}

function calculateDentalRealLosses(answers: CalculationInputs): {
  total: TotalLosses
  areas: LossArea[]
} {
  const newPatientsPerMonth = Number(answers.dental_new_patients) || 20
  const missedAppointmentRate = Number(answers.dental_missed_appointments) || 15
  const revenueService = answers.dental_revenue_services as string || 'Cleanings and preventive care'
  
  // Conservative calculations
  const areas: LossArea[] = []

  // 1. Inactive Patients Loss
  // Assume 30% of existing patients become inactive annually
  // Conservative: only 45% are recoverable
  const estimatedPatientBase = newPatientsPerMonth * 12 * 3 // 3 years of growth
  const inactivePatients = estimatedPatientBase * 0.30
  const inactivePatientDaily = (inactivePatients * DENTAL_METRICS.averagePatientValue * 0.45) / DENTAL_METRICS.workingDaysPerYear
  
  areas.push({
    title: "Inactive Patients",
    subtitle: "Revenue from patients who haven't returned in 6+ months",
    losses: {
      daily: Math.round(inactivePatientDaily),
      monthly: Math.round(inactivePatientDaily * DENTAL_METRICS.workingDaysPerMonth),
      annual: Math.round(inactivePatientDaily * DENTAL_METRICS.workingDaysPerYear)
    },
    recoverableRange: { min: 35, max: 55 }
  })

  // 2. Missed Appointments Loss
  // Based on reported missed appointment rate
  const dailyAppointments = (newPatientsPerMonth * 2) / DENTAL_METRICS.workingDaysPerMonth // patients visit 2x/month on average
  const missedDaily = dailyAppointments * (missedAppointmentRate / 100)
  const treatmentValue = DENTAL_METRICS.treatmentPlanValues[revenueService as keyof typeof DENTAL_METRICS.treatmentPlanValues] 
    || DENTAL_METRICS.defaultTreatmentValue
  const missedAppointmentLoss = missedDaily * treatmentValue * 0.60 // 60% could be rescheduled
  
  areas.push({
    title: "Lost Treatment Plans", 
    subtitle: "Missed appointments and unscheduled treatments",
    losses: {
      daily: Math.round(missedAppointmentLoss),
      monthly: Math.round(missedAppointmentLoss * DENTAL_METRICS.workingDaysPerMonth),
      annual: Math.round(missedAppointmentLoss * DENTAL_METRICS.workingDaysPerYear)
    },
    recoverableRange: { min: 40, max: 65 }
  })

  const total: TotalLosses = {
    daily: areas.reduce((sum, area) => sum + area.losses.daily, 0),
    monthly: areas.reduce((sum, area) => sum + area.losses.monthly, 0),
    annual: areas.reduce((sum, area) => sum + area.losses.annual, 0)
  }

  return { total, areas }
}

function calculateHVACRealLosses(answers: CalculationInputs): {
  total: TotalLosses
  areas: LossArea[]
} {
  const servicCallsPerWeek = Number(answers.hvac_service_calls) || 15
  const afterHoursRate = Number(answers.hvac_after_hours_calls) || 25
  const profitableService = answers.hvac_profitable_services as string || 'Repair services'
  
  const areas: LossArea[] = []

  // 1. Missed Emergency Calls
  // After-hours calls are higher value but harder to answer
  const weeklyAfterHoursCalls = servicCallsPerWeek * (afterHoursRate / 100)
  const dailyAfterHoursCalls = weeklyAfterHoursCalls / 7
  const missedEmergencyRate = 0.35 // assume 35% of after-hours calls are missed
  const missedEmergencyDaily = dailyAfterHoursCalls * missedEmergencyRate * HVAC_METRICS.emergencyCallValue * 0.70 // 70% could be captured
  
  areas.push({
    title: "Missed Emergency Calls",
    subtitle: "Revenue lost from unanswered after-hours emergency calls", 
    losses: {
      daily: Math.round(missedEmergencyDaily),
      monthly: Math.round(missedEmergencyDaily * 30),
      annual: Math.round(missedEmergencyDaily * 365)
    },
    recoverableRange: { min: 35, max: 50 }
  })

  // 2. Poor Follow-up (Maintenance Contracts)
  // Based on service call volume and follow-up efficiency
  const dailyServiceCalls = (servicCallsPerWeek * 52) / 365
  const followUpConversionRate = 0.15 // 15% of service calls could convert to maintenance
  const poorFollowUpRate = 0.60 // assume 60% of potential conversions are lost due to poor follow-up
  const lostMaintenanceDaily = dailyServiceCalls * followUpConversionRate * poorFollowUpRate * (HVAC_METRICS.maintenanceContractValue / 365)
  
  areas.push({
    title: "Poor Follow-up",
    subtitle: "Lost maintenance contracts and repeat business opportunities",
    losses: {
      daily: Math.round(lostMaintenanceDaily),
      monthly: Math.round(lostMaintenanceDaily * 30),
      annual: Math.round(lostMaintenanceDaily * 365)
    },
    recoverableRange: { min: 40, max: 60 }
  })

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