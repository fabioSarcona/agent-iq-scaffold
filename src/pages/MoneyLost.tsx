import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default function MoneyLost() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Revenue Loss Analysis</h1>
        <p className="text-muted-foreground">
          Calculate potential revenue lost due to operational inefficiencies
        </p>
      </div>

      <Card className="text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Advanced revenue analysis and loss calculation tools are being developed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will analyze your business data to identify areas where revenue 
            is being lost and provide actionable recommendations for improvement.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}