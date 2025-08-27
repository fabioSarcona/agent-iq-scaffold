import { supabase } from '@/integrations/supabase/client'
import type { GenerateReportRequest, GenerateReportResponse, Vertical } from './report.contract'

export async function requestVoiceFitReport({ 
  vertical, 
  answers 
}: { 
  vertical: Vertical
  answers: Record<string, unknown> 
}): Promise<GenerateReportResponse> {
  const { data, error } = await supabase.functions.invoke('ai_generate_report', {
    body: { vertical, answers } as GenerateReportRequest
  })

  if (error) {
    console.error('Error generating report:', error)
    throw new Error(`Failed to generate report: ${error.message}`)
  }

  return data as GenerateReportResponse
}