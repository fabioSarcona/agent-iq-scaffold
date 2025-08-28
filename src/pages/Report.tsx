import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, AlertTriangle, TrendingDown, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// Import from audit and AI modules
import { useAuditProgressStore } from '@modules/audit'
import { 
  ScoreGauge, 
  BenchmarkNote, 
  SolutionCard, 
  FAQAccordion, 
  PlanCard,
  requestVoiceFitReport,
  type VoiceFitReportData 
} from '@modules/ai/voicefit'

export default function Report() {
  const { vertical, answers } = useAuditProgressStore()
  const currentVertical = (vertical || 'dental') as 'dental' | 'hvac'
  
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['voicefit-report', currentVertical, answers],
    queryFn: () => requestVoiceFitReport({ 
      vertical: currentVertical, 
      answers: answers || {} 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Generating your VoiceFit Report...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-[900px] mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Error Generating Report</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!reportData) return null

  return (
    <div className="max-w-[900px] mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Final Evaluation — VoiceFit Report™</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive business analysis with AI-powered recommendations
        </p>
      </div>

      {/* Business Score Section */}
      <Card className="text-center">
        <CardHeader className="pb-8">
          <CardTitle className="text-2xl mb-6">Your Business AI Readiness Score</CardTitle>
          <ScoreGauge score={reportData.score} />
        </CardHeader>
      </Card>

      {/* Benchmark Note */}
      <BenchmarkNote notes={reportData.benchmarks || []} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Diagnosis Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Diagnosis</CardTitle>
            </div>
            <CardDescription>Key findings from your business analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {reportData.diagnosis.map((finding, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{finding}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Consequences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle>Consequences</CardTitle>
            </div>
            <CardDescription>Quantified impact of inefficiencies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {reportData.consequences.map((consequence, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                  <p className="text-sm text-foreground">{consequence}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Solutions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">AI Voice Solutions</CardTitle>
          <CardDescription>Recommended automation capabilities for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reportData.solutions.map((solution, index) => (
              <SolutionCard key={index} solution={solution} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
          <CardDescription>Common concerns about AI implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <FAQAccordion items={reportData.faq} />
        </CardContent>
      </Card>

      {/* Recommended Plan Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Recommended Plan</h2>
        <PlanCard plan={reportData.plan} />
      </div>
    </div>
  )
}