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
  hvac_service_calls: {
    lossArea: "Capacity Utilization",
    weight: 0.7
  },
  hvac_operational_challenge: {
    lossArea: "Operational Inefficiency",
    weight: 0.8
  },
  hvac_emergency_calls: {
    lossArea: "Emergency Response Revenue",
    weight: 0.9
  },
  hvac_after_hours_calls: {
    lossArea: "After-Hours Revenue Loss",
    weight: 0.8
  },
  hvac_profitable_services: {
    lossArea: "Revenue Optimization",
    weight: 0.7
  },
  hvac_customer_satisfaction: {
    lossArea: "Customer Retention",
    weight: 0.6
  }
} as const;

export function getQuestionMapping(questionId: string) {
  return questionMapping[questionId as keyof typeof questionMapping];
}