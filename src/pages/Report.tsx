import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BusinessScoreGauge } from '@/components/ui/business-score-gauge'
import { 
  FileText, 
  AlertTriangle, 
  TrendingDown, 
  Phone, 
  Calendar, 
  Shield, 
  Users, 
  Settings, 
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { supabase } from '@/integrations/supabase/client'
import { calculateRealLosses } from '../../modules/moneylost/moneylost'
import { knowledgeBase } from '@/kb/index'
import { useState, useEffect } from 'react'

const iconMap = {
  Phone,
  Calendar,
  Shield,
  Users,
  Settings,
  CheckCircle
}

interface ReportData {
  score: number
  diagnosis: Array<{ finding: string, severity: 'high' | 'medium' | 'low' }>
  consequences: string[]
  solutions: Array<{ skillId: string, title: string, rationale: string, icon: string }>
  faqIds: string[]
  plan: { name: string, price: string, period: string, inclusions: string[], addons: string[] }
  benchmarks: { notes: string[] }
}

export default function Report() {
  const { industry, auditAnswers } = useAuditProgressStore()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const currentIndustry = (industry || 'dental') as 'dental' | 'hvac'
  
  useEffect(() => {
    generateReport()
  }, [currentIndustry, auditAnswers])
  
  const generateReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Calculate money lost summary using real calculations
      const moneyLostSummary = calculateRealLosses(currentIndustry, auditAnswers || {})
      
      // Prepare input for edge function
      const input = {
        sector: currentIndustry,
        answers: auditAnswers || {},
        moneyLostSummary,
        kbSlices: {
          brandTone: knowledgeBase.brand.voiceTone,
          voiceSkills: knowledgeBase.voice,
          painPoints: knowledgeBase.painPoints[currentIndustry],
          pricing: knowledgeBase.pricing
        }
      }
      
      // Call the edge function
      const { data, error: supabaseError } = await supabase.functions.invoke('ai_generate_report', {
        body: input
      })
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      setReportData(data)
    } catch (err) {
      console.error('Error generating report:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Generating Your Report...</h1>
          <p className="text-lg text-muted-foreground">Analyzing your business data and creating personalized recommendations</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-4 bg-muted rounded w-3/4"></div></CardHeader>
              <CardContent><div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-destructive">Report Generation Failed</h1>
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button onClick={generateReport} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }
  
  if (!reportData) return null
  
  // Convert score to business score format for gauge component
  const businessScore = {
    score: reportData.score,
    label: reportData.score <= 30 ? 'Crisis' : reportData.score <= 60 ? 'Growth Ready' : 'AI-Optimized',
    color: reportData.score <= 30 ? 'hsl(0, 84%, 60%)' : reportData.score <= 60 ? 'hsl(45, 93%, 47%)' : 'hsl(120, 60%, 50%)'
  }
  
  // Convert solutions to match expected format
  const solutions = reportData.solutions.map(sol => ({
    title: sol.title,
    benefit: sol.rationale,
    icon: sol.icon
  }))
  
  // Generate FAQ data (using fallback for now)
  const faq = [
    { question: "How long does implementation take?", answer: "Most businesses are operational within 2-3 weeks." },
    { question: "Is my data secure?", answer: "Yes, we use enterprise-grade security with full compliance." },
    { question: "Can it integrate with existing systems?", answer: "We offer seamless integration with major platforms." },
    { question: "What if it can't handle complex questions?", answer: "The system intelligently escalates to your team when needed." }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Business Evaluation Report</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive AI analysis with actionable recommendations
        </p>
      </div>

      {/* Business Score Section */}
      <Card className="text-center">
        <CardHeader className="pb-8">
          <CardTitle className="text-2xl mb-6">Your Business AI Readiness Score</CardTitle>
          <BusinessScoreGauge 
            score={businessScore.score}
            label={businessScore.label}
            color={businessScore.color}
            size={280}
          />
        </CardHeader>
      </Card>

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
            {reportData.diagnosis.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Badge 
                  variant={item.severity === 'high' ? 'destructive' : item.severity === 'medium' ? 'secondary' : 'outline'}
                  className="mt-1"
                >
                  {item.severity}
                </Badge>
                <p className="text-sm text-foreground flex-1">{item.finding}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Consequences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle>Consequences</CardTitle>
            </div>
            <CardDescription>Impact of current inefficiencies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportData.consequences.map((consequence, index) => (
              <div key={index} className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                <p className="text-sm text-foreground">{consequence}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Solutions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">AI Voice Solutions</CardTitle>
          <CardDescription>Intelligent automation capabilities for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {solutions.map((solution, index) => {
              const IconComponent = iconMap[solution.icon as keyof typeof iconMap]
              return (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{solution.title}</h4>
                    <p className="text-sm text-muted-foreground">{solution.benefit}</p>
                  </div>
                </div>
              )
            })}
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
          <Accordion type="single" collapsible className="w-full">
            {faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Recommended Plan Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-xl">Recommended Plan</CardTitle>
          <CardDescription>Tailored solution based on your business score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">{reportData.plan.name}</h3>
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-3xl font-bold text-primary">{reportData.plan.price}</span>
              <span className="text-muted-foreground">{reportData.plan.period}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Included Features</h4>
              <ul className="space-y-2">
                {reportData.plan.inclusions.map((inclusion, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground">{inclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Available Add-ons</h4>
              <ul className="space-y-2">
                {reportData.plan.addons.map((addOn, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{addOn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Benchmarks Section */}
          {reportData.benchmarks.notes.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold text-foreground mb-3">Industry Benchmarks</h4>
              <ul className="space-y-2">
                {reportData.benchmarks.notes.map((note, index) => (
                  <li key={index} className="text-sm text-muted-foreground">• {note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center pt-4">
            <Button size="lg" className="bg-brand-gradient text-white">
              Get Started with AI Transformation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}