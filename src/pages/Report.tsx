import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function Report() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Audit Report</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis and recommendations for your business
        </p>
      </div>

      <Card className="text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Detailed audit reports with insights and action plans are in development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your personalized audit report will include performance metrics, 
            improvement opportunities, and a step-by-step action plan for growth.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}