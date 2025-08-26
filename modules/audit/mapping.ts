// Question ID to Loss Area mapping with weights for ROI calculations
// This will be used later for money-loss calculations

export const questionMapping = {
  // Dental Practice Mappings
  dental_new_patients: {
    lossArea: "Missed Lead Conversion",
    weight: 0.8
  },
  dental_communication_challenge: {
    lossArea: "Communication Inefficiency",
    weight: 0.6
  },
  dental_appointment_confirmations: {
    lossArea: "Manual Process Time Loss",
    weight: 0.5
  },
  dental_missed_appointments: {
    lossArea: "No-Show Revenue Loss",
    weight: 0.9
  },
  dental_revenue_services: {
    lossArea: "Revenue Optimization",
    weight: 0.7
  },
  dental_time_saver: {
    lossArea: "Operational Efficiency",
    weight: 0.6
  },
  
  // HVAC Business Mappings
  daily_unanswered_calls_choice: {
    lossArea: "Missed Service Calls Loss",
    weight: 0.25
  },
  missed_call_estimated_value_usd: {
    lossArea: "Missed Service Calls Loss", 
    weight: 0.25
  },
  weekly_job_cancellations_choice: {
    lossArea: "Last-Minute Cancellations Loss",
    weight: 0.20
  },
  avg_canceled_job_value_usd: {
    lossArea: "Last-Minute Cancellations Loss",
    weight: 0.20
  },
  monthly_pending_quotes: {
    lossArea: "Pending Quotes Revenue Loss",
    weight: 0.25
  },
  average_pending_quote_value_usd: {
    lossArea: "Pending Quotes Revenue Loss",
    weight: 0.25
  },
  busy_season_turnaway_rate_choice: {
    lossArea: "Capacity Overflow Loss",
    weight: 0.20
  }
} as const;

export function getQuestionMapping(questionId: string) {
  return questionMapping[questionId as keyof typeof questionMapping];
}