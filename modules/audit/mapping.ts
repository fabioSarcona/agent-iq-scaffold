// Map question IDs → MoneyLost area titles
export const QUESTION_TO_LOSSAREA: Record<string, string> = {
  // Dental
  daily_unanswered_calls_choice: 'Missed Calls Revenue Loss',
  weekly_no_shows_choice: 'No-Shows Revenue Loss',
  monthly_cold_treatment_plans: 'Treatment Plans Revenue Loss',
  avg_unaccepted_plan_value_usd: 'Treatment Plans Revenue Loss',
  // HVAC
  hvac_daily_unanswered_calls_choice: 'Missed Service Calls Loss',
  weekly_job_cancellations_choice: 'Last-Minute Cancellations Loss',
  monthly_pending_quotes: 'Pending Quotes Revenue Loss',
  average_pending_quote_value_usd: 'Pending Quotes Revenue Loss'
};