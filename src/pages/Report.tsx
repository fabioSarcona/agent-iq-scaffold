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
import { 
  calculateBusinessScore, 
  generateDiagnosis, 
  generateConsequences, 
  generateSolutions, 
  generateFAQ, 
  generateRecommendedPlan 
} from '@/lib/mockReportData'

const iconMap = {
  Phone,
  Calendar,
  Shield,
  Users,
  Settings,
  CheckCircle
}

export default function Report() {
  const { industry } = useAuditProgressStore()
  const currentIndustry = (industry || 'dental') as 'dental' | 'hvac'
  
  const businessScore = calculateBusinessScore(currentIndustry)
  const diagnosis = generateDiagnosis(currentIndustry)
  const consequences = generateConsequences(currentIndustry)
  const solutions = generateSolutions(currentIndustry)
  const faq = generateFAQ(currentIndustry)
  const recommendedPlan = generateRecommendedPlan(businessScore.score)

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
            {diagnosis.map((item, index) => (
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
            {consequences.map((consequence, index) => (
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
            <h3 className="text-2xl font-bold text-foreground">{recommendedPlan.tier}</h3>
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-3xl font-bold text-primary">{recommendedPlan.price}</span>
              <span className="text-muted-foreground">{recommendedPlan.period}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Included Features</h4>
              <ul className="space-y-2">
                {recommendedPlan.inclusions.map((inclusion, index) => (
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
                {recommendedPlan.addOns.map((addOn, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{addOn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

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